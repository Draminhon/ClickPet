"use client";

import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Eye, Edit, Trash2, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface Subscription {
    _id: string;
    partnerId: {
        _id: string;
        name: string;
        email: string;
        cnpj: string;
    };
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
    amount: number;
}

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');

    useEffect(() => {
        fetchSubscriptions();
    }, [statusFilter, planFilter]);

    const fetchSubscriptions = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (planFilter) params.append('plan', planFilter);

            const response = await fetch(`/api/admin/subscriptions?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setSubscriptions(data.subscriptions || []);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, any> = {
            active: { bg: '#E8F5E9', color: '#4CAF50', label: 'Ativa' },
            expired: { bg: '#FFEBEE', color: '#F44336', label: 'Expirada' },
            cancelled: { bg: '#FFF3E0', color: '#FF9800', label: 'Cancelada' },
            pending: { bg: '#E3F2FD', color: '#2196F3', label: 'Pendente' },
        };
        const style = styles[status] || styles.pending;
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600
            }}>
                {style.label}
            </span>
        );
    };

    const getPlanBadge = (plan: string) => {
        const styles: Record<string, any> = {
            free: { bg: '#F5F5F5', color: '#666', label: 'Free' },
            basic: { bg: '#E3F2FD', color: '#2196F3', label: 'Basic' },
            premium: { bg: '#F3E5F5', color: '#9C27B0', label: 'Premium' },
            enterprise: { bg: '#FFF3E0', color: '#FF9800', label: 'Enterprise' },
        };
        const style = styles[plan] || styles.free;
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600
            }}>
                {style.label}
            </span>
        );
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            sub.partnerId?.name?.toLowerCase().includes(searchLower) ||
            sub.partnerId?.email?.toLowerCase().includes(searchLower) ||
            sub.partnerId?.cnpj?.includes(search)
        );
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <p>Carregando assinaturas...</p>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#253D4E', margin: 0, letterSpacing: '-0.5px' }}>
                    Assinaturas
                </h1>
                <p style={{ color: '#7E7E7E', marginTop: '0.5rem', fontSize: '1rem' }}>
                    Acompanhe o faturamento e o status de todos os planos ativos
                </p>
            </div>

            {/* Filters */}
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                marginBottom: '2.5rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ flex: 2 }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', color: '#253D4E', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Pesquisa Rápida
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#BDBDBD' }} />
                            <input
                                type="text"
                                placeholder="Nome da loja, e-mail ou CNPJ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem 1rem 0.85rem 3rem',
                                    border: '1px solid #F1F1F1',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    background: '#F9F9F9',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', color: '#253D4E', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                border: '1px solid #F1F1F1',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                background: '#F9F9F9',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Todos os Status</option>
                            <option value="active">Ativa</option>
                            <option value="suspended">Pausada</option>
                            <option value="expired">Expirada</option>
                            <option value="cancelled">Cancelada</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', color: '#253D4E', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Plano
                        </label>
                        <select
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                border: '1px solid #F1F1F1',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                background: '#F9F9F9',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Todos os Planos</option>
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div style={{
                background: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                {filteredSubscriptions.length === 0 ? (
                    <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#7E7E7E' }}>
                        <CreditCard size={48} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Nenhuma assinatura encontrada para esta busca.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F9F9F9', borderBottom: '1px solid #F1F1F1' }}>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontWeight: 700, color: '#253D4E', fontSize: '0.8rem', textTransform: 'uppercase' }}>Parceiro</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 700, color: '#253D4E', fontSize: '0.8rem', textTransform: 'uppercase' }}>Plano</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 700, color: '#253D4E', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 700, color: '#253D4E', fontSize: '0.8rem', textTransform: 'uppercase' }}>Valor Mensal</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', fontWeight: 700, color: '#253D4E', fontSize: '0.8rem', textTransform: 'uppercase' }}>Vencimento</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'center', fontWeight: 700, color: '#253D4E', fontSize: '0.8rem', textTransform: 'uppercase' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscriptions.map((sub) => (
                                <tr key={sub._id} style={{ borderBottom: '1px solid #F1F1F1', transition: 'all 0.2s' }}>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        <div>
                                            <p style={{ fontWeight: 700, color: '#253D4E', marginBottom: '0.25rem', fontSize: '1rem' }}>{sub.partnerId?.name}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#7E7E7E' }}>{sub.partnerId?.email}</p>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 1rem' }}>{getPlanBadge(sub.plan)}</td>
                                    <td style={{ padding: '1.5rem 1rem' }}>{getStatusBadge(sub.status)}</td>
                                    <td style={{ padding: '1.5rem 1rem' }}>
                                        <span style={{ fontWeight: 800, color: '#253D4E', fontSize: '1rem' }}>R$ {sub.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </td>
                                    <td style={{ padding: '1.5rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7E7E7E', fontSize: '0.9rem' }}>
                                            <Filter size={14} />
                                            <span>{new Date(sub.endDate).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 2rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                            <Link
                                                href={`/admin/partners`}
                                                style={{
                                                    padding: '0.65rem',
                                                    background: 'rgba(59, 183, 126, 0.1)',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#3BB77E',
                                                    textDecoration: 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 183, 126, 0.2)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 183, 126, 0.1)'}
                                                title="Gerenciar Parceiro"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
