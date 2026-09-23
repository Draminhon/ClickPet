"use client";

import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { maskCardNumber, maskExpiry, maskCVV } from '@/utils/masks';
import { detectCardBrand, cvvLength, validateCardForm, CardBrand } from '@/utils/cardValidation';
import styles from './CardForm.module.css';

export interface CardFormData {
    cardNumber: string;
    cardholderName: string;
    expirationMonth: number;
    expirationYear: number;
    securityCode: string;
}

const BRAND_LABEL: Record<CardBrand, string> = {
    VISA: 'Visa',
    MASTERCARD: 'Mastercard',
    AMEX: 'American Express',
    ELO: 'Elo',
    HIPERCARD: 'Hipercard',
    DINERS: 'Diners Club',
    DISCOVER: 'Discover',
    UNKNOWN: '',
};

interface CardFormProps {
    onSubmit: (data: CardFormData) => void | Promise<void>;
    onCancel?: () => void;
    submitLabel?: string;
    loading?: boolean;
}

export default function CardForm({ onSubmit, onCancel, submitLabel = 'Salvar Cartão', loading = false }: CardFormProps) {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [error, setError] = useState('');

    const brand = detectCardBrand(cardNumber);
    const maxCvvLength = cvvLength(brand);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const [monthStr, yearStr] = expiry.split('/');
        const expirationMonth = parseInt(monthStr || '', 10);
        // Card forms conventionally collect a 2-digit year (YY); ASAAS and
        // our validation both expect 4 digits.
        const expirationYear = yearStr ? 2000 + parseInt(yearStr, 10) : NaN;

        const formData: CardFormData = {
            cardNumber: cardNumber.replace(/\D/g, ''),
            cardholderName: cardholderName.trim(),
            expirationMonth,
            expirationYear,
            securityCode: cvv,
        };

        const validationError = validateCardForm(formData);
        if (validationError) {
            setError(validationError);
            return;
        }

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.cardForm}>
            <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Número do cartão</label>
                <div className={styles.inputWithIcon}>
                    <CreditCard size={18} className={styles.inputIcon} />
                    <input
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                        className={styles.fieldInput}
                        required
                    />
                    {brand !== 'UNKNOWN' && <span className={styles.brandBadge}>{BRAND_LABEL[brand]}</span>}
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Nome impresso no cartão</label>
                <input
                    autoComplete="cc-name"
                    placeholder="Como está no cartão"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                    className={styles.fieldInput}
                    required
                />
            </div>

            <div className={styles.fieldRow2}>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Validade</label>
                    <input
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(e) => setExpiry(maskExpiry(e.target.value))}
                        className={styles.fieldInput}
                        required
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>CVV</label>
                    <div className={styles.inputWithIcon}>
                        <Lock size={16} className={styles.inputIcon} />
                        <input
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder={'•'.repeat(maxCvvLength)}
                            value={cvv}
                            onChange={(e) => setCvv(maskCVV(e.target.value, maxCvvLength))}
                            className={styles.fieldInput}
                            required
                        />
                    </div>
                </div>
            </div>

            {error && <p className={styles.formError}>{error}</p>}

            <p className={styles.securityNote}>
                <Lock size={13} /> Seus dados são enviados direto para o gateway de pagamento e nunca ficam salvos no ClickPet.
            </p>

            <div className={styles.formActions}>
                {onCancel && (
                    <button type="button" onClick={onCancel} className={styles.cancelBtn} disabled={loading}>
                        Cancelar
                    </button>
                )}
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Processando...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
