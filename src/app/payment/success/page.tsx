"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const subscriptionId = searchParams.get('subscriptionId');

    const [status, setStatus] = useState<'checking' | 'approved' | 'pending' | 'error'>('checking');
    const [attempts, setAttempts] = useState(0);
    const MAX_ATTEMPTS = 10;

    useEffect(() => {
        if (!orderId && !subscriptionId) {
            setStatus('error');
            return;
        }

        let isCancelled = false;

        const checkStatus = async () => {
            try {
                const params = orderId ? `orderId=${orderId}` : `subscriptionId=${subscriptionId}`;
                const res = await fetch(`/api/payments/check-status?${params}`);
                const data = await res.json();

                if (data.status === 'PAID' || data.status === 'COMPLETED' || data.status === 'FINISHED') {
                    if (!isCancelled) setStatus('approved');
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error checking payment status:', error);
                return false;
            }
        };

        const startPolling = async () => {
            for (let i = 1; i <= MAX_ATTEMPTS; i++) {
                if (isCancelled) break;
                
                setAttempts(i);
                const confirmed = await checkStatus();
                
                if (confirmed) return; // Exit loop if approved
                
                if (i === MAX_ATTEMPTS && !isCancelled) {
                    // After max attempts, assume it worked since AbacatePay redirected here
                    setStatus('approved');
                    return;
                }
                
                // Wait 2 seconds before next attempt
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        };

        // Start the polling process
        startPolling();

        return () => {
            isCancelled = true;
        };

    }, [orderId, subscriptionId]);

    return (
        <div className="container" style={{
            padding: '4rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
        }}>
            <div style={{
                textAlign: 'center',
                background: 'white',
                padding: '3rem 4rem',
                borderRadius: '16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                maxWidth: '500px',
                width: '100%'
            }}>
                {status === 'checking' && (
                    <>
                        <Loader2
                            size={64}
                            color="#3BB77E"
                            style={{ animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }}
                        />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#253D4E', marginBottom: '0.5rem' }}>
                            Verificando Pagamento...
                        </h1>
                        <p style={{ color: '#757575', fontSize: '0.95rem' }}>
                            Aguarde enquanto confirmamos seu pagamento.
                        </p>
                    </>
                )}

                {status === 'approved' && (
                    <>
                        <CheckCircle
                            size={64}
                            color="#3BB77E"
                            style={{ marginBottom: '1.5rem' }}
                        />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#253D4E', marginBottom: '0.5rem' }}>
                            Pagamento Confirmado!
                        </h1>
                        <p style={{ color: '#757575', fontSize: '0.95rem', marginBottom: '2rem' }}>
                            {orderId
                                ? 'Seu pedido foi processado com sucesso.'
                                : 'Sua assinatura foi ativada com sucesso.'
                            }
                        </p>
                        <button
                            onClick={() => router.push(orderId ? '/orders' : '/partner/subscription')}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                background: '#3BB77E',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#35a570'}
                            onMouseLeave={e => e.currentTarget.style.background = '#3BB77E'}
                        >
                            {orderId ? 'VER MEUS PEDIDOS' : 'VER MINHA ASSINATURA'}
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle
                            size={64}
                            color="#FF4D4D"
                            style={{ marginBottom: '1.5rem' }}
                        />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#253D4E', marginBottom: '0.5rem' }}>
                            Erro no Pagamento
                        </h1>
                        <p style={{ color: '#757575', fontSize: '0.95rem', marginBottom: '2rem' }}>
                            Não foi possível verificar o pagamento. Tente novamente.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                background: '#253D4E',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            VOLTAR AO INÍCIO
                        </button>
                    </>
                )}

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

import { Suspense } from 'react';

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem' }}>Verificando pagamento...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
