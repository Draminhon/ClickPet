/**
 * Split Payment Service
 *
 * Handles the automatic split between ClickPet and partner petshops.
 * When a customer pays for an order, the partner's share is sent via PIX
 * and the rest is retained by ClickPet as a platform fee.
 *
 * Flow:
 *   1. Payment confirmed (webhook or polling)
 *   2. processPartnerPayout() is called
 *   3. System looks up partner's PIX config
 *   4. Calculates the partner's share of the order total
 *   5. Sends PIX via ASAAS POST /v3/transfers
 *   6. Records split status on the Order
 */

import Order from '@/models/Order';
import User from '@/models/User';
import { createPixTransfer, mapPixKeyTypeAsaas } from '@/lib/asaas';

// Default split: ClickPet keeps 15% (commission), Partner gets 85% (pure)
const PLATFORM_FEE_PERCENTAGE = parseInt(process.env.CLICKPET_SPLIT_PERCENTAGE || '15', 10);
const PARTNER_PERCENTAGE = 100 - PLATFORM_FEE_PERCENTAGE;

export interface SplitResult {
    success: boolean;
    splitAmount: number;     // R$ sent to partner
    platformFee: number;     // R$ retained by ClickPet
    pixId?: string;          // ASAAS PIX transfer ID
    error?: string;          // Error message if failed
}

/**
 * Process the partner payout for a confirmed order.
 * Sends 90% of the order total to the partner's PIX key.
 * 
 * @param order - Mongoose Order document (must have partnerId and total)
 * @returns SplitResult with success/failure details
 */
