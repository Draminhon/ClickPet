"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, Users, CreditCard, DollarSign, PieChart as PieIcon, BarChart2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
} from 'recharts';

interface PartnerRevenue {
    _id: string;
    totalRevenue: number;
    orderCount: number;
    partnerName: string;
    email: string;
}

const COLORS = ['#3BB77E', '#2196F3', '#FFA000', '#FF6B6B', '#9C27B0', '#00BCD4', '#795548'];

export default function ReportsPage() {
    const [revenueData, setRevenueData] = useState<PartnerRevenue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const response = await fetch('/api/admin/revenue');
                if (response.ok) {
                    const data = await response.json();
                    setRevenueData(data);
                }
            } catch (error) {
                console.error('Error fetching revenue:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRevenue();
    }, []);

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalOrders = revenueData.reduce((sum, item) => sum + item.orderCount, 0);
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const pieData = revenueData.slice(0, 5).map(item => ({
        name: item.partnerName,
        value: item.totalRevenue
    }));

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTopColor: '#3BB77E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#666', fontWeight: 500 }}>Gerando relatórios detalhados...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#253D4E', margin: 0, letterSpacing: '-0.5px' }}>
                        Relatórios e Análises
                    </h1>
                    <p style={{ color: '#7E7E7E', marginTop: '0.5rem', fontSize: '1rem' }}>
                        Visão profunda sobre o desempenho financeiro e comercial da plataforma
                    </p>
                </div>
                <div style={{ 
                    background: 'white', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#3BB77E',
                    fontWeight: 700
                }}>
                    <TrendingUp size={18} />
                    <span>Dados em Tempo Real</span>
                </div>
            </div>

            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #F1F1F1' }}>
                    <div style={{ color: '#7E7E7E', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Faturamento Bruto</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#253D4E' }}>R$ {totalRevenue.toLocaleString('pt-BR')}</div>
                    <div style={{ color: '#3BB77E', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                        <ArrowUpRight size={16} />
                        <span>Calculado de todos os pedidos entregues</span>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #F1F1F1' }}>
                    <div style={{ color: '#7E7E7E', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ticket Médio Geral</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#253D4E' }}>R$ {averageTicket.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</div>
                    <div style={{ color: '#2196F3', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                        <BarChart2 size={16} />
                        <span>Eficiência comercial por pedido</span>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #F1F1F1' }}>
                    <div style={{ color: '#7E7E7E', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Líder de Mercado</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#253D4E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {revenueData[0]?.partnerName || 'N/A'}
                    </div>
                    <div style={{ color: '#FFA000', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.75rem' }}>
                        <PieIcon size={16} />
                        <span>Maior volume de receita transacionada</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* Distribution Pie Chart */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#253D4E', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PieIcon color="#3BB77E" />
                        Distribuição de Receita (Top 5)
                    </h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
                                    contentStyle={{ background: '#253D4E', borderRadius: '12px', color: 'white', border: 'none' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Growth Mock Chart (Historical context) */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#253D4E', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart2 color="#2196F3" />
                        Desempenho por Volume de Pedidos
                    </h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <BarChart data={revenueData.slice(0, 10)} layout="vertical" margin={{ left: 40 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="partnerName" type="category" axisLine={false} tickLine={false} tick={{ fill: '#7E7E7E', fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(33, 150, 243, 0.05)' }}
                                    contentStyle={{ background: '#253D4E', borderRadius: '12px', color: 'white', border: 'none' }}
                                />
                                <Bar dataKey="orderCount" fill="#2196F3" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Performance Ranking Table */}
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#253D4E', marginBottom: '2rem' }}>Ranking de Performance Financeira</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', color: '#7E7E7E', padding: '0 1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Posição</th>
                                <th style={{ textAlign: 'left', color: '#7E7E7E', padding: '0 1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Parceiro</th>
                                <th style={{ textAlign: 'center', color: '#7E7E7E', padding: '0 1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Pedidos</th>
                                <th style={{ textAlign: 'right', color: '#7E7E7E', padding: '0 1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Faturamento</th>
                                <th style={{ textAlign: 'right', color: '#7E7E7E', padding: '0 1rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Share (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenueData.map((item, index) => (
                                <tr key={item._id} style={{ transform: 'scale(1)', transition: 'all 0.2s' }}>
                                    <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9', borderRadius: '16px 0 0 16px', fontWeight: 800, color: index < 3 ? '#3BB77E' : '#7E7E7E' }}>
                                        #{index + 1}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9' }}>
                                        <div style={{ fontWeight: 700, color: '#253D4E' }}>{item.partnerName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#7E7E7E' }}>{item.email}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9', textAlign: 'center', fontWeight: 600 }}>
                                        {item.orderCount}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9', textAlign: 'right', fontWeight: 800, color: '#253D4E' }}>
                                        R$ {item.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '1.25rem 1rem', background: '#F9F9F9', borderRadius: '0 16px 16px 0', textAlign: 'right', fontWeight: 700, color: '#3BB77E' }}>
                                        {((item.totalRevenue / (totalRevenue || 1)) * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
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
