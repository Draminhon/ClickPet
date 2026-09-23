import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPayment } from '@/lib/asaas';
import notificationService from '@/lib/notification-service';
import { processPartnerPayout } from '@/lib/split-service';

/**
 * GET /api/payments/check-status?orderId=xxx
 * or  /api/payments/check-status?subscriptionId=xxx
 *
 * Polls ASAAS for the current charge status.
 * Used as alternative to webhooks during development.
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');
        const subscriptionId = searchParams.get('subscriptionId');

        if (!orderId && !subscriptionId) {
            return NextResponse.json({ message: 'orderId or subscriptionId required' }, { status: 400 });
        }

        let billingId: string | null = null;
        let record: any = null;
        let type: 'order' | 'subscription' = 'order';

        if (orderId) {
            record = await Order.findById(orderId);
            if (!record) {
                return NextResponse.json({ message: 'Order not found' }, { status: 404 });
            }
            // Security: owner or partner can check
            if (record.userId.toString() !== session.user.id && 
                record.partnerId?.toString() !== session.user.id) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
            }
            billingId = record.asaasPaymentId;
            type = 'order';
        } else if (subscriptionId) {
            record = await Subscription.findById(subscriptionId);
            if (!record) {
                return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
            }
            // Security: only the partner owner can check their subscription
            if (record.partnerId.toString() !== session.user.id) {
                return NextResponse.json({ message: 'Unauthorized access to subscription' }, { status: 401 });
            }
            billingId = record.asaasPaymentId;
            type = 'subscription';
        }

        if (!billingId) {
            return NextResponse.json({
                status: record.paymentStatus || record.status,
                message: 'No billing found for this record',
            });
        }

        // Poll ASAAS for the charge status
        let payment;
        try {
            payment = await getPayment(billingId);
            console.log(`[CheckStatus] Payment ${billingId} status from ASAAS:`, payment.status);
        } catch (apiError: any) {
            // 404 = a cobrança não existe mais na ASAAS (ex: apagada direto no
            // painel/sandbox) — não é sincronização atrasada, é definitivo.
            // Tratar isso como "PENDING, tenta de novo depois" faria o cliente
            // (e qualquer polling automático) ficar preso nisso para sempre.
            if (apiError.status === 404 && type === 'order' && record.paymentStatus === 'pending') {
                record.paymentStatus = 'rejected';
                record.status = 'cancelled';
                record.cancelReason = 'Cobrança não encontrada na ASAAS (excluída)';
                record.cancelledAt = new Date();
                await record.save();
                console.warn(`[CheckStatus] Payment ${billingId} not found on ASAAS (404) — order ${record._id} cancelled`);
                return NextResponse.json({
                    status: 'CANCELLED',
                    paymentStatus: 'rejected',
                    message: 'Cobrança não encontrada na ASAAS.'
                });
            }

            console.warn(`[CheckStatus] Payment ${billingId} not reachable yet on ASAAS. Retrying...`, apiError.message);
            return NextResponse.json({
                status: 'PENDING',
                paymentStatus: 'pending',
                message: 'Aguardando sincronização com gateway...'
            });
        }

        // Update local record if payment is confirmed. ASAAS uses CONFIRMED for
        // an authorized card charge and RECEIVED once the money settles (PIX
        // settles immediately, so RECEIVED is the normal PIX-paid status).
        if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
            if (type === 'order' && record.paymentStatus !== 'approved') {
                // Atomic claim: only proceeds if this call is the one that
                // actually flips pending → approved. The app polls this
                // endpoint every few seconds while a webhook can land at the
                // same moment — a plain "check then save" here let both race
                // into processPartnerPayout with a stale 'pending' read.
                const approvedOrder = await Order.findOneAndUpdate(
                    { _id: record._id, paymentStatus: { $ne: 'approved' } },
                    { $set: { paymentStatus: 'approved' } },
                    { new: true },
                );

                if (approvedOrder) {
                    record = approvedOrder;

                    // Notify partner
                    if (record.partnerId) {
                        await notificationService.notifyPartnerNewOrder(
                            record.partnerId.toString(),
                            record._id.toString(),
                            record.total
                        );
                    }

                    // ── SPLIT: Send 85% pure to partner via PIX ──
                    try {
                        const splitResult = await processPartnerPayout(record);
                        if (splitResult.success) {
                            console.log(`[CheckStatus] ✅ Split completed for order ${record._id}: R$ ${splitResult.splitAmount?.toFixed(2)} → partner`);
                        } else {
                            console.warn(`[CheckStatus] ⚠️ Split issue for order ${record._id}: ${splitResult.error}`);
                        }
                    } catch (splitErr: any) {
                        console.error(`[CheckStatus] ❌ Split error for order ${record._id}:`, splitErr.message);
                    }
                }
            } else if (type === 'subscription') {
                const isAlreadyActive = record.status === 'active';
                
                // Use the safely stored pendingPlan
                const intendedPlan = record.pendingPlan || record.plan;
                
                // Apply the new plan and features
                record.plan = intendedPlan;
                record.features = Subscription.getPlanFeatures(intendedPlan);
                record.amount = Subscription.getPlanFeatures(intendedPlan).price;
                
                record.status = 'active';
                record.startDate = new Date();
                record.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                
                record.history.push({
                    action: isAlreadyActive ? 'upgraded' : 'renewed',
                    newPlan: intendedPlan,
                    date: new Date(),
                    notes: 'Pagamento confirmado via ASAAS (polling)',
                });
                await record.save();
            }

            // Calculate and log total time from payment start to confirmation
            const startTime = record.paymentStartedAt || record.createdAt;
            const duration = (Date.now() - new Date(startTime).getTime()) / 1000;
            console.log(`\n[PAYMENT CONFIRMED] ✅`);
            console.log(`[ID] ${record._id}`);
            console.log(`[Type] ${type.toUpperCase()}`);
            console.log(`[Total Time] ${duration.toFixed(2)} seconds\n`);
        }

        // Normalizado para o vocabulário que o checkout web já espera
        // (`payment/success/page.tsx` só olha para `status === 'PAID'`), para
        // não precisar tocar nessas páginas ao trocar de gateway.
        const normalizedStatus =
            payment.status === 'CONFIRMED' || payment.status === 'RECEIVED' ? 'PAID' : payment.status;

        return NextResponse.json({
            status: normalizedStatus,
            paymentStatus: type === 'order' ? record.paymentStatus : record.status,
            billingId: payment.id,
            amount: payment.value,
        });
    } catch (error: any) {
        console.error('[CheckStatus] Error:', error);
        return NextResponse.json({ message: error.message || 'Error checking status' }, { status: 500 });
    }
}
