"use client";

import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Eye, Edit, Trash2 } from 'lucide-react';
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#333' }}>
                    Gerenciar Assinaturas
                </h1>
            </div>

            {/* Filters */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                            Buscar
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input
                                type="text"
                                placeholder="Nome, email ou CNPJ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1rem'
                            }}
                        >
                            <option value="">Todos</option>
                            <option value="active">Ativa</option>
                            <option value="expired">Expirada</option>
                            <option value="cancelled">Cancelada</option>
                            <option value="pending">Pendente</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                            Plano
                        </label>
                        <select
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1rem'
                            }}
                        >
                            <option value="">Todos</option>
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
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
                {filteredSubscriptions.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                        Nenhuma assinatura encontrada
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Petshop</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Plano</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Valor</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#666' }}>Vencimento</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#666' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscriptions.map((sub) => (
                                <tr key={sub._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div>
                                            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{sub.partnerId?.name}</p>
                                            <p style={{ fontSize: '0.85rem', color: '#666' }}>{sub.partnerId?.email}</p>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{getPlanBadge(sub.plan)}</td>
                                    <td style={{ padding: '1rem' }}>{getStatusBadge(sub.status)}</td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>R$ {sub.amount.toFixed(2)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {new Date(sub.endDate).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <Link
                                                href={`/admin/subscriptions/${sub._id}`}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: '#E3F2FD',
                                                    borderRadius: '6px',
                                                    display: 'inline-flex',
                                                    color: '#2196F3',
                                                    textDecoration: 'none'
                                                }}
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
        </div>
    );
}
