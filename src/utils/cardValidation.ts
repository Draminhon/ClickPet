/**
 * Client- and server-shared credit card validation. Kept dependency-free
 * (no external card lib) since the only thing that needs checking is basic
 * shape — the real validity check happens at ASAAS when the card is
 * tokenized. This just catches typos before a wasted round-trip.
 */

export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'ELO' | 'HIPERCARD' | 'DINERS' | 'DISCOVER' | 'UNKNOWN';

/** Standard mod-10 checksum — catches typos/transpositions in the card number. */
export function luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 12 || digits.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
}

/**
 * Detects brand from BIN ranges. Covers the brands ASAAS/Brazilian issuers
 * actually use; anything else falls back to UNKNOWN (still payable — brand
 * is only used for CVV length and display, ASAAS does its own BIN lookup).
 */
export function detectCardBrand(cardNumber: string): CardBrand {
    const digits = cardNumber.replace(/\D/g, '');

    if (/^4/.test(digits)) return 'VISA';
    if (/^3[47]/.test(digits)) return 'AMEX';
    if (/^3(0[0-5]|[68])/.test(digits)) return 'DINERS';
    if (/^6(?:011|5)/.test(digits)) return 'DISCOVER';
    if (/^606282|^3841/.test(digits)) return 'HIPERCARD';
    // Elo: known issuer BIN prefixes (not a contiguous range like the others).
    if (/^(4011|4312|4389|4514|4573|4576|5041|5066|5067|509|6277|6362|6363|6500|6504|6505|6516|6550)/.test(digits)) {
        return 'ELO';
    }
    if (/^5[1-5]/.test(digits) || /^2(2[2-9][1-9]|2[3-9]\d|[3-6]\d\d|7[01]\d|720)/.test(digits)) return 'MASTERCARD';

    return 'UNKNOWN';
}

export function cvvLength(brand: CardBrand): number {
    return brand === 'AMEX' ? 4 : 3;
}

export function validateCardNumber(cardNumber: string): { valid: true } | { valid: false; message: string } {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 12 || digits.length > 19) {
        return { valid: false, message: 'Número do cartão inválido.' };
    }
    if (!luhnCheck(digits)) {
        return { valid: false, message: 'Número do cartão inválido.' };
    }
    return { valid: true };
}

export function validateCVV(cvv: string, brand: CardBrand): { valid: true } | { valid: false; message: string } {
    const digits = cvv.replace(/\D/g, '');
    const expected = cvvLength(brand);
    if (digits.length !== expected) {
        return { valid: false, message: `CVV deve ter ${expected} dígitos.` };
    }
    return { valid: true };
}

export function validateExpiry(month: number, year: number): { valid: true } | { valid: false; message: string } {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        return { valid: false, message: 'Mês de validade inválido.' };
    }
    if (!Number.isInteger(year) || String(year).length !== 4) {
        return { valid: false, message: 'Ano de validade inválido.' };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { valid: false, message: 'Cartão vencido.' };
    }
    // Sanity cap — catches a fat-fingered year (e.g. 2099) without being a real limit.
    if (year > currentYear + 20) {
        return { valid: false, message: 'Ano de validade inválido.' };
    }
    return { valid: true };
}

export function validateCardholderName(name: string): { valid: true } | { valid: false; message: string } {
    const trimmed = (name || '').trim();
    if (trimmed.length < 3) {
        return { valid: false, message: 'Informe o nome impresso no cartão.' };
    }
    if (!/^[A-Za-zÀ-ÿ\s'.-]+$/.test(trimmed)) {
        return { valid: false, message: 'Nome do titular contém caracteres inválidos.' };
    }
    return { valid: true };
}

export interface CardFormInput {
    cardNumber: string;
    cardholderName: string;
    expirationMonth: number;
    expirationYear: number;
    securityCode: string;
}

/** Runs every check; returns the first failure, or null if the card data is well-formed. */
export function validateCardForm(input: CardFormInput): string | null {
    const numberCheck = validateCardNumber(input.cardNumber);
    if (!numberCheck.valid) return numberCheck.message;

    const brand = detectCardBrand(input.cardNumber);

    const nameCheck = validateCardholderName(input.cardholderName);
    if (!nameCheck.valid) return nameCheck.message;

    const expiryCheck = validateExpiry(input.expirationMonth, input.expirationYear);
    if (!expiryCheck.valid) return expiryCheck.message;

    const cvvCheck = validateCVV(input.securityCode, brand);
    if (!cvvCheck.valid) return cvvCheck.message;

    return null;
}
