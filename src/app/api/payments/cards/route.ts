import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createCustomer, tokenizeCard, extractClientIp } from '@/lib/asaas';
import { logAction } from '@/lib/audit';
import { validateCardForm } from '@/utils/cardValidation';

/**
 * Decripta os campos do usuário e de cada cartão salvo. `savedCards` usa
 * fieldEncryption por item (como `deliveryAddresses`), então precisa do
 * mesmo loop — decriptar só o doc pai não alcança os subdocumentos do array.
 */
function decryptUser(user: any) {
    user.decryptFieldsSync();
    if (Array.isArray(user.savedCards)) {
        user.savedCards.forEach((card: any) => {
            if (typeof card.decryptFieldsSync === 'function') {
                card.decryptFieldsSync();
            }
        });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(session.user.id).select('savedCards');
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        decryptUser(user);
        return NextResponse.json(user.savedCards || []);
    } catch (error: any) {
        console.error('[Payments/Cards] Error listing cards:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

/**
 * POST /api/payments/cards
 * Body: { cardNumber, cardholderName, expirationMonth, expirationYear,
 *         securityCode, cardholderDocNumber }
 *
 * Diferente de gateways com chave pública (Mercado Pago, Stripe), a ASAAS só
 * tokeniza com a chave privada da conta — por isso é o app que manda o
 * cartão pra cá (nossa API, autenticada) em vez de bater direto no gateway.
 * Esses campos crus só existem no escopo desta função: nunca são logados,
 * nunca chegam perto de um `console.log`, e não sobra referência a eles
 * depois que a resposta é montada.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { cardNumber, cardholderName, expirationMonth, expirationYear, securityCode, cardholderDocNumber } = body;

        if (!cardNumber || !cardholderName || !expirationMonth || !expirationYear || !securityCode) {
            return NextResponse.json({ message: 'Dados do cartão incompletos.' }, { status: 400 });
        }

        // Defense in depth: the client already validates this, but the API
        // boundary can't trust it — catches Luhn/expiry/CVV-shape errors
        // before spending a call to ASAAS on obviously-bad input.
        const validationError = validateCardForm({
            cardNumber,
            cardholderName,
            expirationMonth: Number(expirationMonth),
            expirationYear: Number(expirationYear),
            securityCode,
        });
        if (validationError) {
            return NextResponse.json({ message: validationError }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        decryptUser(user);

        const cpf = cardholderDocNumber || user.cpf;
        const postalCode = user.address?.zip;
        const addressNumber = user.address?.number;
        if (!cpf || !user.email || !user.phone || !postalCode || !addressNumber) {
            return NextResponse.json({
                message: 'Complete seu CPF, telefone e endereço no perfil antes de cadastrar um cartão.',
            }, { status: 400 });
        }

        // A ASAAS só aceita CEP brasileiro (8 dígitos) — sem checar aqui, um
        // endereço de teste/placeholder (ex: um CEP dos EUA salvo no perfil)
        // só falha lá na frente, na tokenização, com um erro mais confuso.
        if (postalCode.replace(/\D/g, '').length !== 8) {
            return NextResponse.json({
                message: 'O CEP do seu endereço está inválido. Atualize seu endereço no perfil antes de cadastrar um cartão.',
            }, { status: 400 });
        }

        // Um customer por usuário, criado uma vez e reaproveitado.
        if (!user.asaasCustomerId) {
            const customer = await createCustomer({
                name: user.name || 'Cliente ClickPet',
                cpfCnpj: cpf,
                email: user.email,
                externalReference: String(user._id),
            });
            user.asaasCustomerId = customer.id;
        }

        const token = await tokenizeCard({
            customerId: user.asaasCustomerId,
            remoteIp: extractClientIp(req),
            cardNumber,
            cardholderName,
            expirationMonth: String(expirationMonth).padStart(2, '0'),
            expirationYear: String(expirationYear),
            securityCode,
            holderInfo: {
                name: user.name || cardholderName,
                email: user.email,
                cpfCnpj: cpf,
                postalCode,
                addressNumber,
                phone: user.phone,
            },
        });

        // `creditCardToken` is NOT reliably unique per card — ASAAS's sandbox
        // returns the same token for a customer no matter which card number
        // is tokenized (confirmed: two different card numbers/brands for the
        // same customer came back with an identical token). So identity here
        // is the card's own visible fields, not the token — re-submitting the
        // exact same card is a no-op, but a genuinely different card (any
        // differing field) is always saved as its own row, even if ASAAS
        // happens to hand back a token already used by another saved card.
        const alreadySaved = user.savedCards.some((c: any) =>
            c.lastFourDigits === token.creditCardNumber &&
            c.brand === (token.creditCardBrand || '') &&
            c.expirationMonth === Number(expirationMonth) &&
            c.expirationYear === Number(expirationYear) &&
            c.cardholderName === cardholderName
        );
        if (!alreadySaved) {
            // A validade não vem na resposta da ASAAS — só o que o próprio
            // usuário informou, guardado aqui só para exibição na lista.
            user.savedCards.push({
                cardToken: token.creditCardToken,
                lastFourDigits: token.creditCardNumber,
                brand: token.creditCardBrand || '',
                expirationMonth: Number(expirationMonth),
                expirationYear: Number(expirationYear),
                cardholderName,
            });

            await user.save();
        }

        const updatedUser = await User.findById(session.user.id).select('savedCards');
        decryptUser(updatedUser);

        await logAction(req, 'card_added', { lastFourDigits: token.creditCardNumber });

        return NextResponse.json(updatedUser.savedCards, { status: 201 });
    } catch (error: any) {
        console.error('[Payments/Cards] Error adding card:', error.message);
        return NextResponse.json(
            { message: error.message || 'Não foi possível salvar o cartão. Confira os dados e tente novamente.' },
            { status: 400 },
        );
    }
}
