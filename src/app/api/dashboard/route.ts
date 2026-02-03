import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const partnerId = session.user.id;

        // Get total products
        const totalProducts = await Product.countDocuments({ partnerId });

        // Get orders that belong to this partner
        const orders = await Order.find({ partnerId }).sort({ createdAt: -1 });

        // Calculate revenue and metrics
        let totalRevenue = 0;
        let activeOrdersCount = 0;
        let nonCancelledOrdersCount = 0;
        const activeStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery'];

        orders.forEach(order => {
            if (order.status !== 'cancelled') {
                totalRevenue += order.total;
                nonCancelledOrdersCount++;
            }

            if (activeStatuses.includes(order.status)) {
                activeOrdersCount++;
            }
        });

        return NextResponse.json({
            totalProducts,
            totalOrders: orders.length,
            activeOrders: activeOrdersCount,
            totalRevenue,
            recentOrders: orders.slice(0, 5).map(order => ({
                _id: order._id,
                total: order.total,
                status: order.status,
                createdAt: order.createdAt,
                itemCount: order.items.length
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
