import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    createCustomer,
    createPayment,
    getPayment,
    getPixQrCode,
    extractClientIp,
} from '@/lib/asaas';
import { processPartnerPayout } from '@/lib/split-service';
import notificationService from '@/lib/notification-service';

/**
 * POST /api/payments/create-billing
 * Creates a charge in ASAAS for an existing order.
 * Body: { orderId: string, cardToken?: string }
 *
 * `cardToken` (mobile only, cartão salvo): cobra na hora, sem redirecionar —
 * a resposta já traz o status final. Sem `cardToken`: cria uma cobrança
 * hospedada pela ASAAS (PIX e/ou cartão conforme `order.paymentMethod`) e,
 * quando aplicável, também devolve o QR code do PIX para exibição in-app.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { orderId, cardToken } = await req.json();

        if (!orderId) {
            return NextResponse.json({ message: 'orderId is required' }, { status: 400 });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // Security: only the order owner can create a payment
        if (order.userId.toString() !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Idempotency: reconsult the existing charge instead of creating a duplicate.
        if (order.asaasPaymentId) {
            const existing = await getPayment(order.asaasPaymentId);
            return NextResponse.json({
                asaasPaymentId: existing.id,
                status: existing.status,
                paid: existing.status === 'CONFIRMED' || existing.status === 'RECEIVED',
                billingId: existing.id,
                billingUrl: existing.invoiceUrl,
                pix: order.pixPayload
                    ? { payload: order.pixPayload, qrCodeImage: order.pixQrCodeImage, expiresAt: order.pixExpiresAt }
                    : undefined,
                message: 'Charge already exists',
            });
        }

        const rawTaxId = user.cpf || user.cnpj;
        if (!rawTaxId || rawTaxId === '000.000.000-00') {
            return NextResponse.json({
                message: 'Seu perfil precisa ter um CPF ou CNPJ cadastrado para realizar pagamentos.'
            }, { status: 400 });
        }

        // One ASAAS customer per user, created once and reused.
        if (!user.asaasCustomerId) {
            const customer = await createCustomer({
                name: user.name || 'Cliente ClickPet',
                cpfCnpj: rawTaxId,
                email: user.email,
                externalReference: String(user._id),
            });
            user.asaasCustomerId = customer.id;
            await user.save();
        }

        const description = `Pedido #${orderId.toString().slice(-6).toUpperCase()} - ClickPet`;

        // ── Cartão salvo (mobile): cobrança transparente, sem sair do app ──
        if (cardToken) {
            const savedCard = (user.savedCards || []).find((c: any) => c.cardToken === cardToken);
            if (!savedCard) {
                return NextResponse.json({ message: 'Cartão não encontrado.' }, { status: 400 });
            }

            const payment = await createPayment({
                customerId: user.asaasCustomerId,
                billingType: 'CREDIT_CARD',
                value: order.total,
                description,
                externalReference: orderId,
                creditCardToken: cardToken,
                remoteIp: extractClientIp(req),
            });

            order.asaasPaymentId = payment.id;
            order.paymentStartedAt = new Date();

            const paid = payment.status === 'CONFIRMED' || payment.status === 'RECEIVED';
            if (paid) {
                order.paymentStatus = 'approved';
            }
            await order.save();

            if (paid) {
                if (order.partnerId) {
                    await notificationService.notifyPartnerNewOrder(
                        order.partnerId.toString(),
                        order._id.toString(),
                        order.total
                    );
                }
                try {
                    await processPartnerPayout(order);
                } catch (splitErr: any) {
                    console.error(`[Payments] Split error for order ${order._id}:`, splitErr.message);
                }
            }

            return NextResponse.json({
                asaasPaymentId: payment.id,
                status: payment.status,
                paid,
            });
        }

        // ── Cobrança hospedada (web, ou mobile-PIX): PIX e/ou cartão ──
        const billingType = order.paymentMethod === 'cartao' ? 'CREDIT_CARD' : 'PIX';

        const payment = await createPayment({
            customerId: user.asaasCustomerId,
            billingType,
            value: order.total,
            description,
            externalReference: orderId,
        });

        order.asaasPaymentId = payment.id;
        order.paymentStartedAt = new Date();

        let pix: { payload: string; qrCodeImage: string; expiresAt: string } | undefined;
        if (billingType === 'PIX') {
            const qrCode = await getPixQrCode(payment.id);
            order.pixPayload = qrCode.payload;
            order.pixQrCodeImage = qrCode.encodedImage;
            order.pixExpiresAt = qrCode.expirationDate;
            pix = { payload: qrCode.payload, qrCodeImage: qrCode.encodedImage, expiresAt: qrCode.expirationDate };
        }

        await order.save();

        return NextResponse.json({
            billingId: payment.id,
            billingUrl: payment.invoiceUrl,
            pix,
        });
    } catch (error: any) {
        console.error('[Payments] Error creating charge:', error);
        return NextResponse.json({ message: error.message || 'Error creating charge' }, { status: 500 });
    }
}
