/**
 * AbacatePay API v2 Integration Module
 * Docs: https://docs.abacatepay.com
 * All amounts are in CENTAVOS (e.g., R$ 10.00 = 1000)
 * 
 * Migrated from v1 to v2 for production API keys.
 * v1 → v2 endpoint mapping:
 *   /billing/create   → /checkouts/create (requires product IDs)
 *   /billing/get       → /checkouts/one
 *   /billing/list      → /checkouts/list
 *   /customer/create   → /customers/create
 *   /customer/list     → /customers/list
 *   /pixQrCode/create  → /transparents/create
 *   /pixQrCode/check   → /transparents/check
 *   (new) /pix/send    → PIX transfers for split payments
 *   (new) /products/create → product registration
 */

import crypto from 'crypto';

const ABACATEPAY_BASE_URL = 'https://api.abacatepay.com/v2';

function getApiKey(): string {
    const key = process.env.ABACATEPAY_API_KEY;
    if (!key) {
        throw new Error('[AbacatePay] ABACATEPAY_API_KEY not found in environment variables');
    }
    return key;
}

function getHeaders() {
    return {
        'accept': 'application/json',
        'authorization': `Bearer ${getApiKey()}`,
        'content-type': 'application/json',
    };
}

async function apiRequest(method: string, endpoint: string, body?: any) {
    const url = `${ABACATEPAY_BASE_URL}${endpoint}`;
    
    const options: RequestInit = {
        method,
        headers: getHeaders(),
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok || data.error) {
        if (data.error !== 'Not found' && res.status !== 404) {
            console.error(`[AbacatePay] API Error (${method} ${endpoint}):`, data);
        }
        
        let errorMessage = data.error || `AbacatePay API error: ${res.status}`;
        if (errorMessage === 'Invalid taxId') {
            errorMessage = 'CNPJ Inválido';
        }
        
        throw new Error(errorMessage);
    }

    return data;
}

// ────────────── PRODUCTS ──────────────

export interface CreateProductParams {
    externalId: string;
    name: string;
    description?: string;
    price: number;   // in centavos
    currency?: string; // default "BRL"
}

/**
 * Create a product in AbacatePay (v2).
 * Products must be created before being used in checkouts.
 * Returns the product with its AbacatePay ID.
 */
export async function createProduct(params: CreateProductParams) {
    const result = await apiRequest('POST', '/products/create', {
        externalId: params.externalId,
        name: params.name,
        description: params.description,
        price: params.price,
        currency: params.currency || 'BRL',
    });
    return result.data;
}

/**
 * List all products.
 */
export async function listProducts() {
    const result = await apiRequest('GET', '/products/list');
    return result.data;
}

// ────────────── CUSTOMERS ──────────────

export interface AbacateCustomer {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;  // CPF or CNPJ
    zipCode?: string;
}

/**
 * Create a customer in AbacatePay (v2).
 * Unique by taxId — creating with existing taxId returns the existing customer.
 */
export async function createCustomer(customer: AbacateCustomer) {
    const result = await apiRequest('POST', '/customers/create', {
        email: customer.email,
        name: customer.name,
        cellphone: customer.cellphone,
        taxId: customer.taxId,
        zipCode: customer.zipCode,
    });
    return result.data;
}

/**
 * List all customers.
 */
export async function listCustomers() {
    const result = await apiRequest('GET', '/customers/list');
    return result.data;
}

// ────────────── CHECKOUT (was BILLING) ──────────────

export interface AbacateProduct {
    externalId: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;  // in centavos (min 100 = R$ 1.00)
}

export interface CreateBillingParams {
    frequency: 'ONE_TIME' | 'MULTIPLE_PAYMENTS';
    methods: ('PIX' | 'CARD')[];
    products: AbacateProduct[];
    returnUrl: string;
    completionUrl: string;
    customerId?: string;
    customer?: AbacateCustomer;
}

/**
 * Create a checkout (charge) in AbacatePay v2.
 * 
 * v2 flow: creates products first, then customer, then checkout.
 * This function handles the full flow to maintain backward compatibility
 * with the existing create-billing/create-subscription routes.
 * 
 * Returns the checkout with a payment URL (same shape as v1 billing).
 */
export async function createBilling(params: CreateBillingParams) {
    // Step 1: Create products and collect their AbacatePay IDs
    const items: { id: string; quantity: number }[] = [];
    
    for (const product of params.products) {
        const created = await createProduct({
            externalId: product.externalId,
            name: product.name,
            description: product.description,
            price: product.price,
        });
        items.push({
            id: created.id,
            quantity: product.quantity,
        });
    }

    // Step 2: Create customer if provided (get customerId)
    let customerId = params.customerId;
    if (!customerId && params.customer) {
        const customer = await createCustomer(params.customer);
        customerId = customer.id;
    }

    // Step 3: Create checkout
    const checkoutBody: any = {
        items,
        methods: params.methods,
        returnUrl: params.returnUrl,
        completionUrl: params.completionUrl,
    };

    if (customerId) {
        checkoutBody.customerId = customerId;
    }

    const result = await apiRequest('POST', '/checkouts/create', checkoutBody);
    
    // Return in a shape compatible with v1 (id, url, customer)
    return result.data;
}

