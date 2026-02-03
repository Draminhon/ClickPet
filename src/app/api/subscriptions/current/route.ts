import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import { getSubscriptionDetails, getUsageStats } from '@/lib/subscriptionCheck';

// GET /api/subscriptions/current - Get current user's subscription
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const partnerId = session.user.id;

        // Get subscription details
        const subscriptionDetails = await getSubscriptionDetails(partnerId);

        if (!subscriptionDetails) {
            return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
        }

        // Get usage statistics
        const usageStats = await getUsageStats(partnerId);

        // Get full subscription for history
        const subscription = await Subscription.findOne({ partnerId });

        return NextResponse.json({
            ...subscriptionDetails,
            usage: usageStats,
            history: subscription?.history || [],
        });
    } catch (error) {
        console.error('Error fetching current subscription:', error);
        return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: 500 });
    }
}
