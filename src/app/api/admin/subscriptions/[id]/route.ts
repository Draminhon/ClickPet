import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';

// GET /api/admin/subscriptions/[id] - Get subscription details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const subscription = await Subscription.findById(id)
            .populate('partnerId', 'name email cnpj phone address');

        if (!subscription) {
            return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
        }

        return NextResponse.json(subscription);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json({ error: 'Erro ao buscar assinatura' }, { status: 500 });
    }
}

// PUT /api/admin/subscriptions/[id] - Update subscription
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const subscription = await Subscription.findById(id);

        if (!subscription) {
            return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
        }

        const body = await request.json();
        const { plan, status, startDate, endDate, autoRenew, notes } = body;

        const previousPlan = subscription.plan;
        const previousStatus = subscription.status;

        // Update fields
        if (plan && plan !== subscription.plan) {
            subscription.plan = plan;
            subscription.features = Subscription.getPlanFeatures(plan);
            subscription.amount = subscription.features.price;

            // Add to history
            subscription.history.push({
                action: previousPlan === 'free' ? 'upgraded' : 'downgraded',
                previousPlan,
                newPlan: plan,
                date: new Date(),
                notes: notes || 'Plano alterado pelo administrador',
            });
        }

        if (status && status !== subscription.status) {
            subscription.status = status;

            // Add to history
            let action = 'renewed';
            if (status === 'cancelled') action = 'cancelled';
            if (status === 'expired') action = 'expired';

            subscription.history.push({
                action,
                previousPlan: subscription.plan,
                newPlan: subscription.plan,
                date: new Date(),
                notes: notes || `Status alterado para ${status}`,
            });
        }

        if (startDate) subscription.startDate = new Date(startDate);
        if (endDate) subscription.endDate = new Date(endDate);
        if (autoRenew !== undefined) subscription.autoRenew = autoRenew;

        await subscription.save();

        return NextResponse.json(subscription);
    } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ error: 'Erro ao atualizar assinatura' }, { status: 500 });
    }
}

// DELETE /api/admin/subscriptions/[id] - Cancel subscription
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const subscription = await Subscription.findById(id);

        if (!subscription) {
            return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
        }

        subscription.status = 'cancelled';
        subscription.history.push({
            action: 'cancelled',
            previousPlan: subscription.plan,
            newPlan: subscription.plan,
            date: new Date(),
            notes: 'Assinatura cancelada pelo administrador',
        });

        await subscription.save();

        return NextResponse.json({ message: 'Assinatura cancelada com sucesso' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 });
    }
}
