import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Subscription from '@/models/Subscription';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getBilling } from '@/lib/abacatepay';
import notificationService from '@/lib/notification-service';

/**
 * GET /api/payments/check-status?orderId=xxx
 * or  /api/payments/check-status?subscriptionId=xxx
 * 
 * Polls AbacatePay for the current billing status.
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
            billingId = record.abacatepayBillingId;
            type = 'order';
        } else if (subscriptionId) {
            record = await Subscription.findById(subscriptionId);
            if (!record) {
                return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
            }
            billingId = record.abacatepayBillingId;
            type = 'subscription';
        }

        if (!billingId) {
            return NextResponse.json({
                status: record.paymentStatus || record.status,
                message: 'No billing found for this record',
            });
        }

        // Poll AbacatePay for the billing status
        let billing;
        try {
            billing = await getBilling(billingId);
            console.log(`[CheckStatus] Billing ${billingId} status from AbacatePay:`, billing.status);
        } catch (apiError: any) {
            if (apiError.message && (apiError.message.includes('Not found') || apiError.message.includes('404'))) {
                console.warn(`[CheckStatus] Billing ${billingId} not found in AbacatePay yet (eventual consistency). Retrying...`);
                return NextResponse.json({
                    status: 'PENDING',
                    paymentStatus: 'pending',
                    message: 'Aguardando sincronização com gateway...'
                });
            }
            throw apiError;
        }

        // Update local record if payment is confirmed
        // Added 'FINISHED' as a possible success status
        if (billing.status === 'PAID' || billing.status === 'COMPLETED' || billing.status === 'FINISHED') {
            if (type === 'order' && record.paymentStatus !== 'approved') {
                record.paymentStatus = 'approved';
                await record.save();

                // Notify partner
                if (record.partnerId) {
                    await notificationService.notifyPartnerNewOrder(
                        record.partnerId.toString(),
                        record._id.toString(),
                        record.total
                    );
                }
            } else if (type === 'subscription') {
                const isAlreadyActive = record.status === 'active';
                
                // Get the intended plan from the latest 'created' history item
                const creationLog = [...record.history].reverse().find(h => h.action === 'created' && h.newPlan);
                const intendedPlan = creationLog ? creationLog.newPlan : record.plan;
                
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
                    notes: 'Pagamento confirmado via AbacatePay (polling)',
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

        return NextResponse.json({
            status: billing.status,
            paymentStatus: type === 'order' ? record.paymentStatus : record.status,
            billingId: billing.id,
            amount: billing.amount,
        });
    } catch (error: any) {
        console.error('[CheckStatus] Error:', error);
        return NextResponse.json({ message: error.message || 'Error checking status' }, { status: 500 });
    }
}
