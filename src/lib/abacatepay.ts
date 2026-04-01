/**
 * AbacatePay API Integration Module
 * Docs: https://docs.abacatepay.com
 * All amounts are in CENTAVOS (e.g., R$ 10.00 = 1000)
 */

const ABACATEPAY_BASE_URL = 'https://api.abacatepay.com/v1';

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
        throw new Error(data.error || `AbacatePay API error: ${res.status}`);
    }

    return data;
}

// ────────────── CUSTOMERS ──────────────

export interface AbacateCustomer {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;  // CPF or CNPJ
}

/**
 * Create a customer in AbacatePay.
 */
export async function createCustomer(customer: AbacateCustomer) {
    const result = await apiRequest('POST', '/customer/create', customer);
    return result.data;
}

/**
 * List all customers.
 */
export async function listCustomers() {
    const result = await apiRequest('GET', '/customer/list');
    return result.data;
}

// ────────────── BILLING ──────────────

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
 * Create a billing (charge) in AbacatePay.
 * Returns the billing with a payment URL.
 */
export async function createBilling(params: CreateBillingParams) {
    const result = await apiRequest('POST', '/billing/create', params);
    return result.data;
}

/**
 * Get billing status by ID.
 */
export async function getBilling(billingId: string) {
    try {
        const result = await apiRequest('GET', `/billing/get?id=${billingId}`);
        return result.data;
    } catch (error: any) {
        if (error.message && error.message.includes('Not found')) {
            // AbacatePay Sandbox edge case fallback: event consistency /get vs /list
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
 * List all billings.
 */
export async function listBillings() {
    const result = await apiRequest('GET', '/billing/list');
    return result.data;
}

// ────────────── PIX QR CODE ──────────────

export interface CreatePixQrCodeParams {
    amount: number;  // in centavos
    expiresIn?: number;  // seconds
    description?: string;  // max 140 chars
    customer?: AbacateCustomer;
    metadata?: Record<string, any>;
}

/**
 * Create a PIX QR Code for direct payment.
 */
export async function createPixQrCode(params: CreatePixQrCodeParams) {
    const result = await apiRequest('POST', '/pixQrCode/create', params);
    return result.data;
}

/**
 * Check the status of a PIX QR Code payment.
 */
export async function checkPixStatus(pixId: string) {
    const result = await apiRequest('GET', `/pixQrCode/check?id=${pixId}`);
    return result.data;
}

/**
 * Simulate payment for a PIX QR Code (DEV MODE ONLY).
 */
export async function simulatePixPayment(pixId: string) {
    const result = await apiRequest('POST', `/pixQrCode/simulate-payment?id=${pixId}`, {
        metadata: {}
    });
    return result.data;
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
