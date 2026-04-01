"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function PaymentReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        // Auto-redirect after 5 seconds
        const timer = setTimeout(() => {
            router.push(orderId ? '/checkout' : '/');
        }, 5000);
        return () => clearTimeout(timer);
    }, [orderId, router]);

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
                <ArrowLeft
                    size={64}
                    color="#757575"
                    style={{ marginBottom: '1.5rem' }}
                />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#253D4E', marginBottom: '0.5rem' }}>
                    Pagamento Pendente
                </h1>
                <p style={{ color: '#757575', fontSize: '0.95rem', marginBottom: '2rem' }}>
                    Você saiu da página de pagamento. Seu pedido ainda está pendente.
                    Você será redirecionado em 5 segundos...
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => router.push(orderId ? '/checkout' : '/')}
                        style={{
                            flex: 1,
                            padding: '0.9rem',
                            background: '#253D4E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        VOLTAR
                    </button>
                    <button
                        onClick={() => router.push('/orders')}
                        style={{
                            flex: 1,
                            padding: '0.9rem',
                            background: '#3BB77E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        VER PEDIDOS
                    </button>
                </div>
            </div>
        </div>
    );
}

import { Suspense } from 'react';

export default function PaymentReturnPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem' }}>Carregando...</div>}>
            <PaymentReturnContent />
        </Suspense>
    );
}
