import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { retryPartnerPayout } from '@/lib/split-service';

/**
 * GET /api/admin/splits
 * List all orders with split payment info for admin dashboard.
 * Query params:
 *   - status: filter by splitStatus (pending, completed, failed, skipped)
 *   - page: pagination (default 1)
 *   - limit: items per page (default 20)
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const skip = (page - 1) * limit;

        // Build query - only orders with confirmed payments
        const query: any = { paymentStatus: 'approved' };
        if (status) {
            query.splitStatus = status;
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('partnerId', '-password')
                .populate('userId', '-password'),
            Order.countDocuments(query),
        ]);

        orders.forEach((o: any) => {
            if (o.partnerId && typeof o.partnerId.decryptFieldsSync === 'function') {
                o.partnerId.decryptFieldsSync();
            }
            if (o.userId && typeof o.userId.decryptFieldsSync === 'function') {
                o.userId.decryptFieldsSync();
            }
        });

        // Calculate summary totals
        const summaryPipeline = [
            { $match: { paymentStatus: 'approved' } },
            {
                $group: {
                    _id: '$splitStatus',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$total' },
                    totalSplitAmount: { $sum: { $ifNull: ['$splitAmount', 0] } },
                    totalPlatformFee: { $sum: { $ifNull: ['$platformFee', 0] } },
                },
            },
        ];

        const summary = await Order.aggregate(summaryPipeline);

        // Format summary
        const summaryMap: Record<string, any> = {};
        let grandTotalRevenue = 0;
        let grandTotalSplit = 0;
        let grandTotalFee = 0;

        for (const s of summary) {
            summaryMap[s._id || 'unknown'] = {
                count: s.count,
                totalAmount: s.totalAmount,
                totalSplitAmount: s.totalSplitAmount,
                totalPlatformFee: s.totalPlatformFee,
            };
            grandTotalRevenue += s.totalAmount;
            grandTotalSplit += s.totalSplitAmount;
            grandTotalFee += s.totalPlatformFee;
        }

        return NextResponse.json({
            orders: orders.map((o: any) => ({
                _id: o._id,
                createdAt: o.createdAt,
                total: o.total,
                splitStatus: o.splitStatus || 'pending',
                splitAmount: o.splitAmount,
                platformFee: o.platformFee,
                splitPixId: o.splitPixId,
                splitError: o.splitError,
                splitProcessedAt: o.splitProcessedAt,
                partner: o.partnerId ? {
                    _id: o.partnerId._id,
                    name: o.partnerId.name,
                    email: o.partnerId.email,
                    hasPixKey: !!o.partnerId.pixConfig?.key,
                } : null,
                customer: o.userId ? {
                    name: o.userId.name,
                    email: o.userId.email,
                } : null,
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            summary: {
                byStatus: summaryMap,
                totals: {
                    revenue: grandTotalRevenue,
                    partnerPayouts: grandTotalSplit,
                    platformFees: grandTotalFee,
                },
            },
        });
    } catch (error: any) {
        console.error('[Admin Splits] Error:', error);
        return NextResponse.json({ message: error.message || 'Error listing splits' }, { status: 500 });
    }
}

/**
 * POST /api/admin/splits
 * Retry a failed split for a specific order.
 * Body: { orderId: string }
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
        }

        await dbConnect();

        const { orderId } = await req.json();
        if (!orderId) {
            return NextResponse.json({ message: 'orderId is required' }, { status: 400 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        if (order.paymentStatus !== 'approved') {
            return NextResponse.json({ message: 'Order payment is not approved' }, { status: 400 });
        }

        const result = await retryPartnerPayout(order);

        return NextResponse.json({
            message: result.success ? 'Split retried successfully' : 'Split retry failed',
            result,
        });
    } catch (error: any) {
        console.error('[Admin Splits] Retry error:', error);
        return NextResponse.json({ message: error.message || 'Error retrying split' }, { status: 500 });
    }
}
