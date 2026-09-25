"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import styles from './Subscription.module.css';

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

const PLAN_DISPLAY_NAMES: Record<string, string> = {
    free: 'Plano Free',
    basic: 'Plano Basic',
    premium: 'Plano Premium',
    enterprise: 'Plano Enterprise',
};

const MONTHS_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Product/service limits per plan, kept in sync with the `plans` feature copy below.
// -1 means unlimited.
const PLAN_LIMITS: Record<string, { products: number; services: number }> = {
    free: { products: 10, services: 5 },
    basic: { products: 50, services: 20 },
    premium: { products: -1, services: -1 },
    enterprise: { products: -1, services: -1 },
};

export default function PartnerSubscriptionPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Holds the plan key being downgraded to (e.g. 'free', 'basic') while the
    // confirmation modal is open; null means the modal is closed.
    const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // Shown after payment status polling exhausts its attempts without a
    // definitive success signal — an honest "still processing" state instead
    // of assuming success or silently giving up.
    const [showPendingBanner, setShowPendingBanner] = useState(false);
    const [isRechecking, setIsRechecking] = useState(false);

    useEffect(() => {
        const status = new URLSearchParams(window.location.search).get('status');
        if (status === 'success' || status === 'concluded') {
            showToast('Assinatura processada com sucesso!', 'success');
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [showToast]);

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
                
                // If a payment was pending and now it's active, refresh the whole session to update UI role
                if (data.status === 'active' && subscription?.status === 'pending') {
                    router.refresh();
                }
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    // Single status check against our own subscription record. Returns true
    // only when the subscription is confirmed active/paid; false covers both
    // "still pending" and "request failed", neither of which should be
    // reported as a success. Mirrors the pattern used by
    // payment/success/page.tsx's checkPaymentStatus.
    const checkSubscriptionStatus = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/subscriptions/current');
            if (response.ok) {
                const data = await response.json();
                setSubscription(data);
                if (data.status === 'active' || data.status === 'PAID') {
                    return true;
                }
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
        }
        return false;
    }, []);

    // POLLING FOR PAYMENT STATUS
    useEffect(() => {
        const status = new URLSearchParams(window.location.search).get('status');
        const billingId = new URLSearchParams(window.location.search).get('billingId');

        if (status === 'return' || billingId) {
            setLoading(true);
            showToast('Verificando status do pagamento...', 'info');

            let attempts = 0;
            const maxAttempts = 10;
            const interval = setInterval(async () => {
                attempts++;
                const confirmed = await checkSubscriptionStatus();
                if (confirmed) {
                    clearInterval(interval);
                    setLoading(false);
                    showToast('Pagamento confirmado! Sua assinatura está ativa.', 'success');
                    // Clean URL and refresh session
                    window.history.replaceState({}, '', '/partner/subscription');
                    router.refresh();
                    return;
                }

                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    setLoading(false);
                    // We genuinely don't know if this is still settling or was
                    // declined — the underlying status field doesn't distinguish
                    // the two — so we say so honestly and let the owner recheck.
                    setShowPendingBanner(true);
                    window.history.replaceState({}, '', '/partner/subscription');
                }
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [showToast, router, checkSubscriptionStatus]);

    const handleRecheckPayment = async () => {
        setIsRechecking(true);
        try {
            const confirmed = await checkSubscriptionStatus();
            if (confirmed) {
                setShowPendingBanner(false);
                showToast('Pagamento confirmado! Sua assinatura está ativa.', 'success');
                router.refresh();
            } else {
                showToast('Pagamento ainda não confirmado. Tente novamente em alguns instantes.', 'info');
            }
        } finally {
            setIsRechecking(false);
        }
    };

    const handleSubscribe = (planName: string) => {
        const planOrder = ['free', 'basic', 'premium', 'enterprise'];
        const currentPlan = subscription?.plan || 'free';
        const currentIdx = planOrder.indexOf(currentPlan);
        const targetIdx = planOrder.indexOf(planName);

        if (targetIdx < currentIdx) {
            // Any downgrade (not just to Free) risks hiding products/services
            // that exceed the target plan's limits, so it always gets the
            // same confirmation step.
            setDowngradeTarget(planName);
            return;
        }
        router.push(`/partner/subscription/payment?plan=${planName}`);
    };

    const handleConfirmDowngrade = () => {
        if (!downgradeTarget) return;
        if (downgradeTarget === 'free') {
            handleDowngradeToFree();
        } else {
            const target = downgradeTarget;
            setDowngradeTarget(null);
            router.push(`/partner/subscription/payment?plan=${target}`);
        }
    };

    const handleDowngradeToFree = async () => {
        setIsCancelling(true);
        try {
            const response = await fetch('/api/subscriptions/cancel', {
                method: 'POST',
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.message, 'success');
                setDowngradeTarget(null);
                fetchSubscription();
            } else {
                showToast(data.message || 'Erro ao cancelar assinatura', 'error');
            }
        } catch (error) {
            console.error('Error downgrading:', error);
            showToast('Erro ao conectar com o servidor', 'error');
        } finally {
            setIsCancelling(false);
        }
    };

    const formatRenewalDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `RENOVAÇÃO EM ${d.getDate()} ${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`;
    };

    const plans = [
        {
            key: 'free',
            name: 'Plano Free',
            price: 0,
            features: [
                'Até 10 produtos',
                'Até 5 serviços',
                'Até 3 imagens por produto',
                'Suporte por email',
            ],
        },
        {
            key: 'basic',
            name: 'Plano Basic',
            price: 49.90,
            features: [
                'Até 50 produtos',
                'Até 20 serviços',
                'Até 5 imagens por produto',
                'Analytics básico',
                'Suporte prioritário',
            ],
        },
        {
            key: 'premium',
            name: 'Plano Premium',
            price: 99.90,
            recommended: true,
            features: [
                'Produtos ilimitados',
                'Serviços ilimitados',
                'Até 10 imagens por produto',
                'Analytics avançado',
                'Relatórios detalhados',
                'Suporte prioritário',
            ],
        },
        {
            key: 'enterprise',
            name: 'Plano Enterprise',
            price: 199.90,
            features: [
                'Tudo do Premium',
                'Imagens ilimitadas',
                'Suporte dedicado 24/7',
                'Gerente de conta',
                'Treinamento personalizado',
            ],
        },
    ];

    // Overall capacity used
    const overallCapacity = useMemo(() => {
        if (!subscription) return 0;
        const pPct = subscription.usage.products.limit === -1 ? 0 : subscription.usage.products.percentage;
        const sPct = subscription.usage.services.limit === -1 ? 0 : subscription.usage.services.percentage;
        return Math.round((pPct + sPct) / 2);
    }, [subscription]);

    const getPlanButtonProps = (planKey: string) => {
        const currentPlan = subscription?.plan || 'free';
        const planOrder = ['free', 'basic', 'premium', 'enterprise'];
        const currentIdx = planOrder.indexOf(currentPlan);
        const targetIdx = planOrder.indexOf(planKey);

        if (planKey === currentPlan) {
            return { label: 'PLANO ATIVO', className: styles.activeBtn, disabled: true };
        }
        if (targetIdx < currentIdx) {
            return { label: 'RETROCEDER', className: styles.downgradeBtn, disabled: false };
        }
        return { label: 'UPGRADE', className: styles.upgradeCardBtn, disabled: false };
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><p>Carregando...</p></div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>MINHA ASSINATURA</h1>

            {/* Pending payment banner: shown when polling exhausted its attempts
                without a definitive success signal. Honest "still processing"
                state instead of assuming success or silently giving up. */}
            {showPendingBanner && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '12px',
                    padding: '1rem 1.5rem',
                    marginBottom: '1.5rem',
                }}>
                    <Clock size={24} color="#d97706" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>
                            Ainda estamos confirmando seu pagamento
                        </p>
                        <p style={{ margin: '0.25rem 0 0', color: '#92400e', fontSize: '0.85rem' }}>
                            Isso pode levar alguns minutos. Você pode verificar novamente a qualquer momento.
                        </p>
                    </div>
                    <button
                        onClick={handleRecheckPayment}
                        disabled={isRechecking}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            border: '1px solid #d97706',
                            background: 'white',
                            color: '#d97706',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: isRechecking ? 'not-allowed' : 'pointer',
                            opacity: isRechecking ? 0.7 : 1,
                            flexShrink: 0,
                        }}
                    >
                        {isRechecking ? 'Verificando...' : 'Verificar novamente'}
                    </button>
                </div>
            )}

            {/* Top Row */}
            <div className={styles.topRow}>
                {/* Account Status Container */}
                <div className={styles.statusContainer}>
                    <div className={styles.statusHeader}>
                        <span className={styles.statusLabel}>STATUS DA CONTA</span>
                        <div className={styles.statusBadge}>
                            <div className={`${styles.statusDot} ${subscription?.isActive ? styles.active : styles.inactive}`} />
                            <span className={styles.statusText}>{subscription?.isActive ? 'ATIVO' : 'INATIVO'}</span>
                        </div>
                    </div>

                    <h2 className={styles.planName}>
                        {PLAN_DISPLAY_NAMES[subscription?.plan || 'free'] || 'Plano Free'}
                    </h2>

                    {subscription?.endDate && (
                        <p className={styles.renewalDate}>
                            {formatRenewalDate(subscription.endDate)}
                        </p>
                    )}

                    <div className={styles.statusActions}>
                        <button className={styles.upgradeBtn} onClick={() => {
                            const planOrder = ['free', 'basic', 'premium', 'enterprise'];
                            const currentIdx = planOrder.indexOf(subscription?.plan || 'free');
                            const nextPlan = planOrder[Math.min(currentIdx + 1, planOrder.length - 1)];
                            handleSubscribe(nextPlan);
                        }}>
                            FAZER UPGRADE
                        </button>
                        {subscription?.plan && subscription.plan !== 'free' && (
                            <button className={styles.managePaymentBtn} onClick={() => router.push('/partner/subscription/payment?plan=' + subscription.plan)}>
                                GERENCIAR PAGAMENTO
                            </button>
                        )}
                    </div>
                </div>

                {/* Usage Container */}
                <div className={styles.usageContainer}>
                    <span className={styles.usageTitle}>USO DA ASSINATURA</span>

                    <div className={styles.usageItem}>
                        <div className={styles.usageItemHeader}>
                            <span className={styles.usageItemLabel}>PRODUTOS</span>
                            <span className={styles.usageItemCount}>
                                {subscription?.usage.products.limit === -1
                                    ? `${subscription.usage.products.current} cadastrados (ilimitado)`
                                    : `${(subscription?.usage.products.limit ?? 0) - (subscription?.usage.products.current ?? 0)} restantes de ${subscription?.usage.products.limit ?? 0}`
                                }
                            </span>
                        </div>
                        <div className={styles.usageBar}>
                            <div
                                className={styles.usageBarFill}
                                style={{ width: `${Math.min(subscription?.usage.products.percentage || 0, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className={styles.usageItem}>
                        <div className={styles.usageItemHeader}>
                            <span className={styles.usageItemLabel}>SERVIÇOS</span>
                            <span className={styles.usageItemCount}>
                                {subscription?.usage.services.limit === -1
                                    ? `${subscription.usage.services.current} cadastrados (ilimitado)`
                                    : `${(subscription?.usage.services.limit ?? 0) - (subscription?.usage.services.current ?? 0)} restantes de ${subscription?.usage.services.limit ?? 0}`
                                }
                            </span>
                        </div>
                        <div className={styles.usageBar}>
                            <div
                                className={styles.usageBarFill}
                                style={{ width: `${Math.min(subscription?.usage.services.percentage || 0, 100)}%` }}
                            />
                        </div>
                    </div>

                    <p className={styles.usageCapacity}>
                        VOCÊ ESTÁ UTILIZANDO <strong>{overallCapacity}%</strong> DA SUA <strong>CAPACIDADE</strong> ATUAL.
                    </p>
                </div>
            </div>

            {/* Plans Section Title */}
            <p className={styles.plansSectionTitle}>ESCOLHA O PLANO IDEAL PARA O SEU PETSHOP</p>

            {/* Plans Grid */}
            <div className={styles.plansGrid}>
                {plans.map((plan) => {
                    const btnProps = getPlanButtonProps(plan.key);
                    const isActive = subscription?.plan === plan.key;
                    const isPremium = plan.key === 'premium';

                    return (
                        <div
                            key={plan.key}
                            className={`${styles.planCard} ${isActive ? styles.activePlan : ''} ${isPremium ? styles.premiumCard : ''}`}
                        >
                            {isPremium && <div className={styles.recommendedBadge}>RECOMENDADO</div>}

                            <h3 className={styles.planCardName}>{plan.name}</h3>
                            <p className={styles.planCardPrice}>
                                R$ {plan.price.toFixed(2).replace('.', ',')}
                                <span className={styles.perMonth}>/mês</span>
                            </p>

                            <ul className={styles.planFeatures}>
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className={styles.featureItem}>
                                        <span className={styles.featureIcon}>
                                            <Check size={12} color="#3BB77E" strokeWidth={3} />
                                        </span>
                                        <span className={styles.featureText}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`${styles.planCardBtn} ${btnProps.className}`}
                                disabled={btnProps.disabled}
                                onClick={() => !btnProps.disabled && handleSubscribe(plan.key)}
                            >
                                {btnProps.label}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Custom Plan CTA */}
            <div className={styles.customPlanCta}>
                <div className={styles.ctaIcon}>?</div>
                <div className={styles.ctaTextCol}>
                    <span className={styles.ctaTitle}>PRECISA DE UM PLANO CUSTOMIZADO SÓ PARA VOCÊ?</span>
                    <span className={styles.ctaSubtitle}>TEMOS SOLUÇÕES ESPECIAIS PARA GRANDES REDES E FRANQUIAS DE PET SHOPS.</span>
                </div>
                <button className={styles.ctaBtn}>ENTRE EM CONTATO</button>
            </div>

            {/* Downgrade Modal */}
            {downgradeTarget && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '450px',
                        width: '90%',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        textAlign: 'center',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#fffbeb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <AlertTriangle size={32} color="#fbbf24" strokeWidth={2.5} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                            Confirma o Downgrade?
                        </h2>
                        <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                            Ao retroceder para o <strong>{PLAN_DISPLAY_NAMES[downgradeTarget] || downgradeTarget}</strong>, você perderá os benefícios exclusivos da sua assinatura atual imediatamente.
                        </p>
                        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '1rem', marginBottom: '2rem' }}>
                            <p style={{ color: '#b91c1c', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                                {(() => {
                                    const limits = PLAN_LIMITS[downgradeTarget];
                                    const productsLabel = !limits || limits.products === -1 ? 'produtos ilimitados' : `${limits.products} produtos`;
                                    const servicesLabel = !limits || limits.services === -1 ? 'serviços ilimitados' : `${limits.services} serviços`;
                                    return `Produtos e serviços que excederem o limite do novo plano (${productsLabel} e ${servicesLabel}) poderão ficar ocultos no seu catálogo.`;
                                })()}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <button
                                onClick={handleConfirmDowngrade}
                                disabled={isCancelling}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                                    opacity: isCancelling ? 0.7 : 1,
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => { if (!isCancelling) e.currentTarget.style.backgroundColor = '#dc2626' }}
                                onMouseLeave={(e) => { if (!isCancelling) e.currentTarget.style.backgroundColor = '#ef4444' }}
                            >
                                {isCancelling ? 'Processando...' : 'Sim, quero retroceder'}
                            </button>
                            <button
                                onClick={() => setDowngradeTarget(null)}
                                disabled={isCancelling}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#4b5563',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => { if (!isCancelling) e.currentTarget.style.backgroundColor = '#e5e7eb' }}
                                onMouseLeave={(e) => { if (!isCancelling) e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                            >
                                Manter Assinatura
                            </button>
                        </div>
                    </div>
                    <style jsx>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
