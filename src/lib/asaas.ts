/**
 * ASAAS — API v3
 * Docs: https://docs.asaas.com/reference
 *
 * Gateway único do sistema: tokenização de cartão (guardar um cartão do
 * cliente para reuso), cobrança de pedidos/assinaturas (PIX e cartão) e
 * transferência PIX para o repasse ao parceiro. Substitui o AbacatePay, que
 * era usado antes só para o checkout em si.
 *
 * IMPORTANTE — fronteira de segurança, diferente da maioria dos gateways:
 * a ASAAS não tem uma "chave pública" para tokenizar direto do app (como
 * Stripe/Mercado Pago têm) — o endpoint de tokenização só aceita o
 * `access_token` da conta, que é a MESMA credencial privada usada para criar
 * cobrança, sacar, etc. Não dá pra embutir isso no app: qualquer pessoa que
 * descompilasse o binário teria controle total da conta ASAAS.
 *
 * Por isso o cartão sai do aparelho e vai para O NOSSO backend (autenticado,
 * HTTPS, a mesma API de sempre) — é este módulo, rodando aqui, quem
 * encaminha para a ASAAS com o `access_token`. O número do cartão passa em
 * trânsito pelo nosso servidor, mas nunca é logado nem persistido em lugar
 * nenhum: o handler chama `tokenizeCard` e descarta os campos crus assim que
 * a resposta chega (ver `src/app/api/payments/cards/route.ts`).
 */

import crypto from 'crypto';

// Sandbox por padrão: uma configuração incompleta/errada não deve começar a
// processar cartões reais silenciosamente. Definir ASAAS_API_URL explicitamente
// para produção (https://api.asaas.com/v3) quando estiver pronto.
const ASAAS_BASE_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

const ASAAS_PRODUCTION_URL = 'https://api.asaas.com/v3';

function getAccessToken(): string {
    const token = process.env.ASAAS_API_KEY;
    if (!token) {
        throw new Error('[Asaas] ASAAS_API_KEY not found in environment variables');
    }

    // Chave de produção (prefixo $aact_prod_) batendo em qualquer URL que não
    // seja a de produção quase sempre é um ASAAS_API_URL esquecido — sem essa
    // checagem, a chamada falha do lado da ASAAS com um erro de autenticação
    // genérico, difícil de ligar de volta à causa real.
    if (token.startsWith('$aact_prod_') && ASAAS_BASE_URL !== ASAAS_PRODUCTION_URL) {
        throw new Error(
            `[Asaas] ASAAS_API_KEY é uma chave de PRODUÇÃO, mas ASAAS_API_URL está "${ASAAS_BASE_URL}" em vez de "${ASAAS_PRODUCTION_URL}". Defina ASAAS_API_URL=${ASAAS_PRODUCTION_URL}.`
        );
    }

    return token;
}

async function apiRequest(method: string, endpoint: string, body?: any) {
    const url = `${ASAAS_BASE_URL}${endpoint}`;

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'access_token': getAccessToken(),
        },
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // NUNCA logar `body` aqui — é o único lugar do request/response que
        // pode conter os campos crus do cartão (a chamada de tokenização).
        console.error(`[Asaas] API Error (${method} ${endpoint}):`, data);
        const message = data?.errors?.[0]?.description || `Asaas API error: ${res.status}`;
        // `status` deixa quem chama distinguir "não existe mais" (404 — ex:
        // cobrança apagada direto no painel) de uma falha transitória, em vez
        // de tratar tudo como "ainda sincronizando, tenta de novo depois".
        throw Object.assign(new Error(message), { status: res.status });
    }

    return data;
}

function onlyDigits(value: string): string {
    return (value || '').replace(/\D/g, '');
}

export interface AsaasCustomer {
    id: string;
}

/**
 * Cria um customer na ASAAS para o usuário. Chamar só uma vez por usuário —
 * o id retornado deve ser guardado em `User.asaasCustomerId` e reaproveitado
 * nas próximas tokenizações.
 */
export async function createCustomer(params: {
    name: string;
    cpfCnpj: string;
    email?: string;
    externalReference: string;
}): Promise<AsaasCustomer> {
    return apiRequest('POST', '/customers', {
        name: params.name,
        cpfCnpj: onlyDigits(params.cpfCnpj),
        email: params.email,
        externalReference: params.externalReference,
    });
}

export interface AsaasTokenizeParams {
    customerId: string;
    remoteIp: string;
    cardNumber: string;
    cardholderName: string;
    expirationMonth: string; // 2 dígitos
    expirationYear: string; // 4 dígitos
    securityCode: string;
    holderInfo: {
        name: string;
        email: string;
        cpfCnpj: string;
        postalCode: string;
        addressNumber: string;
        phone: string;
    };
}

export interface AsaasCardToken {
    creditCardToken: string;
    creditCardBrand: string;
    /** Só os 4 últimos dígitos — a ASAAS não devolve o número completo de volta. */
    creditCardNumber: string;
}

/**
 * Tokeniza um cartão para o customer. O corpo desta chamada é o único lugar
 * do backend que vê o cartão inteiro — o retorno não inclui validade, então
 * quem chama precisa guardar o que o próprio usuário informou para exibição.
 */
