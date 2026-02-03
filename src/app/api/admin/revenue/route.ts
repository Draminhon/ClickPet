import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        // Simpler and more robust version: get all relevant orders and map them in JS
        // This handles both IDs and names to match partners reliably during transitions.
        const confirmedStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];
        const orders = await Order.find({ status: { $in: confirmedStatuses } });
        const partners = await User.find({ role: 'partner' });

        const partnerMap = new Map();
        partners.forEach(p => {
            partnerMap.set(p._id.toString(), p);
            partnerMap.set(p.name, p);
        });

        const statsMap = new Map();

        orders.forEach(order => {
            let partner = null;
            if (order.partnerId) {
                partner = partnerMap.get(order.partnerId.toString());
            }
            if (!partner && order.items && order.items.length > 0) {
                // Fallback to matching by shop name if ID is missing or incorrect
                partner = partnerMap.get(order.items[0].shopName);
            }

            if (partner) {
                const partnerIdStr = partner._id.toString();
                if (!statsMap.has(partnerIdStr)) {
                    statsMap.set(partnerIdStr, {
                        _id: partnerIdStr,
                        totalRevenue: 0,
                        orderCount: 0,
                        partnerName: partner.name,
                        email: partner.email
                    });
                }
                const stat = statsMap.get(partnerIdStr);
                stat.totalRevenue += (order.total || 0);
                stat.orderCount += 1;
            }
        });

        const finalStats = Array.from(statsMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

        return NextResponse.json(finalStats);
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        return NextResponse.json({ error: 'Erro ao buscar estatísticas de faturamento' }, { status: 500 });
    }
}
