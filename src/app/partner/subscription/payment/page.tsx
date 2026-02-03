"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardHolder: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
    });

    useEffect(() => {
        if (!plan) {
            router.push('/partner/subscription');
        }
    }, [plan, router]);

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.cardHolder || formData.cardNumber.length < 16 || !formData.expiry || formData.cvv.length < 3) {
            showToast('Por favor, preencha todos os dados do cartão corretamente.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/subscriptions/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: plan?.toLowerCase() })
            });

            if (response.ok) {
                showToast(`Pagamento do plano ${plan} confirmado com sucesso!`);
                router.push('/partner/subscription');
            } else {
                const error = await response.json();
                showToast(error.error || 'Erro ao processar pagamento', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Erro ao conectar com o servidor', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (value: string) => {
        return value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    };

    const formatExpiry = (value: string) => {
        return value.replace(/\//g, '').replace(/(\d{2})/g, '$1/').replace(/\/$/, '').slice(0, 5);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
            <button
                onClick={() => router.back()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '2rem' }}
            >
                <ArrowLeft size={18} /> Voltar
            </button>

            <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', background: '#e8f5e9', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <CreditCard size={32} color="#6CC551" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Pagamento da Assinatura</h1>
                    <p style={{ color: '#666' }}>Plano selecionado: <strong style={{ color: '#333' }}>{plan?.toUpperCase()}</strong></p>
                </div>

                <form onSubmit={handleConfirmPayment} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Nome no Cartão</label>
                        <input
                            required
                            type="text"
                            placeholder="Como está no cartão"
                            value={formData.cardHolder}
                            onChange={e => setFormData({ ...formData, cardHolder: e.target.value.toUpperCase() })}
                            style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Número do Cartão</label>
                        <input
                            required
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={formData.cardNumber}
                            onChange={e => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                            style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Validade</label>
                            <input
                                required
                                type="text"
                                placeholder="MM/AA"
                                value={formData.expiry}
                                onChange={e => setFormData({ ...formData, expiry: formatExpiry(e.target.value) })}
                                style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>CVV</label>
                            <input
                                required
                                type="text"
                                placeholder="123"
                                value={formData.cvv}
                                onChange={e => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                                style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid #ddd', fontSize: '1rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8f9fa', borderRadius: '10px', marginTop: '1rem' }}>
                        <ShieldCheck size={20} color="#2196F3" />
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>Seu pagamento é processado de forma segura e criptografada.</span>
                    </div>

                    <button
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {loading ? <><Loader2 className="animate-spin" size={20} /> Processando...</> : 'Pagar Agora'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function SubscriptionPaymentPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem' }}>Carregando dados do pagamento...</div>}>
            <PaymentContent />
        </Suspense>
    );
}
