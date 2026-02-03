"use client";

import { useEffect, useState } from 'react';
import { Package, ShoppingBag, DollarSign, Clock, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FFC107';
            case 'accepted': return '#2196F3';
            case 'preparing': return '#9C27B0';
            case 'out_for_delivery': return '#FF9800';
            case 'delivered': return '#28a745';
            case 'cancelled': return '#dc3545';
            default: return '#999';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'accepted': return 'Aceito';
            case 'preparing': return 'Em Preparo';
            case 'out_for_delivery': return 'Em Entrega';
            case 'delivered': return 'Entregue';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando...</div>;
    }

    return (

        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Dashboard</h1>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#ffebee',
                        color: '#d32f2f',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        marginLeft: '1rem'
                    }}
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </div>

            {/* Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total de Vendas</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#6CC551' }}>{formatCurrency(stats.totalRevenue)}</h2>
                        </div>
                        <DollarSign size={40} color="#6CC551" style={{ opacity: 0.2 }} />
                    </div>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Pedidos Ativos</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#FFC107' }}>{(stats as any).activeOrders || 0}</h2>
                        </div>
                        <Clock size={40} color="#FFC107" style={{ opacity: 0.2 }} />
                    </div>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Produtos Ativos</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalProducts}</h2>
                        </div>
                        <Package size={40} color="#6CC551" style={{ opacity: 0.2 }} />
                    </div>
                </div>

                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Histórico Total</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalOrders}</h2>
                        </div>
                        <ShoppingBag size={40} color="#6CC551" style={{ opacity: 0.2 }} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <Link href="/partner/catalog/new" className="btn btn-primary" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1.1rem' }}>
                    + Adicionar Novo Produto
                </Link>
                <Link href="/partner/orders" className="btn" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1.1rem', background: 'white', border: '2px solid #6CC551', color: '#6CC551' }}>
                    Gerenciar Pedidos
                </Link>
            </div>

            {/* Recent Orders */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Últimos Pedidos</h3>

                {stats.recentOrders.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Nenhum pedido ainda.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                <th style={{ textAlign: 'left', padding: '1rem', color: '#666', fontWeight: 600 }}>ID</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: '#666', fontWeight: 600 }}>Data</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: '#666', fontWeight: 600 }}>Itens</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: '#666', fontWeight: 600 }}>Total</th>
                                <th style={{ textAlign: 'left', padding: '1rem', color: '#666', fontWeight: 600 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentOrders.map((order: any) => (
                                <tr key={order._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>#{order._id.slice(-6)}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{formatDate(order.createdAt)}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{order.itemCount} itens</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>{formatCurrency(order.total)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: getStatusColor(order.status) + '20',
                                            color: getStatusColor(order.status),
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600
                                        }}>
                                            {getStatusLabel(order.status)}
                                        </span>
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
