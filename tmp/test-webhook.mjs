import crypto from 'crypto';

const secret = 'clickpet_secret_abacate_2026';
const url = 'http://localhost:3000/api/payments/webhook';

async function testWebhook() {
    console.log('--- ENVIANDO WEBHOOK VÁLIDO ---');
    const validPayload = JSON.stringify({
        event: 'billing.paid',
        data: {
            id: 'simulacao_pagamento_123'
        }
    });
    const validSignature = crypto.createHmac('sha256', secret).update(validPayload).digest('hex');

    const res1 = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-abacatepay-signature': validSignature
        },
        body: validPayload
    });
    console.log('Status HTTP:', res1.status);
    console.log('Resposta:', await res1.json());
    console.log('');

    console.log('--- ENVIANDO WEBHOOK INVÁLIDO (Tentativa de Fraude) ---');
    const invalidPayload = JSON.stringify({
        event: 'billing.paid',
        data: {
            id: 'pagamento_falso_999'
        }
    });
    const res2 = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-abacatepay-signature': 'assinatura_invalida_totalmente_falsa'
        },
        body: invalidPayload
    });
    console.log('Status HTTP:', res2.status);
    console.log('Resposta:', await res2.json());
}

testWebhook();
