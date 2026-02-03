"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, Users, CreditCard, DollarSign, Store } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface DashboardStats {
    totalPartners: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    monthlyRevenue: number;
}

interface PartnerRevenue {
    _id: string;
    totalRevenue: number;
    orderCount: number;
    partnerName: string;
    email: string;
}

const COLORS = ['#6CC551', '#2196F3', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalPartners: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        monthlyRevenue: 0,
    });
    const [revenueData, setRevenueData] = useState<PartnerRevenue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            await Promise.all([fetchStats(), fetchRevenue()]);
            setLoading(false);
        };
        loadAllData();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchRevenue = async () => {
        try {
            const response = await fetch('/api/admin/revenue');
            if (response.ok) {
                const data = await response.json();
                setRevenueData(data);
            }
        } catch (error) {
            console.error('Error fetching revenue:', error);
        }
    };

    const statCards = [
        {
            title: 'Total de Petshops',
            value: stats.totalPartners,
            icon: Users,
            color: '#6CC551',
            bgColor: '#E8F5E3',
        },
        {
            title: 'Assinaturas Ativas',
            value: stats.activeSubscriptions,
            icon: CreditCard,
            color: '#4CAF50',
            bgColor: '#E8F5E9',
        },
        {
            title: 'Assinaturas Expiradas',
            value: stats.expiredSubscriptions,
            icon: TrendingUp,
            color: '#FF9800',
            bgColor: '#FFF3E0',
        },
        {
            title: 'Receita Mensal (MRR)',
            value: `R$ ${stats.monthlyRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: '#2196F3',
            bgColor: '#E3F2FD',
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <p>Carregando estatísticas...</p>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#333' }}>
                Dashboard Administrativo
            </h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                        {card.title}
                                    </p>
                                    <p style={{ fontSize: '2rem', fontWeight: 700, color: card.color }}>
                                        {card.value}
                                    </p>
                                </div>
                                <div style={{
                                    background: card.bgColor,
                                    borderRadius: '12px',
                                    padding: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Icon size={24} color={card.color} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3rem' }}>
                {/* Revenue Chart */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <DollarSign size={20} color="#6CC551" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#333', margin: 0 }}>
                            Faturamento por Petshop (Top 5)
                        </h2>
                    </div>

                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={revenueData.slice(0, 5)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis dataKey="partnerName" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                                <Tooltip
                                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="totalRevenue" radius={[4, 4, 0, 0]}>
                                    {revenueData.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Table */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Store size={20} color="#6CC551" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#333', margin: 0 }}>
                            Detalhamento de Lucros
                        </h2>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f4f4f4' }}>
                                    <th style={{ padding: '1rem 0.5rem', color: '#666', fontWeight: 600 }}>Petshop</th>
                                    <th style={{ padding: '1rem 0.5rem', color: '#666', fontWeight: 600 }}>Pedidos Entregues</th>
                                    <th style={{ padding: '1rem 0.5rem', color: '#666', fontWeight: 600 }}>Total Faturado</th>
                                    <th style={{ padding: '1rem 0.5rem', color: '#666', fontWeight: 600 }}>Ticket Médio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenueData.length > 0 ? (
                                    revenueData.map((partner) => (
                                        <tr key={partner._id} style={{ borderBottom: '1px solid #f4f4f4', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#fcfcfc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <div style={{ fontWeight: 600, color: '#333' }}>{partner.partnerName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#999' }}>{partner.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', color: '#333' }}>{partner.orderCount}</td>
                                            <td style={{ padding: '1rem 0.5rem', fontWeight: 700, color: '#6CC551' }}>
                                                R$ {partner.totalRevenue.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', color: '#666' }}>
                                                R$ {(partner.totalRevenue / partner.orderCount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                                            Nenhum dado de faturamento encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#333' }}>
                    Bem-vindo ao Painel Administrativo
                </h2>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                    Aqui você pode gerenciar todas as assinaturas das petshops cadastradas no ClickPet.
                    Use o menu lateral para navegar entre as diferentes seções.
                </p>
            </div>
        </div>
    );
}

