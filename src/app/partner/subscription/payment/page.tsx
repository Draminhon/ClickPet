"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, QrCode, CheckCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const PLAN_DETAILS: Record<string, { name: string; price: string }> = {
    basic: { name: 'Plano Básico', price: 'R$ 49,90' },
    premium: { name: 'Plano Premium', price: 'R$ 99,90' },
    enterprise: { name: 'Plano Enterprise', price: 'R$ 199,90' },
};

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');
    const status = searchParams.get('status');
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!plan || !PLAN_DETAILS[plan]) {
            router.push('/partner/subscription');
        }
    }, [plan, router]);

    // Show return status message
    useEffect(() => {
        if (status === 'return') {
            showToast('Pagamento pendente. Clique em "Pagar" para tentar novamente.', 'error');
        }
    }, [status]);

    const handlePayWithAbacatePay = async () => {
        if (!plan) return;

        setLoading(true);
        try {
            const response = await fetch('/api/payments/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: plan.toLowerCase() }),
            });

            const data = await response.json();

            if (response.ok && data.billingUrl) {
                // Redirect to AbacatePay payment page
                window.location.href = data.billingUrl;
            } else if (response.status === 400 && data.message && data.message.includes('CPF')) {
                showToast('Preencha seu CPF ou CNPJ no perfil antes de assinar. Redirecionando...', 'error');
                setTimeout(() => {
                    router.push('/partner/settings');
                }, 2000);
            } else {
                showToast(data.message || 'Erro ao gerar pagamento', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Erro ao conectar com o servidor', 'error');
        } finally {
            setLoading(false);
        }
    };

    const planInfo = plan ? PLAN_DETAILS[plan] : null;

    if (!planInfo) return null;

    return (
        <div style={{ maxWidth: '550px', margin: '0 auto', padding: '2rem 1rem' }}>
            <button
                onClick={() => router.back()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '2rem' }}
            >
                <ArrowLeft size={18} /> Voltar
            </button>

            <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', background: '#e8f5e9', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                        <CreditCard size={32} color="#3BB77E" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#253D4E' }}>
                        Pagamento da Assinatura
                    </h1>
                </div>

                {/* Plan Summary */}
                <div style={{
                    background: '#f8faf8',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    border: '1px solid #e0e0e0'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#757575', textTransform: 'uppercase', fontWeight: 600 }}>Plano Selecionado</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#253D4E' }}>{planInfo.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#757575', textTransform: 'uppercase', fontWeight: 600 }}>Valor Mensal</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3BB77E' }}>{planInfo.price}</span>
                    </div>
                </div>

                {/* Payment Methods Info */}
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#757575', marginBottom: '1rem', textAlign: 'center' }}>
                        Métodos de pagamento aceitos:
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.25rem', background: '#f0f7ff', borderRadius: '10px',
                            border: '1px solid #d0e3f7'
                        }}>
                            <QrCode size={20} color="#1976D2" />
                            <span style={{ fontWeight: 600, color: '#1976D2', fontSize: '0.9rem' }}>PIX</span>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.25rem', background: '#f5f0ff', borderRadius: '10px',
                            border: '1px solid #d7ccf5'
                        }}>
                            <CreditCard size={20} color="#7B1FA2" />
                            <span style={{ fontWeight: 600, color: '#7B1FA2', fontSize: '0.9rem' }}>Cartão</span>
                        </div>
                    </div>
                </div>

                {/* Security Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8f9fa', borderRadius: '10px', marginBottom: '1.5rem' }}>
                    <ShieldCheck size={20} color="#2196F3" />
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                        Pagamento processado de forma segura via <strong>AbacatePay</strong>. Seus dados financeiros não são armazenados em nossos servidores.
                    </span>
                </div>

                {/* Features List */}
                <div style={{ marginBottom: '2rem' }}>
                    {[
                        'Pagamento instantâneo via PIX',
                        'Cartão de crédito com aprovação imediata',
                        'Assinatura ativada automaticamente após confirmação',
                    ].map((feature, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <CheckCircle size={16} color="#3BB77E" />
                            <span style={{ fontSize: '0.85rem', color: '#555' }}>{feature}</span>
                        </div>
                    ))}
                </div>

                {/* Pay Button */}
                <button
                    onClick={handlePayWithAbacatePay}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '1.1rem',
                        fontSize: '1rem',
                        fontWeight: 700,
                        background: '#3BB77E',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(59, 183, 126, 0.25)',
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#35a570'; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#3BB77E'; }}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            Redirecionando...
                        </>
                    ) : (
                        `PAGAR ${planInfo.price}`
                    )}
                </button>

                <style jsx>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
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
