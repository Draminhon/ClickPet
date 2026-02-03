import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import User from '@/models/User';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const [totalPartners, activeSubscriptions, expiredSubscriptions, allSubscriptions] = await Promise.all([
            User.countDocuments({ role: 'partner' }),
            Subscription.countDocuments({ status: 'active' }),
            Subscription.countDocuments({ status: 'expired' }),
            Subscription.find({ status: 'active' }),
        ]);

        // Calculate monthly recurring revenue
        const monthlyRevenue = allSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

        return NextResponse.json({
            totalPartners,
            activeSubscriptions,
            expiredSubscriptions,
            monthlyRevenue,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }
}
