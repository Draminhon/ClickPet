import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createBilling, createCustomer, toCentavos, cleanTaxId } from '@/lib/abacatepay';
import type { AbacateProduct } from '@/lib/abacatepay';

/**
 * POST /api/payments/create-billing
 * Creates a billing (charge) in AbacatePay for an existing order.
 * Body: { orderId: string }
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ message: 'orderId is required' }, { status: 400 });
        }

        // Fetch the order
        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // Security: only the order owner can create a payment
        if (order.userId.toString() !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Don't re-create billing if already exists
        if (order.abacatepayBillingId) {
            return NextResponse.json({
                billingId: order.abacatepayBillingId,
                billingUrl: order.abacatepayBillingUrl,
                message: 'Billing already exists'
            });
        }

        // Get user data for customer creation
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Build AbacatePay products list
        let products: AbacateProduct[] = [];
        const totalDiscount = (order.discount || 0) + (order.pointsDiscount || 0);

        if (totalDiscount > 0) {
            // If there's a discount, we consolidate to a single line item to ensure the final total matches exactly.
            // This avoids issues with gateways not supporting negative line items for coupons.
            products = [{
                externalId: `order-${orderId}-consolidated`,
                name: `Pedido #${orderId.toString().slice(-6).toUpperCase()}`,
                description: `Resumo do Pedido (Itens + Entrega - Descontos)`,
                quantity: 1,
                price: toCentavos(order.total),
            }];
        } else {
            // Standard itemized list when no discounts are present
            products = order.items.map((item: any) => ({
                externalId: item.productId?.toString() || item.title,
                name: item.title,
                description: `${item.quantity}x ${item.title}`,
                quantity: item.quantity,
                price: toCentavos(item.price),
            }));

            // Add delivery fee as a separate product if applicable
            if (order.deliveryFee > 0) {
                products.push({
                    externalId: 'delivery-fee',
                    name: 'Taxa de Entrega',
                    description: `Entrega - ${order.distance?.toFixed(1) || '?'}km`,
                    quantity: 1,
                    price: toCentavos(order.deliveryFee),
                });
            }
        }

        // Determine payment methods
        const methods: ('PIX' | 'CARD')[] = ['PIX'];
        if (order.paymentMethod === 'cartao') {
            methods.push('CARD');
        } else if (order.paymentMethod === 'pix_cartao') {
            methods.push('CARD');
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const rawTaxId = user.cpf || user.cnpj;
        if (!rawTaxId || rawTaxId === '000.000.000-00') {
            return NextResponse.json({ 
                message: 'Seu perfil precisa ter um CPF ou CNPJ cadastrado para realizar pagamentos.' 
            }, { status: 400 });
        }

        // Create billing in AbacatePay
        const billing = await createBilling({
            frequency: 'ONE_TIME',
            methods,
            products,
            returnUrl: `${appUrl}/payment/return?orderId=${orderId}`,
            completionUrl: `${appUrl}/payment/success?orderId=${orderId}`,
            customer: {
                name: user.name || 'Cliente ClickPet',
                cellphone: user.phone || '(00) 00000-0000',
                email: user.email,
                taxId: cleanTaxId(rawTaxId),
            },
        });

        // Save billing info on the order
        order.abacatepayBillingId = billing.id;
        order.abacatepayBillingUrl = billing.url;
        order.abacatepayCustomerId = billing.customer?.id;
        order.paymentStartedAt = new Date();
        await order.save();

        return NextResponse.json({
            billingId: billing.id,
            billingUrl: billing.url,
        });
    } catch (error: any) {
        console.error('[Payments] Error creating billing:', error);
        return NextResponse.json({ message: error.message || 'Error creating billing' }, { status: 500 });
    }
}
