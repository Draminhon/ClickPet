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

        // Calculate daily sales for the current week (SEG-DOM)
        const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
        const dailySalesMap: { [key: string]: number } = {
            'SEG': 0, 'TER': 0, 'QUA': 0, 'QUI': 0, 'SEX': 0, 'SAB': 0, 'DOM': 0
        };

        // Get products first to map IDs to types
        const products = await Product.find({ partnerId }).sort({ createdAt: -1 });
        const productTypeMap: { [key: string]: string } = {};
        products.forEach(p => {
            productTypeMap[p._id.toString()] = p.productType || 'Geral';
        });

        // Calculate product popularity by TYPE
        const typePopularity: { [key: string]: number } = {};

        let totalRevenue = 0;
        let nonCancelledOrdersCount = 0;
        let activeOrdersCount = 0;
        const activeStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery'];

        orders.forEach(order => {
            if (order.status !== 'cancelled') {
                totalRevenue += order.total;
                nonCancelledOrdersCount++;

                // Daily sales logic
                const dayIndex = new Date(order.createdAt).getDay();
                const dayName = dayNames[dayIndex];
                dailySalesMap[dayName] += 1;

                // Top product types logic
                order.items.forEach((item: any) => {
                    const type = productTypeMap[item.productId?.toString()] || 'Geral';
                    typePopularity[type] = (typePopularity[type] || 0) + (item.quantity || 1);
                });
            }

            if (activeStatuses.includes(order.status)) {
                activeOrdersCount++;
            }
        });

        const dailySales = Object.entries(dailySalesMap).map(([name, value]) => ({ name, value }));

        // Formate top types for pie chart
        const topProducts = Object.entries(typePopularity)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return NextResponse.json({
            totalProducts,
            totalOrders: orders.length,
            activeOrders: activeOrdersCount,
            totalRevenue,
            products,
            dailySales,
            topProducts,
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
