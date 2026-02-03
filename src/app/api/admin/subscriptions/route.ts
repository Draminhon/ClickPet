import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import User from '@/models/User';

// GET /api/admin/subscriptions - List all subscriptions with filters
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const plan = searchParams.get('plan');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Build query
        const query: any = {};
        if (status) query.status = status;
        if (plan) query.plan = plan;

        // Get subscriptions with partner details
        let subscriptions = await Subscription.find(query)
            .populate('partnerId', 'name email cnpj phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Filter by search if provided
        if (search) {
            subscriptions = subscriptions.filter((sub: any) => {
                const partner = sub.partnerId;
                return (
                    partner?.name?.toLowerCase().includes(search.toLowerCase()) ||
                    partner?.email?.toLowerCase().includes(search.toLowerCase()) ||
                    partner?.cnpj?.includes(search)
                );
            });
        }

        const total = await Subscription.countDocuments(query);

        return NextResponse.json({
            subscriptions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 });
    }
}

// POST /api/admin/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const body = await request.json();
        const { partnerId, plan, startDate, endDate, autoRenew, paymentMethod } = body;

        // Validate required fields
        if (!partnerId || !plan) {
            return NextResponse.json({ error: 'Partner ID e plano são obrigatórios' }, { status: 400 });
        }

        // Check if partner exists
        const partner = await User.findById(partnerId);
        if (!partner || partner.role !== 'partner') {
            return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 });
        }

        // Check if subscription already exists
        const existingSubscription = await Subscription.findOne({ partnerId });
        if (existingSubscription) {
            return NextResponse.json({ error: 'Parceiro já possui uma assinatura' }, { status: 400 });
        }

        // Get plan features
        const features = Subscription.getPlanFeatures(plan);

        // Create subscription
        const subscription = await Subscription.create({
            partnerId,
            plan,
            status: 'active',
            startDate: startDate || new Date(),
            endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            autoRenew: autoRenew || false,
            paymentMethod: paymentMethod || 'manual',
            amount: features.price,
            features,
            history: [{
                action: 'created',
                newPlan: plan,
                date: new Date(),
                notes: 'Assinatura criada pelo administrador',
            }],
        });

        // Update user with subscription reference
        await User.findByIdAndUpdate(partnerId, { subscriptionId: subscription._id });

        return NextResponse.json(subscription, { status: 201 });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 });
    }
}
