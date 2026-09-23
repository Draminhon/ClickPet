import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Subscription from '@/models/Subscription';
import notificationService from '@/lib/notification-service';
import { verifyWebhookToken } from '@/lib/asaas';
import { processPartnerPayout } from '@/lib/split-service';

/**
 * POST /api/payments/webhook
 * Receives payment notifications from ASAAS.
 *
 * Events: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE,
 * PAYMENT_REFUNDED, PAYMENT_DELETED.
 * Payload: { event, payment: { id, status, externalReference, ... } }
 *
 * NOTE: For local development without ngrok, use polling via /api/payments/check-status instead.
 * This endpoint is ready for production use.
 */
export async function POST(req: Request) {
    try {
        await dbConnect();

        const rawBody = await req.text();
        const headerToken = req.headers.get('asaas-access-token');
        const secret = process.env.ASAAS_WEBHOOK_TOKEN;

        // VERIFY TOKEN (Security Hardening: Fail-Closed)
        // ASAAS doesn't sign the payload with HMAC — it just echoes back the
        // static token configured when the webhook was registered.
        if (!secret) {
            console.error('[Webhook] CRITICAL: ASAAS_WEBHOOK_TOKEN is not defined! Rejecting all webhooks for security.');
            return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
        }

        if (!verifyWebhookToken(headerToken, secret)) {
            console.error('[Webhook] Token Mismatch!');
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const body = JSON.parse(rawBody);
        const event: string | undefined = body.event;
        const payment = body.payment;

        if (!event || !payment?.id) {
            console.warn('[Webhook] Missing event type or payment id');
            return NextResponse.json({ received: true });
        }

        console.log(`[Webhook] Event: ${event} for payment ${payment.id}`);

        switch (event) {
            case 'PAYMENT_CONFIRMED':
            case 'PAYMENT_RECEIVED': {
                const order = await Order.findOne({ asaasPaymentId: payment.id });
                if (order) {
                    // Atomic claim: only proceeds if this call is the one that
                    // actually flips pending → approved. A webhook retry
                    // landing alongside the app's check-status polling could
                    // otherwise both read `paymentStatus !== 'approved'`
                    // before either write lands, double-notifying the partner
                    // and racing into processPartnerPayout twice.
                    const approvedOrder = await Order.findOneAndUpdate(
                        { _id: order._id, paymentStatus: { $ne: 'approved' } },
                        { $set: { paymentStatus: 'approved' } },
                        { new: true },
                    );

                    if (approvedOrder) {
                        // Notify partner
                        if (approvedOrder.partnerId) {
                            await notificationService.notifyPartnerNewOrder(
                                approvedOrder.partnerId.toString(),
                                approvedOrder._id.toString(),
                                approvedOrder.total
                            );
                        }

                        console.log(`[Webhook] Order ${approvedOrder._id} payment approved`);

                        // ── SPLIT: Send partner's share via PIX ──
                        // Must await (not fire-and-forget) because Vercel serverless
                        // kills the function after the response is sent.
                        try {
                            const splitResult = await processPartnerPayout(approvedOrder);
                            if (splitResult.success) {
                                console.log(`[Webhook] ✅ Split completed for order ${approvedOrder._id}: R$ ${splitResult.splitAmount?.toFixed(2)} → partner`);
                            } else {
                                console.warn(`[Webhook] ⚠️ Split issue for order ${approvedOrder._id}: ${splitResult.error}`);
                            }
                        } catch (splitErr: any) {
                            console.error(`[Webhook] ❌ Split error for order ${approvedOrder._id}:`, splitErr.message);
                        }

                        const startTime = (approvedOrder as any).paymentStartedAt || approvedOrder.createdAt;
                        const duration = (Date.now() - new Date(startTime).getTime()) / 1000;
                        console.log(`[PAYMENT CONFIRMED] ✅ Total Time: ${duration.toFixed(2)} seconds\n`);
                    }

                    return NextResponse.json({ received: true, orderId: order._id });
                }

                const subscription = await Subscription.findOne({ asaasPaymentId: payment.id });
                if (subscription) {
                    if (subscription.status !== 'active') {
                        const isAlreadyActive = subscription.status === 'active';
                        const intendedPlan = subscription.pendingPlan || subscription.plan;

                        subscription.plan = intendedPlan;
                        subscription.features = Subscription.getPlanFeatures(intendedPlan);
                        subscription.amount = Subscription.getPlanFeatures(intendedPlan).price;

                        subscription.status = 'active';
                        subscription.startDate = new Date();
                        subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

                        subscription.history.push({
                            action: isAlreadyActive ? 'upgraded' : 'renewed',
                            newPlan: intendedPlan,
                            date: new Date(),
                            notes: 'Pagamento confirmado via ASAAS (webhook)',
                        });
                        await subscription.save();

                        console.log(`[Webhook] Subscription ${subscription._id} activated for user ${subscription.partnerId}`);

                        const startTime = (subscription as any).paymentStartedAt || (subscription as any).createdAt;
                        const duration = (Date.now() - new Date(startTime).getTime()) / 1000;
                        console.log(`[PAYMENT CONFIRMED] ✅ Total Time: ${duration.toFixed(2)} seconds\n`);
                    }

                    return NextResponse.json({ received: true, subscriptionId: subscription._id });
                }

                console.warn(`[Webhook] No order or subscription found for payment ${payment.id}`);
                break;
            }

            case 'PAYMENT_OVERDUE':
            case 'PAYMENT_REFUNDED':
            case 'PAYMENT_DELETED': {
                const order = await Order.findOne({ asaasPaymentId: payment.id });
                if (order && order.paymentStatus === 'pending') {
                    order.paymentStatus = 'rejected';
                    order.status = 'cancelled';
                    order.cancelReason = `Pagamento ${event === 'PAYMENT_OVERDUE' ? 'expirado' : 'cancelado'} (ASAAS)`;
                    order.cancelledAt = new Date();
                    await order.save();
                    console.log(`[Webhook] Order ${order._id} cancelled: ${event}`);
                }
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event: ${event}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('[Webhook] Error:', error);
        return NextResponse.json({ message: 'Webhook processing error' }, { status: 500 });
    }
}
