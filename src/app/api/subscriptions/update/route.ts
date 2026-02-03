import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const { plan } = await request.json();
        const partnerId = session.user.id;

        if (!['free', 'basic', 'premium', 'enterprise'].includes(plan.toLowerCase())) {
            return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
        }

        const planFeatures = await Subscription.getPlanFeatures(plan.toLowerCase());
        const amount = planFeatures.price;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month validity

        // Find existing or direct update
        let subscription = await Subscription.findOne({ partnerId });

        const historyItem = {
            action: subscription ? (subscription.amount < amount ? 'upgraded' : 'downgraded') : 'created',
            previousPlan: subscription?.plan,
            newPlan: plan.toLowerCase(),
            date: new Date(),
            notes: 'Ativação direta sem pagamento (Dev Mode)'
        };

        if (subscription) {
            subscription.plan = plan.toLowerCase();
            subscription.status = 'active';
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.amount = amount;
            subscription.features = {
                maxProducts: planFeatures.maxProducts,
                maxServices: planFeatures.maxServices,
                hasAnalytics: planFeatures.hasAnalytics,
                hasPrioritySupport: planFeatures.hasPrioritySupport,
                hasAdvancedReports: planFeatures.hasAdvancedReports,
                maxImages: planFeatures.maxImages,
            };
            subscription.history.push(historyItem);
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                partnerId,
                plan: plan.toLowerCase(),
                status: 'active',
                startDate,
                endDate,
                amount,
                features: {
                    maxProducts: planFeatures.maxProducts,
                    maxServices: planFeatures.maxServices,
                    hasAnalytics: planFeatures.hasAnalytics,
                    hasPrioritySupport: planFeatures.hasPrioritySupport,
                    hasAdvancedReports: planFeatures.hasAdvancedReports,
                    maxImages: planFeatures.maxImages,
                },
                history: [historyItem]
            });
        }

        // Link subscription to User
        await User.findByIdAndUpdate(partnerId, { subscriptionId: subscription._id });

        return NextResponse.json({ success: true, subscription });
    } catch (error: any) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 });
    }
}
