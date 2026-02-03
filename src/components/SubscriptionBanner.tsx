"use client";

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionBannerProps {
    partnerId: string;
}

export default function SubscriptionBanner({ partnerId }: SubscriptionBannerProps) {
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'warning' | 'error'>('warning');

    useEffect(() => {
        checkSubscription();
    }, [partnerId]);

    const checkSubscription = async () => {
        try {
            const response = await fetch('/api/subscriptions/current');
            if (response.ok) {
                const data = await response.json();

                if (!data.isActive) {
                    setMessage('Sua assinatura está inativa. Renove agora para continuar usando todos os recursos.');
                    setType('error');
                    setShow(true);
                } else if (data.isExpiringSoon) {
                    const daysLeft = Math.ceil((new Date(data.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    setMessage(`Sua assinatura vence em ${daysLeft} dias. Renove agora para evitar interrupções.`);
                    setType('warning');
                    setShow(true);
                }
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    if (!show) return null;

    return (
        <div style={{
            background: type === 'error' ? 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)' : 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            position: 'relative'
        }}>
            <AlertCircle size={24} />
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {type === 'error' ? 'Assinatura Inativa' : 'Assinatura Expirando'}
                </p>
                <p style={{ fontSize: '0.9rem', opacity: 0.95 }}>{message}</p>
            </div>
            <Link
                href="/partner/subscription"
                style={{
                    background: 'white',
                    color: type === 'error' ? '#F44336' : '#FF9800',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap'
                }}
            >
                Ver Planos
            </Link>
            <button
                onClick={() => setShow(false)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <X size={20} />
            </button>
        </div>
    );
}
