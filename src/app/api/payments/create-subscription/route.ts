import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createCustomer, createPayment } from '@/lib/asaas';

/**
 * POST /api/payments/create-subscription
 * Creates a charge in ASAAS for a partner subscription plan.
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

        // If subscription exists with a pending charge AND the user hasn't changed their mind about the plan, return it
        if (subscription && subscription.asaasPaymentId && subscription.status === 'pending' && subscription.pendingPlan === plan) {
            return NextResponse.json({
                billingId: subscription.asaasPaymentId,
                billingUrl: subscription.asaasInvoiceUrl,
                subscriptionId: subscription._id,
                message: 'Billing already exists for this exact plan',
            });
        }

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

        // One ASAAS customer per user, created once and reused.
        if (!user.asaasCustomerId) {
            const customer = await createCustomer({
                name: user.name || 'Parceiro ClickPet',
                cpfCnpj: rawTaxId,
                email: user.email,
                externalReference: String(user._id),
            });
            user.asaasCustomerId = customer.id;
            await user.save();
        }

        // Create charge in ASAAS — UNDEFINED lets the customer pick PIX/card
        // on the hosted invoice page (the web subscription page just redirects there).
        const payment = await createPayment({
            customerId: user.asaasCustomerId,
            billingType: 'UNDEFINED',
            value: planFeatures.price,
            description: `ClickPet ${planNames[plan]} - Assinatura mensal`,
            externalReference: `subscription-${subscription._id}`,
        });

        // Update subscription with charge info and pending plan intent
        subscription.asaasPaymentId = payment.id;
        subscription.asaasInvoiceUrl = payment.invoiceUrl;
        subscription.paymentStartedAt = new Date();
        subscription.pendingPlan = plan;
        subscription.pendingAmount = planFeatures.price;

        // Use a history note to memorize the intent
        subscription.history.push({
            action: 'created',
            newPlan: plan,
            date: new Date(),
            notes: `Cobrança gerada na ASAAS para o plano: ${plan} (ID: ${payment.id})`,
        });
        await subscription.save();

        return NextResponse.json({
            billingId: payment.id,
            billingUrl: payment.invoiceUrl,
            subscriptionId: subscription._id,
        });
    } catch (error: any) {
        console.error('[Subscription Payment] Error:', error);
        return NextResponse.json({ message: error.message || 'Error creating subscription billing' }, { status: 500 });
    }
}
