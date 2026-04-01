import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createBilling, toCentavos, cleanTaxId } from '@/lib/abacatepay';

/**
 * POST /api/payments/create-subscription
 * Creates a billing in AbacatePay for a partner subscription plan.
 * Body: { plan: 'basic' | 'premium' | 'enterprise' }
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Only partners can subscribe
        if (session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Only partners can subscribe' }, { status: 403 });
        }

        await dbConnect();
        const { plan } = await req.json();

        if (!plan || !['basic', 'premium', 'enterprise'].includes(plan)) {
            return NextResponse.json({ message: 'Invalid plan. Accepted: basic, premium, enterprise' }, { status: 400 });
        }

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Get plan details
        const planFeatures = Subscription.getPlanFeatures(plan);

        if (planFeatures.price <= 0) {
            return NextResponse.json({ message: 'Free plan does not require payment' }, { status: 400 });
        }

        // Check if subscription already exists
        let subscription = await Subscription.findOne({ partnerId: session.user.id });

        // If subscription exists with a pending billing, return existing URL
        if (subscription && subscription.abacatepayBillingId && subscription.status === 'pending') {
            return NextResponse.json({
                billingId: subscription.abacatepayBillingId,
                billingUrl: subscription.abacatepayBillingUrl,
                subscriptionId: subscription._id,
                message: 'Billing already exists',
            });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Plan display names
        const planNames: Record<string, string> = {
            basic: 'Plano Básico',
            premium: 'Plano Premium',
            enterprise: 'Plano Enterprise',
        };

        const rawTaxId = user.cnpj || user.cpf;
        if (!rawTaxId || rawTaxId === '000.000.000-00') {
            return NextResponse.json({ 
                message: 'Seu perfil precisa ter um CPF ou CNPJ cadastrado para realizar pagamentos.' 
            }, { status: 400 });
        }

        // Check if subscription already exists or create a new one
        if (!subscription) {
            subscription = await Subscription.create({
                partnerId: session.user.id,
                plan,
                status: 'pending',
                startDate: new Date(),
                endDate: new Date(),
                amount: planFeatures.price,
                features: planFeatures,
                paymentMethod: 'pix',
                history: [{
                    action: 'created',
                    newPlan: plan,
                    date: new Date(),
                    notes: 'Registro de assinatura iniciado',
                }],
            });
            // Link to user
            await User.findByIdAndUpdate(session.user.id, { subscriptionId: subscription._id });
        } else {
            // Keep existing subscription features/plan if active, but store the upcoming plan intent
            // This prevents the user from being downgraded immediately or gaining benefits before payment
            // We'll update the actual plan and features in the check-status/webhook when payment confirms
            if (subscription.status !== 'active') {
                // If they are not active, we can safely overwrite it right now
                subscription.plan = plan;
                subscription.features = planFeatures;
                subscription.amount = planFeatures.price;
            }
        }

        // Create billing in AbacatePay
        const billing = await createBilling({
            frequency: 'ONE_TIME',
            methods: ['PIX', 'CARD'],
            products: [{
                externalId: `subscription-${plan}`,
                name: `ClickPet ${planNames[plan]}`,
                description: `Assinatura mensal - ${planNames[plan]}`,
                quantity: 1,
                price: toCentavos(planFeatures.price),
            }],
            returnUrl: `${appUrl}/partner/subscription?status=return`,
            completionUrl: `${appUrl}/payment/success?subscriptionId=${subscription._id}`,
            customer: {
                name: user.name || 'Parceiro ClickPet',
                cellphone: user.phone || '(00) 00000-0000',
                email: user.email,
                taxId: cleanTaxId(rawTaxId),
            },
        });

        // Update subscription with billing info
        subscription.abacatepayBillingId = billing.id;
        subscription.abacatepayBillingUrl = billing.url;
        subscription.paymentStartedAt = new Date();
        
        // Use a history note to memorize the intent of the planned upgrade/downgrade 
        // We will parse this back into the plan/features during checkout confirmation
        subscription.history.push({
            action: 'created',
            newPlan: plan,
            date: new Date(),
            notes: `Cobrança gerada no AbacatePay para o plano: ${plan}`,
        });
        await subscription.save();

        return NextResponse.json({
            billingId: billing.id,
            billingUrl: billing.url,
            subscriptionId: subscription._id,
        });
    } catch (error: any) {
        console.error('[Subscription Payment] Error:', error);
        return NextResponse.json({ message: error.message || 'Error creating subscription billing' }, { status: 500 });
    }
}
