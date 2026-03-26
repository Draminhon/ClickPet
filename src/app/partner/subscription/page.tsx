"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
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

export default function PartnerSubscriptionPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);

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
                        <button className={styles.managePaymentBtn} onClick={() => router.push('/partner/subscription/payment?plan=' + (subscription?.plan || 'free'))}>
                            GERENCIAR PAGAMENTO
                        </button>
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
        </div>
    );
}