export async function tokenizeCard(params: AsaasTokenizeParams): Promise<AsaasCardToken> {
    return apiRequest('POST', '/creditCard/tokenizeCreditCard', {
        customer: params.customerId,
        remoteIp: params.remoteIp,
        creditCard: {
            holderName: params.cardholderName,
            number: onlyDigits(params.cardNumber),
            expiryMonth: params.expirationMonth,
            expiryYear: params.expirationYear,
            ccv: params.securityCode,
        },
        creditCardHolderInfo: {
            name: params.holderInfo.name,
            email: params.holderInfo.email,
            cpfCnpj: onlyDigits(params.holderInfo.cpfCnpj),
            postalCode: onlyDigits(params.holderInfo.postalCode),
            addressNumber: params.holderInfo.addressNumber,
            phone: onlyDigits(params.holderInfo.phone),
        },
    });
}

// ────────────── PAYMENTS (charges) ──────────────

export type AsaasBillingType = 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';

export interface CreatePaymentParams {
    customerId: string;
    billingType: AsaasBillingType;
    value: number; // em reais, ex: 19.90
    description?: string;
    externalReference?: string;
    /** Cobra direto um cartão já tokenizado — sem isso a ASAAS só gera a fatura/QR. */
    creditCardToken?: string;
    remoteIp?: string;
}

export interface AsaasPayment {
    id: string;
    status: string; // PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, ...
    value: number;
    invoiceUrl: string;
    customer: string;
}

function todayDueDate(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Cria uma cobrança (PIX, cartão ou "deixa o cliente escolher" na fatura
 * hospedada). Com `creditCardToken`, a cobrança no cartão é síncrona: o
 * `status` da resposta já reflete se foi aprovada.
 */
export async function createPayment(params: CreatePaymentParams): Promise<AsaasPayment> {
    return apiRequest('POST', '/payments', {
        customer: params.customerId,
        billingType: params.billingType,
        value: params.value,
        dueDate: todayDueDate(),
        description: params.description,
        externalReference: params.externalReference,
        ...(params.creditCardToken
            ? { creditCardToken: params.creditCardToken, remoteIp: params.remoteIp }
            : {}),
    });
}

/** Consulta o estado atual de uma cobrança — usado por polling e idempotência. */
export async function getPayment(paymentId: string): Promise<AsaasPayment> {
    return apiRequest('GET', `/payments/${paymentId}`);
}

export interface AsaasPixQrCode {
    encodedImage: string; // base64 (PNG)
    payload: string; // copia-e-cola
    expirationDate: string;
}

/** Busca o QR code / copia-e-cola de uma cobrança PIX já criada. */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return apiRequest('GET', `/payments/${paymentId}/pixQrCode`);
}

// ────────────── TRANSFERS (repasse ao parceiro) ──────────────

export type AsaasPixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';

export interface CreatePixTransferParams {
    value: number; // em reais
    pixKey: string;
    pixKeyType: AsaasPixKeyType;
    description?: string;
}

export interface AsaasTransfer {
    id: string;
    status: string; // PENDING, BANK_PROCESSING, DONE, CANCELLED, FAILED
    effectiveDate?: string;
    transferFee?: number;
}

/**
 * Transfere via PIX para uma chave qualquer, sem exigir que o destinatário
 * tenha conta na ASAAS — usado pelo repasse automático ao parceiro
 * (ver `src/lib/split-service.ts`).
 */
export async function createPixTransfer(params: CreatePixTransferParams): Promise<AsaasTransfer> {
    return apiRequest('POST', '/transfers', {
        value: params.value,
        pixAddressKey: params.pixKey,
        pixAddressKeyType: params.pixKeyType,
        description: params.description || 'Repasse ClickPet',
    });
}

/**
 * Mapeia o `keyType` em português salvo em `User.pixConfig.keyType` para o
 * tipo de chave que a ASAAS espera. Chave aleatória é `EVP` na ASAAS (não
 * `RANDOM`, que é o nome usado por outros gateways).
 */
export function mapPixKeyTypeAsaas(keyType: string): AsaasPixKeyType {
    const mapping: Record<string, AsaasPixKeyType> = {
        'CPF': 'CPF',
        'CNPJ': 'CNPJ',
        'TELEFONE': 'PHONE',
        'E-MAIL': 'EMAIL',
        'CHAVE ALEATÓRIA': 'EVP',
        'PHONE': 'PHONE',
        'Telefone': 'PHONE',
        'EMAIL': 'EMAIL',
        'Email': 'EMAIL',
        'E-mail': 'EMAIL',
        'EVP': 'EVP',
        'RANDOM': 'EVP',
        'Aleatória': 'EVP',
        'Chave Aleatória': 'EVP',
    };
    return mapping[keyType] || 'CPF';
}

// ────────────── WEBHOOK ──────────────

/**
 * Verifica o header `asaas-access-token` do webhook contra o token
 * configurado (`ASAAS_WEBHOOK_TOKEN`) — a ASAAS não assina o payload com
 * HMAC, só ecoa de volta o token estático cadastrado na criação do webhook.
 * `timingSafeEqual` evita vazar o tamanho/conteúdo do token por timing.
 */
export function verifyWebhookToken(headerToken: string | null, secret: string): boolean {
    if (!headerToken || !secret) return false;
    const a = Buffer.from(headerToken);
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

// ────────────── HELPERS ──────────────

/**
 * IP de quem está pagando — a ASAAS pede isso para antifraude em cobranças
 * de cartão. `x-forwarded-for` pode trazer uma lista (proxy/CDN
 * encadeados); o primeiro valor é o cliente original.
 */
export function extractClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.headers.get('x-real-ip') || '0.0.0.0';
}
