/**
 * Split Payment Service
 * 
 * Handles the automatic 10/90 split between ClickPet and partner petshops.
 * When a customer pays for an order, 90% is sent to the partner via PIX
 * and 10% is retained by ClickPet as a platform fee.
 * 
 * Flow:
 *   1. Payment confirmed (webhook or polling)
 *   2. processPartnerPayout() is called
 *   3. System looks up partner's PIX config
 *   4. Calculates 90% of order total
 *   5. Sends PIX via AbacatePay POST /v2/pix/send
 *   6. Records split status on the Order
 */

import User from '@/models/User';
import { sendPix, mapPixKeyType, toCentavos } from '@/lib/abacatepay';

// Default split: ClickPet keeps 10%, Partner gets 90%
const PLATFORM_FEE_PERCENTAGE = parseInt(process.env.CLICKPET_SPLIT_PERCENTAGE || '10', 10);
const PARTNER_PERCENTAGE = 100 - PLATFORM_FEE_PERCENTAGE;

export interface SplitResult {
    success: boolean;
    splitAmount: number;     // R$ sent to partner
    platformFee: number;     // R$ retained by ClickPet
    pixId?: string;          // AbacatePay PIX transfer ID
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
        // Guard: Don't process if already completed or processing
        if (order.splitStatus === 'completed') {
            console.log(`${logPrefix} Split already completed, skipping.`);
            return {
                success: true,
                splitAmount: order.splitAmount || 0,
                platformFee: order.platformFee || 0,
                pixId: order.splitPixId,
            };
        }

        if (order.splitStatus === 'processing') {
            console.log(`${logPrefix} Split already processing, skipping.`);
            return {
                success: false,
                splitAmount: 0,
                platformFee: 0,
                error: 'Split already in progress',
            };
        }

        // Mark as processing to prevent double-processing
        order.splitStatus = 'processing';
        await order.save();

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
            const clickpetShare = order.total - partnerShare;
            order.splitAmount = partnerShare;
            order.platformFee = clickpetShare;
            await order.save();
            return { success: false, splitAmount: partnerShare, platformFee: clickpetShare, error };
        }

        // Calculate split amounts
        const partnerShare = calculatePartnerShare(order.total);
        const clickpetShare = order.total - partnerShare;
        const partnerShareCentavos = toCentavos(partnerShare);

        console.log(`${logPrefix} Total: R$ ${order.total.toFixed(2)}`);
        console.log(`${logPrefix} Partner share (${PARTNER_PERCENTAGE}%): R$ ${partnerShare.toFixed(2)}`);
        console.log(`${logPrefix} ClickPet fee (${PLATFORM_FEE_PERCENTAGE}%): R$ ${clickpetShare.toFixed(2)}`);

        // Minimum PIX amount is R$ 1.00 (100 centavos)
        if (partnerShareCentavos < 100) {
            const error = `Valor do repasse (R$ ${partnerShare.toFixed(2)}) é menor que o mínimo de R$ 1,00`;
            console.warn(`${logPrefix} ${error}`);
            order.splitStatus = 'skipped';
            order.splitError = error;
            order.splitAmount = partnerShare;
            order.platformFee = clickpetShare;
            await order.save();
            return { success: false, splitAmount: partnerShare, platformFee: clickpetShare, error };
        }

        // Send PIX to partner
        const pixKeyType = mapPixKeyType(partner.pixConfig.keyType || 'CPF');
        const pixKey = partner.pixConfig.key;

        console.log(`${logPrefix} Sending PIX: R$ ${partnerShare.toFixed(2)} → ${pixKeyType}: ${pixKey.substring(0, 4)}****`);

        const pixResult = await sendPix({
            amount: partnerShareCentavos,
            pixKey: pixKey,
            pixKeyType: pixKeyType,
            externalId: `split-${orderId}`,
            description: `Repasse pedido #${orderId.slice(-6).toUpperCase()} - ClickPet`,
        });

        // Update order with split info
        order.splitStatus = 'completed';
        order.splitAmount = partnerShare;
        order.platformFee = clickpetShare;
        order.splitPixId = pixResult.id;
        order.splitProcessedAt = new Date();
        order.splitError = undefined;
        await order.save();

        console.log(`${logPrefix} ✅ Split completed! PIX ID: ${pixResult.id}`);

        return {
            success: true,
            splitAmount: partnerShare,
            platformFee: clickpetShare,
            pixId: pixResult.id,
        };

    } catch (error: any) {
        console.error(`${logPrefix} ❌ Split failed:`, error.message);

        // Save the error but don't crash the payment flow
        try {
            const partnerShare = calculatePartnerShare(order.total);
            const clickpetShare = order.total - partnerShare;
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
