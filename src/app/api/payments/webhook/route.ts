import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import notificationService from '@/lib/notification-service';
import { verifyWebhookSignature } from '@/lib/abacatepay';
import { processPartnerPayout } from '@/lib/split-service';

/**
 * POST /api/payments/webhook
 * Receives payment notifications from AbacatePay.
 * 
 * v2 Events: checkout.completed, checkout.refunded, transparent.completed, transparent.refunded
 * v1 Events (backward compat): billing.paid, pix.paid, pix.expired
 * 
 * NOTE: For local development without ngrok, use polling via /api/payments/check-status instead.
 * This endpoint is ready for production use.
 */
export async function POST(req: Request) {
    try {
        await dbConnect();
        
        const rawBody = await req.text();
        const signature = req.headers.get('x-abacatepay-signature');
        const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;

        // VERIFY SIGNATURE (Security Hardening: Fail-Closed)
        if (!secret) {
            console.error('[Webhook] CRITICAL: ABACATEPAY_WEBHOOK_SECRET is not defined! Rejecting all webhooks for security.');
            return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
        }

        const isValid = signature && verifyWebhookSignature(rawBody, signature, secret);
        if (!isValid) {
            console.error('[Webhook] Signature Mismatch!');
            return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
        }

        const body = JSON.parse(rawBody);
        console.log('[Webhook] Received:', JSON.stringify(body, null, 2));

        const event = body.event || body.type;
        const data = body.data || body;

        if (!event) {
            return NextResponse.json({ message: 'Missing event type' }, { status: 400 });
        }

        // Extract billing/checkout ID from the payload
        // v2 sends data.id directly, v1 sent data.billing.id
        const billingId = data?.billing?.id || data?.id;

        if (!billingId) {
            console.warn('[Webhook] No billing/checkout ID found in payload');
            return NextResponse.json({ received: true });
        }

        // Normalize v2 event names to v1 for unified handling
        let normalizedEvent = event;
        if (event === 'checkout.completed' || event === 'transparent.completed') {
            normalizedEvent = 'billing.paid';
        } else if (event === 'checkout.refunded' || event === 'transparent.refunded') {
            normalizedEvent = 'payment.refunded';
        } else if (event === 'transparent.expired') {
            normalizedEvent = 'pix.expired';
        }

        console.log(`[Webhook] Event: ${event} → normalized: ${normalizedEvent}`);

        switch (normalizedEvent) {
            case 'billing.paid': {
                // Try to find an Order with this billing ID
                const order = await Order.findOne({ abacatepayBillingId: billingId });
                if (order) {
                    order.paymentStatus = 'approved';
                    await order.save();

                    // Notify partner
                    if (order.partnerId) {
                        await notificationService.notifyPartnerNewOrder(
                            order.partnerId.toString(),
                            order._id.toString(),
                            order.total
                        );
                    }

                    console.log(`[Webhook] Order ${order._id} payment approved`);

                    // ── SPLIT: Send 85% pure to partner via PIX ──
                    // Must await (not fire-and-forget) because Vercel serverless
                    // kills the function after the response is sent.
                    try {
                        const splitResult = await processPartnerPayout(order);
                        if (splitResult.success) {
                            console.log(`[Webhook] ✅ Split completed for order ${order._id}: R$ ${splitResult.splitAmount?.toFixed(2)} → partner`);
                        } else {
                            console.warn(`[Webhook] ⚠️ Split issue for order ${order._id}: ${splitResult.error}`);
                        }
                    } catch (splitErr: any) {
                        console.error(`[Webhook] ❌ Split error for order ${order._id}:`, splitErr.message);
                    }

                    // Calculate and log total time
                    const startTime = (order as any).paymentStartedAt || order.createdAt;
                    const duration = (Date.now() - new Date(startTime).getTime()) / 1000;
                    console.log(`[PAYMENT CONFIRMED] ✅ Total Time: ${duration.toFixed(2)} seconds\n`);

                    return NextResponse.json({ received: true, orderId: order._id });
                }

                // Try to find a Subscription with this billing ID
                const subscription = await Subscription.findOne({ abacatepayBillingId: billingId });
                if (subscription) {
                    const isAlreadyActive = subscription.status === 'active';
                    
                    // Use the safely stored pendingPlan
                    const intendedPlan = subscription.pendingPlan || subscription.plan;
                    
                    // Apply new plan and features
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
                        notes: 'Pagamento confirmado via AbacatePay (webhook)',
                    });
                    await subscription.save();

                    console.log(`[Webhook] Subscription ${subscription._id} activated for user ${subscription.partnerId}`);

                    // Calculate and log total time
                    const startTime = (subscription as any).paymentStartedAt || (subscription as any).createdAt;
                    const duration = (Date.now() - new Date(startTime).getTime()) / 1000;
                    console.log(`[PAYMENT CONFIRMED] ✅ Total Time: ${duration.toFixed(2)} seconds\n`);

                    return NextResponse.json({ received: true, subscriptionId: subscription._id });
                }

                console.warn(`[Webhook] No order or subscription found for billing ${billingId}`);
                break;
            }

            case 'pix.paid': {
                const order = await Order.findOne({ abacatepayBillingId: billingId });
                if (order) {
                    order.paymentStatus = 'approved';
                    await order.save();
                    console.log(`[Webhook] PIX payment confirmed for order ${order._id}`);

                    // ── SPLIT: Send 85% pure to partner via PIX ──
                    try {
                        const splitResult = await processPartnerPayout(order);
                        if (splitResult.success) {
                            console.log(`[Webhook] ✅ Split completed for PIX order ${order._id}`);
                        } else {
                            console.warn(`[Webhook] ⚠️ Split issue for PIX order ${order._id}: ${splitResult.error}`);
                        }
                    } catch (splitErr: any) {
                        console.error(`[Webhook] ❌ Split error for PIX order ${order._id}:`, splitErr.message);
                    }
                }
                break;
            }

            case 'pix.expired': {
                const order = await Order.findOne({ abacatepayBillingId: billingId });
                if (order && order.paymentStatus === 'pending') {
                    order.paymentStatus = 'rejected';
                    order.status = 'cancelled';
                    order.cancelReason = 'Pagamento PIX expirado';
                    order.cancelledAt = new Date();
                    await order.save();
                    console.log(`[Webhook] PIX expired for order ${order._id}`);
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
