"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, TrendingUp, BarChart, Zap } from 'lucide-react';

interface SubscriptionDetails {
    plan: string;
    status: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
    features: any;
    usage: {
        products: { current: number; limit: number; percentage: number };
        services: { current: number; limit: number; percentage: number };
    };
}

export default function PartnerSubscriptionPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchSubscription();
        }
    }, [session]);

    const fetchSubscription = async () => {
        try {
            const response = await fetch('/api/subscriptions/current');
            if (response.ok) {
                const data = await response.json();
                setSubscription(data);
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = (planName: string) => {
        router.push(`/partner/subscription/payment?plan=${planName}`);
    };

    const plans = [
        {
            name: 'Free',
            price: 0,
            features: [
                'Até 10 produtos',
                'Até 5 serviços',
                'Até 3 imagens por produto',
                'Suporte por email'
            ],
            color: '#666',
            bgColor: '#F5F5F5'
        },
        {
            name: 'Basic',
            price: 49.90,
            features: [
                'Até 50 produtos',
                'Até 20 serviços',
                'Até 5 imagens por produto',
                'Analytics básico',
                'Suporte prioritário'
            ],
            color: '#2196F3',
            bgColor: '#E3F2FD',
            popular: false
        },
        {
            name: 'Premium',
            price: 99.90,
            features: [
                'Produtos ilimitados',
                'Serviços ilimitados',
                'Até 10 imagens por produto',
                'Analytics avançado',
                'Relatórios detalhados',
                'Suporte prioritário'
            ],
            color: '#9C27B0',
            bgColor: '#F3E5F5',
            popular: true
        },
        {
            name: 'Enterprise',
            price: 199.90,
            features: [
                'Tudo do Premium',
                'Imagens ilimitadas',
                'Suporte dedicado 24/7',
                'Gerente de conta',
                'Treinamento personalizado'
            ],
            color: '#FF9800',
            bgColor: '#FFF3E0'
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="section-title">Minha Assinatura</h1>

            {/* Current Subscription */}
            {subscription && (
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                Plano {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                            </h2>
                            <p style={{ color: '#666' }}>
                                Válido até {new Date(subscription.endDate).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <span style={{
                            background: subscription.isActive ? '#E8F5E9' : '#FFEBEE',
                            color: subscription.isActive ? '#4CAF50' : '#F44336',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontWeight: 600
                        }}>
                            {subscription.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                    </div>

                    {/* Usage Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600 }}>Produtos</span>
                                <span style={{ color: '#666' }}>
                                    {subscription.usage.products.current} / {subscription.usage.products.limit === -1 ? '∞' : subscription.usage.products.limit}
                                </span>
                            </div>
                            <div style={{
                                background: '#f0f0f0',
                                borderRadius: '8px',
                                height: '8px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    background: '#6CC551',
                                    height: '100%',
                                    width: `${Math.min(subscription.usage.products.percentage, 100)}%`,
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600 }}>Serviços</span>
                                <span style={{ color: '#666' }}>
                                    {subscription.usage.services.current} / {subscription.usage.services.limit === -1 ? '∞' : subscription.usage.services.limit}
                                </span>
                            </div>
                            <div style={{
                                background: '#f0f0f0',
                                borderRadius: '8px',
                                height: '8px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    background: '#6CC551',
                                    height: '100%',
                                    width: `${Math.min(subscription.usage.services.percentage, 100)}%`,
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Available Plans */}
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                Planos Disponíveis
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {plans.map((plan) => (
                    <div key={plan.name} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        boxShadow: plan.popular ? '0 8px 24px rgba(108, 197, 81, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                        border: plan.popular ? '2px solid #6CC551' : 'none',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = plan.popular ? '0 12px 32px rgba(108, 197, 81, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = plan.popular ? '0 8px 24px rgba(108, 197, 81, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)';
                        }}>
                        {plan.popular && (
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#6CC551',
                                color: 'white',
                                padding: '0.3rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: 600
                            }}>
                                Mais Popular
                            </div>
                        )}

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {plan.name}
                        </h3>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: plan.color }}>
                                R$ {plan.price.toFixed(2)}
                            </span>
                            <span style={{ color: '#666' }}>/mês</span>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                            {plan.features.map((feature, idx) => (
                                <li key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '0.75rem',
                                    color: '#666'
                                }}>
                                    <Check size={20} color="#6CC551" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                background: plan.popular ? '#6CC551' : plan.bgColor,
                                color: plan.popular ? 'white' : plan.color,
                                border: 'none',
                                opacity: submitting ? 0.7 : 1,
                                cursor: submitting ? 'not-allowed' : 'pointer'
                            }}
                            disabled={submitting || subscription?.plan === plan.name.toLowerCase()}
                            onClick={() => handleSubscribe(plan.name)}
                        >
                            {submitting ? 'Processando...' : subscription?.plan === plan.name.toLowerCase() ? 'Plano Atual' : 'Escolher Plano'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
