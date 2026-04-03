"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, CreditCard, DollarSign, Store, Check } from 'lucide-react';
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
            color: '#3BB77E',
            bgColor: 'rgba(59, 183, 126, 0.1)',
        },
        {
            title: 'Assinaturas Ativas',
            value: stats.activeSubscriptions,
            icon: Check,
            color: '#2196F3',
            bgColor: 'rgba(33, 150, 243, 0.1)',
        },
        {
            title: 'Assinaturas Expiradas',
            value: stats.expiredSubscriptions,
            icon: TrendingUp,
            color: '#FF6B6B',
            bgColor: 'rgba(255, 107, 107, 0.1)',
        },
        {
            title: 'Receita Mensal (MRR)',
            value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: '#FFA000',
            bgColor: 'rgba(255, 160, 0, 0.1)',
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTopColor: '#3BB77E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#666', fontWeight: 500 }}>Carregando estatísticas...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#253D4E', margin: 0, letterSpacing: '-0.5px' }}>
                    Dashboard
                </h1>
                <p style={{ color: '#7E7E7E', marginTop: '0.5rem', fontSize: '1rem' }}>
                    Visão geral do desempenho da plataforma ClickPet
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '1.75rem',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.03)';
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ color: '#7E7E7E', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {card.title}
                                    </p>
                                    <p style={{ fontSize: '1.85rem', fontWeight: 800, color: '#253D4E', margin: 0 }}>
                                        {card.value}
                                    </p>
                                </div>
                                <div style={{
                                    background: card.bgColor,
                                    borderRadius: '16px',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Icon size={28} color={card.color} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div style={{ 
                                position: 'absolute', 
                                bottom: 0, 
                                left: 0, 
                                width: '100%', 
                                height: '4px', 
                                background: card.color,
                                opacity: 0.6
                            }} />
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* Revenue Chart */}
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '2rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(59, 183, 126, 0.1)', padding: '0.5rem', borderRadius: '10px' }}>
                                <DollarSign size={22} color="#3BB77E" />
                            </div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#253D4E', margin: 0 }}>
                                Receita por Petshop
                            </h2>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <BarChart data={revenueData.slice(0, 5)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                                <XAxis 
                                    dataKey="partnerName" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#7E7E7E', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tickFormatter={(val) => `R$${val}`}
                                    tick={{ fill: '#7E7E7E', fontSize: 12, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(59, 183, 126, 0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div style={{
                                                    background: '#253D4E',
                                                    color: 'white',
                                                    padding: '1rem',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                                                    border: 'none'
                                                }}>
                                                    <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>{payload[0].payload.partnerName}</p>
                                                    <p style={{ margin: 0, color: '#3BB77E', fontWeight: 800, fontSize: '1.1rem' }}>
                                                        R$ {payload[0].value?.toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="totalRevenue" radius={[8, 8, 0, 0]} barSize={40}>
                                    {revenueData.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3BB77E' : '#BCE3C9'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Info Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #3BB77E 0%, #29A56C 100%)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 20px 40px rgba(59, 183, 126, 0.25)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <Store size={48} style={{ marginBottom: '1.5rem', opacity: 0.9 }} />
                        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
                            Gestão Simplificada para o seu Ecossistema
                        </h2>
                        <p style={{ fontSize: '1.05rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '2rem' }}>
                            Monitore o crescimento de cada parceiro em tempo real e gerencie assinaturas com apenas alguns cliques. 
                            O futuro do delivery pet está aqui.
                        </p>
                        <Link href="/admin/reports" style={{ textDecoration: 'none' }}>
                            <button style={{
                                width: '100%',
                                background: 'white',
                                color: '#3BB77E',
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '14px',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                Ver Relatórios Completos
                            </button>
                        </Link>
                    </div>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', zIndex: 1 }} />
                    <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 1 }} />
                </div>
            </div>

            {/* Detailed Table */}
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(33, 150, 243, 0.1)', padding: '0.5rem', borderRadius: '10px' }}>
                        <TrendingUp size={22} color="#2196F3" />
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#253D4E', margin: 0 }}>
                        Detalhamento de Lucros por Parceiro
                    </h2>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#7E7E7E', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Petshop</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: '#7E7E7E', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Volume de Pedidos</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#7E7E7E', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Faturamento Total</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: '#7E7E7E', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Ticket Médio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenueData.length > 0 ? (
                                revenueData.map((partner) => (
                                    <tr key={partner._id} style={{ transition: 'all 0.2s' }}>
                                        <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9', borderRadius: '16px 0 0 16px' }}>
                                            <div style={{ fontWeight: 700, color: '#253D4E', fontSize: '1rem' }}>{partner.partnerName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#7E7E7E', marginTop: '0.25rem' }}>{partner.email}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9', textAlign: 'center' }}>
                                            <span style={{ 
                                                background: 'rgba(59, 183, 126, 0.1)', 
                                                color: '#3BB77E', 
                                                padding: '0.4rem 1rem', 
                                                borderRadius: '20px',
                                                fontWeight: 700,
                                                fontSize: '0.9rem'
                                            }}>
                                                {partner.orderCount}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9', fontWeight: 800, color: '#253D4E' }}>
                                            R$ {partner.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9', borderRadius: '0 16px 16px 0', color: '#3BB77E', fontWeight: 700 }}>
                                            R$ {(partner.totalRevenue / (partner.orderCount || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: '#7E7E7E', background: '#F9F9F9', borderRadius: '16px' }}>
                                        Nenhum dado de faturamento disponível no momento.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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

