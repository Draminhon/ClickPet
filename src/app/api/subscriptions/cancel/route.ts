import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';

/**
 * POST /api/subscriptions/cancel
 * Downgrades the partner's active subscription to the 'free' plan immediately.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const subscription = await Subscription.findOne({ partnerId: session.user.id });

        if (!subscription) {
            return NextResponse.json({ message: 'Assinatura não encontrada' }, { status: 404 });
        }

        if (subscription.plan === 'free') {
            return NextResponse.json({ message: 'Você já está no plano grátis' }, { status: 400 });
        }

        const previousPlan = subscription.plan;
        
        // Retrieve the hardcoded features for the 'free' plan
        const freeFeatures = Subscription.getPlanFeatures('free');

        // Apply downgrade immediately
        subscription.plan = 'free';
        subscription.amount = 0;
        subscription.features = freeFeatures;
        
        // Remove pending intent if they downgrade while having an open billing url
        subscription.pendingPlan = undefined;
        subscription.pendingAmount = undefined;
        // Optionally, we could clear the abacatepayBillingId here, but it's safe to leave it
        // since the state is no longer 'pending' for the free plan downgrade.

        subscription.history.push({
            action: 'downgraded',
            newPlan: 'free',
            date: new Date(),
            notes: `Downgrade imediato do plano ${previousPlan} para free pelo usuário`,
        });

        await subscription.save();

        return NextResponse.json({
            message: 'Downgrade realizado com sucesso. Seus benefícios foram ajustados.',
            plan: 'free'
        });
    } catch (error: any) {
        console.error('[Downgrade Subscription] Error:', error);
        return NextResponse.json({ message: error.message || 'Erro ao cancelar assinatura' }, { status: 500 });
    }
}