export async function processPartnerPayout(order: any): Promise<SplitResult> {
    const orderId = order._id.toString();
    const logPrefix = `[Split] Order ${orderId}`;

    try {
        // Fast-path skip using the caller's (possibly stale) in-memory copy —
        // just avoids a wasted round-trip; the real guard against double
        // processing is the atomic claim below.
        if (order.splitStatus === 'completed') {
            console.log(`${logPrefix} Split already completed, skipping.`);
            return {
                success: true,
                splitAmount: order.splitAmount || 0,
                platformFee: order.platformFee || 0,
                pixId: order.splitPixId,
            };
        }

        // Atomically claim the payout: the filter only matches if
        // splitStatus is still neither 'processing' nor 'completed' at write
        // time. Two concurrent triggers (ASAAS webhook + the app's
        // check-status polling both fire right when a PIX settles) can each
        // read a stale 'pending' order before either writes — a plain
        // "read splitStatus, then save 'processing'" is not atomic and let
        // both proceed to send the PIX transfer, paying the partner twice.
        // This conditional update lets only one caller win the claim.
        const claimed = await Order.findOneAndUpdate(
            { _id: order._id, splitStatus: { $nin: ['processing', 'completed'] } },
            { $set: { splitStatus: 'processing' } },
            { new: true },
        );

        if (!claimed) {
            console.log(`${logPrefix} Split already claimed by another process, skipping.`);
            const current = await Order.findById(order._id);
            if (current?.splitStatus === 'completed') {
                return {
                    success: true,
                    splitAmount: current.splitAmount || 0,
                    platformFee: current.platformFee || 0,
                    pixId: current.splitPixId,
                };
            }
            return {
                success: false,
                splitAmount: 0,
                platformFee: 0,
                error: 'Split already in progress',
            };
        }

        // Keep working with the freshly claimed document from here on.
        order = claimed;

        // Fetch partner's PIX configuration
        const partner = await User.findById(order.partnerId);
        if (!partner) {
            const error = 'Partner not found';
            console.error(`${logPrefix} ${error}`);
            order.splitStatus = 'failed';
            order.splitError = error;
            await order.save();
            return { success: false, splitAmount: 0, platformFee: 0, error };
        }

        // Check if partner has PIX configured
        if (!partner.pixConfig?.key) {
            const error = `Partner ${partner.name} (${partner._id}) não tem chave PIX cadastrada`;
            console.warn(`${logPrefix} ${error}`);
            order.splitStatus = 'skipped';
            order.splitError = error;
            // Still calculate what WOULD be owed
            const partnerShare = calculatePartnerShare(order.total);
            const clickpetShare = Math.round((order.total - partnerShare) * 100) / 100;
            order.splitAmount = partnerShare;
            order.platformFee = clickpetShare;
            await order.save();
            return { success: false, splitAmount: partnerShare, platformFee: clickpetShare, error };
        }

        // Calculate split amounts
        const partnerShare = calculatePartnerShare(order.total);
        const clickpetShare = Math.round((order.total - partnerShare) * 100) / 100;

        console.log(`${logPrefix} Total: R$ ${order.total.toFixed(2)}`);
        console.log(`${logPrefix} Partner share (${PARTNER_PERCENTAGE}%): R$ ${partnerShare.toFixed(2)}`);
        console.log(`${logPrefix} ClickPet fee (${PLATFORM_FEE_PERCENTAGE}%): R$ ${clickpetShare.toFixed(2)}`);

        // Minimum PIX transfer amount is R$ 1.00.
        if (partnerShare < 1) {
            const error = `Valor do repasse (R$ ${partnerShare.toFixed(2)}) é menor que o mínimo de R$ 1,00.`;
            console.warn(`${logPrefix} ${error}`);
            order.splitStatus = 'skipped';
            order.splitError = error;
            order.splitAmount = partnerShare;
            order.platformFee = clickpetShare;
            await order.save();
            return { success: false, splitAmount: partnerShare, platformFee: clickpetShare, error };
        }

        // Send PIX to partner
        const rawKeyType = partner.pixConfig.keyType || 'CPF';
        const pixKeyType = mapPixKeyTypeAsaas(rawKeyType);
        // CRITICAL: Strip formatting masks from PIX key before sending
        // UI stores: (11) 98765-4321, 123.456.789-01, 00.000.000/0000-00
        // API expects: 11987654321, 12345678901, 00000000000000
        const rawPixKey = partner.pixConfig.key;
        const pixKey = (pixKeyType === 'EMAIL' || pixKeyType === 'EVP')
            ? rawPixKey  // Don't strip email addresses or random keys
            : rawPixKey.replace(/\D/g, ''); // Strip all non-digits for CPF/CNPJ/PHONE

        console.log(`${logPrefix} Partner: ${partner.name} (${partner._id})`);
        console.log(`${logPrefix} PIX Config: keyType="${rawKeyType}" → mapped="${pixKeyType}"`);
        console.log(`${logPrefix} PIX Key: raw="${rawPixKey}" → cleaned="${pixKey}"`);

        const transfer = await createPixTransfer({
            value: partnerShare,
            pixKey: pixKey,
            pixKeyType: pixKeyType,
            description: `Repasse pedido #${orderId.slice(-6).toUpperCase()} - ClickPet`,
        });

        if (transfer.transferFee) {
            console.log(`${logPrefix} ASAAS transfer fee: R$ ${transfer.transferFee.toFixed(2)}`);
        }

        // Update order with split info
        order.splitStatus = 'completed';
        order.splitAmount = partnerShare;
        order.platformFee = clickpetShare;
        order.splitPixId = transfer.id;
        order.splitProcessedAt = new Date();
        order.splitError = undefined;
        await order.save();

        console.log(`${logPrefix} ✅ Split completed! Transfer ID: ${transfer.id}`);

        return {
            success: true,
            splitAmount: partnerShare,
            platformFee: clickpetShare,
            pixId: transfer.id,
        };

    } catch (error: any) {
        console.error(`${logPrefix} ❌ Split failed:`, error.message);

        // Save the error but don't crash the payment flow
        try {
            const partnerShare = calculatePartnerShare(order.total);
            const clickpetShare = Math.round((order.total - partnerShare) * 100) / 100;
            order.splitStatus = 'failed';
            order.splitError = error.message || 'Unknown error during split';
            order.splitAmount = partnerShare;
            order.platformFee = clickpetShare;
            await order.save();
        } catch (saveError) {
            console.error(`${logPrefix} Failed to save split error:`, saveError);
        }

        return {
            success: false,
            splitAmount: 0,
            platformFee: 0,
            error: error.message,
        };
    }
}

/**
 * Calculate the partner's share of an order total.
 * Uses PARTNER_PERCENTAGE (default 90%).
 * Rounds to 2 decimal places.
 */
function calculatePartnerShare(total: number): number {
    return Math.round(total * PARTNER_PERCENTAGE) / 100;
}

/**
 * Retry a failed split for an order.
 * Can be called manually from admin dashboard.
 */
export async function retryPartnerPayout(order: any): Promise<SplitResult> {
    if (order.splitStatus !== 'failed') {
        return {
            success: false,
            splitAmount: 0,
            platformFee: 0,
            error: `Cannot retry: current status is '${order.splitStatus}'`,
        };
    }

    // Reset status so processPartnerPayout can run again
    order.splitStatus = 'pending';
    order.splitError = undefined;
    await order.save();

    return processPartnerPayout(order);
}