/**
 * Get checkout (billing) status by ID.
 */
export async function getBilling(billingId: string) {
    try {
        const result = await apiRequest('GET', `/checkouts/one?id=${billingId}`);
        return result.data;
    } catch (error: any) {
        if (error.message && error.message.includes('Not found')) {
            // Fallback: try listing and finding
            try {
                const listData = await listBillings();
                const allBillings = listData || [];
                const matched = allBillings.find((b: any) => b.id === billingId);
                if (matched) return matched;
            } catch (listErr) {
                // Ignore fallback error
            }
        }
        throw error;
    }
}

/**
 * List all checkouts (billings).
 */
export async function listBillings() {
    const result = await apiRequest('GET', '/checkouts/list');
    return result.data;
}

// ────────────── CHECKOUT TRANSPARENTE (PIX QR CODE) ──────────────

export interface CreatePixQrCodeParams {
    amount: number;  // in centavos
    expiresIn?: number;  // seconds
    description?: string;  // max 140 chars
    customer?: AbacateCustomer;
    metadata?: Record<string, any>;
}

/**
 * Create a transparent checkout (PIX QR Code) for direct payment.
 */
export async function createPixQrCode(params: CreatePixQrCodeParams) {
    const body: any = {
        data: {
            amount: params.amount,
            description: params.description,
            expiresIn: params.expiresIn,
        },
    };

    if (params.customer) {
        body.data.customer = {
            name: params.customer.name,
            email: params.customer.email,
            taxId: params.customer.taxId,
            cellphone: params.customer.cellphone,
        };
    }

    if (params.metadata) {
        body.data.metadata = params.metadata;
    }

    const result = await apiRequest('POST', '/transparents/create', body);
    return result.data;
}

/**
 * Check the status of a transparent checkout (PIX QR Code).
 */
export async function checkPixStatus(pixId: string) {
    const result = await apiRequest('GET', `/transparents/check?id=${pixId}`);
    return result.data;
}

/**
 * Simulate payment for a transparent checkout (DEV MODE ONLY).
 */
export async function simulatePixPayment(pixId: string) {
    const result = await apiRequest('POST', `/transparents/simulate-payment?id=${pixId}`, {
        metadata: {}
    });
    return result.data;
}

// ────────────── PIX TRANSFER (split payments) ──────────────

export type PixKeyType = 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'RANDOM';

export interface SendPixParams {
    amount: number;           // in centavos (min 100 = R$ 1.00)
    pixKey: string;           // the PIX key value
    pixKeyType: PixKeyType;   // type of PIX key
    externalId: string;       // unique reference in your system
    description?: string;     // optional description (max 140 chars)
}

/**
 * Send a PIX transfer to a third party.
 * Used for split payments: sending the partner's share after a sale.
 * 
 * Endpoint: POST /v2/pix/send
 * Docs: https://docs.abacatepay.com/pages/pix/create
 */
export async function sendPix(params: SendPixParams) {
    const result = await apiRequest('POST', '/pix/send', {
        amount: params.amount,
        externalId: params.externalId,
        description: params.description || 'Repasse ClickPet',
        pixKey: params.pixKey,
        pixKeyType: params.pixKeyType,
    });
    return result.data;
}

/**
 * Get PIX transfer status by ID.
 */
export async function getPixTransfer(pixId: string) {
    const result = await apiRequest('GET', `/pix/get?id=${pixId}`);
    return result.data;
}

/**
 * Map internal pixConfig keyType to AbacatePay PixKeyType.
 * Partners store their PIX config in User.pixConfig.keyType.
 */
export function mapPixKeyType(keyType: string): PixKeyType {
    const mapping: Record<string, PixKeyType> = {
        'CPF': 'CPF',
        'CNPJ': 'CNPJ',
        'PHONE': 'PHONE',
        'Telefone': 'PHONE',
        'EMAIL': 'EMAIL',
        'Email': 'EMAIL',
        'E-mail': 'EMAIL',
        'RANDOM': 'RANDOM',
        'Aleatória': 'RANDOM',
        'Chave Aleatória': 'RANDOM',
    };
    return mapping[keyType] || 'CPF';
}

// ────────────── HELPERS ──────────────

/**
 * Convert BRL amount (e.g., 10.50) to centavos (1050).
 * Minimum AbacatePay amount is 100 centavos (R$ 1.00).
 */
export function toCentavos(brl: number): number {
    return Math.max(100, Math.round(brl * 100));
}

/**
 * Convert centavos (e.g., 1050) to BRL (10.50).
 */
export function fromCentavos(centavos: number): number {
    return centavos / 100;
}

/**
 * Clean taxId (CPF/CNPJ) by removing non-numeric characters.
 * AbacatePay usually expects numeric or standard formatted strings, 
 * but cleaning is safer for validation.
 */
export function cleanTaxId(taxId: string): string {
    return taxId.replace(/\D/g, '');
}

/**
 * Verify AbacatePay webhook signature.
 * secret: ABACATEPAY_WEBHOOK_SECRET from dashboard
 * payload: RAW stringified JSON body
 * signature: x-abacatepay-signature header
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    
    return digest === signature;
}
