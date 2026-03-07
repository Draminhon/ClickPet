"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, MoreHorizontal } from 'lucide-react';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';

export default function PartnerOrders() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Novas states para a tabela
    const [activeTab, setActiveTab] = useState('TODOS');
    const [searchId, setSearchId] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = () => {
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                showToast('Status atualizado!');
                fetchOrders();
            } else {
                showToast('Erro ao atualizar status', 'error');
            }
        } catch (error) {
            showToast('Erro ao atualizar status', 'error');
        }
    };

    const getMonthlyData = () => {
        const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const data = months.map(m => ({ name: m, PedidosReal: 0, Pedidos: 0 }));

        orders.forEach(order => {
            const date = new Date(order.createdAt);
            const monthIndex = date.getMonth();
            data[monthIndex].PedidosReal += 1;
        });

        // Transform data into a segmented scale so 0, 10, 50, 100, 1000 are equally spaced.
        data.forEach(d => {
            const val = d.PedidosReal;
            if (val === 0) {
                d.Pedidos = 0;
            } else if (val <= 10) {
                d.Pedidos = val / 10;                     // 0 -> 1
            } else if (val <= 50) {
                d.Pedidos = 1 + ((val - 10) / 40);        // 1 -> 2
            } else if (val <= 100) {
                d.Pedidos = 2 + ((val - 50) / 50);        // 2 -> 3
            } else if (val <= 1000) {
                d.Pedidos = 3 + ((val - 100) / 900);      // 3 -> 4
            } else {
                d.Pedidos = 4;                            // Cap at max label
            }
        });

        return data;
    };

    const filterOrders = () => {
        let filtered = orders;

        if (activeTab === 'PENDENTES') {
            filtered = filtered.filter(o => o.status === 'pending');
        } else if (activeTab === 'CANCELADOS') {
            filtered = filtered.filter(o => o.status === 'cancelled');
        } else if (activeTab === 'ENVIADO') {
            filtered = filtered.filter(o => o.status === 'out_for_delivery' || o.status === 'delivered');
        }

        if (searchId) {
            filtered = filtered.filter(o => o._id.toLowerCase().includes(searchId.toLowerCase()));
        }

        return filtered;
    };

    const chartData = getMonthlyData();
    const filteredOrders = filterOrders();

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div>
            {/* Top Header */}
            <h1
                style={{
                    fontSize: '14px',
                    color: '#253D4E',
                    fontWeight: 700,
                    marginBottom: '2rem',
                    textAlign: 'left',
                    textTransform: 'uppercase'
                }}
            >
                VISUALIZAÇÃO DE PEDIDOS
            </h1>

            {/* Chart Container - styled like main dashboard */}
            <div
                style={{
                    background: '#F9FBFD',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(209, 217, 226, 1)'
                }}
            >
                <h2
                    style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#757575',
                        marginBottom: '1.5rem',
                        textTransform: 'uppercase'
                    }}
                >
                    GRAFICO DE PEDIDOS
                </h2>

                <div style={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 14, fill: '#757575' }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, 4]}
                                ticks={[0, 1, 2, 3, 4]}
                                tickFormatter={(val) => {
                                    if (val === 0) return '0';
                                    if (val === 1) return '10';
                                    if (val === 2) return '50';
                                    if (val === 3) return '100';
                                    if (val === 4) return '1000';
                                    return '';
                                }}
                                tick={{ fontSize: 14, fill: '#757575', fontWeight: 400 }}
                                axisLine={false}
                                tickLine={false}
                                dx={-10}
                            />
                            <Tooltip
                                cursor={{ fill: '#f5f5f5' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: any, name: any, props: any) => {
                                    return [props.payload.PedidosReal, "Pedidos"];
                                }}
                            />
                            <Bar
                                dataKey="Pedidos"
                                fill="#6CC551"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div style={{
                    borderTop: '1px solid rgba(209, 217, 226, 1)',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    marginLeft: '-1.5rem',
                    marginRight: '-1.5rem',
                    paddingLeft: '1.5rem',
                    paddingRight: '1.5rem'
                }}>
                    <p
                        style={{
                            fontSize: '14px',
                            color: '#757575',
                            textAlign: 'left',
                            fontWeight: 400, // regular
                            textTransform: 'uppercase',
                            margin: 0
                        }}
                    >
                        ANALISE DE PEDIDOS MENSAIS DO SEU PETSHOP
                    </p>
                </div>
            </div>

            {/* Tabela de Pedidos Section */}
            <div style={{ marginTop: '2rem' }}>
                <h3 style={{
                    fontSize: '14px',
                    fontWeight: 400, // regular
                    color: '#253D4E',
                    marginBottom: '1.5rem',
                    textTransform: 'uppercase'
                }}>
                    TABELA DE PEDIDOS
                </h3>

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    {/* Tabs Container */}
                    <div style={{
                        display: 'flex',
                        width: '452px',
                        height: '40px',
                        borderRadius: '5px',
                        border: '1px solid #D1D9E2',
                        overflow: 'hidden'
                    }}>
                        {['TODOS', 'PENDENTES', 'CANCELADOS', 'ENVIADO'].map((tab, idx) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    borderRight: idx < 3 ? '1px solid #D1D9E2' : 'none',
                                    background: activeTab === tab ? '#3BB77E' : 'transparent',
                                    color: activeTab === tab ? '#FEFEFE' : '#757575',
                                    fontWeight: activeTab === tab ? 'bold' : 600, // selected: bold, unselected: semibold (600)
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search and Action Container */}
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        {/* Search Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '288.5px',
                            height: '46px',
                            borderRadius: '8px',
                            border: '1px solid #D1D9E2',
                            padding: '0 1rem',
                            background: 'white'
                        }}>
                            <Search size={18} color="#757575" />
                            <input
                                type="text"
                                placeholder="PESQUISAR ID"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    width: '100%',
                                    marginLeft: '0.5rem',
                                    fontSize: '14px',
                                    color: '#757575',
                                    fontWeight: 400, // regular
                                    background: 'transparent'
                                }}
                            />
                        </div>

                        {/* More Button */}
                        <button style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: 'rgba(230,233,236,1)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}>
                            <MoreHorizontal size={15} color="rgba(124,139,157,1)" />
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div style={{
                    background: '#F9FBFD',
                    borderRadius: '12px',
                    padding: '1.5rem 0', // Vertical padding only
                    border: '1px solid rgba(209, 217, 226, 1)',
                    overflowX: 'auto'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(209, 217, 226, 1)', color: '#757575', fontSize: '13px' }}>
                                <th style={{ padding: '1rem 0', paddingLeft: '1.5rem', fontWeight: 600 }}>ID</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>DATA</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>ITENS</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>TOTAL</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>STATUS</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>ID_CLIENTE</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600 }}>PAGAMENTO</th>
                                <th style={{ padding: '1rem 0', paddingRight: '1.5rem', fontWeight: 600 }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                        Nenhum pedido encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const getRowBackground = () => {
                                        if (order.status === 'delivered') return 'rgba(59, 183, 126, 0.2)';
                                        if (order.status === 'cancelled') return 'rgba(255, 0, 4, 0.2)';
                                        return 'transparent';
                                    };

                                    const getStatusLabel = (status: string) => {
                                        const labels: any = {
                                            'pending': 'PENDENTE',
                                            'accepted': 'ACEITO',
                                            'preparing': 'PREPARANDO',
                                            'out_for_delivery': 'EM ENTREGA',
                                            'delivered': 'ENTREGUE',
                                            'cancelled': 'CANCELADO'
                                        };
                                        return labels[status] || status.toUpperCase();
                                    };

                                    return (
                                        <tr key={order._id} style={{
                                            fontSize: '14px',
                                            color: '#757575',
                                            fontWeight: 400,
                                            background: getRowBackground()
                                        }}>
                                            <td style={{ padding: '1rem 0', paddingLeft: '1.5rem' }}>#{order._id.slice(-6).toUpperCase()}</td>
                                            <td style={{ padding: '1rem 0' }}>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                                            <td style={{ padding: '1rem 0' }}>{order.items?.length || 0}</td>
                                            <td style={{ padding: '1rem 0' }}>R$ {order.total?.toFixed(2).replace('.', ',')}</td>
                                            <td style={{ padding: '1rem 0' }}>
                                                {getStatusLabel(order.status)}
                                            </td>
                                            <td style={{ padding: '1rem 0' }}>{order.user?.name || order.userId?.slice(-6).toUpperCase() || '-'}</td>
                                            <td style={{ padding: '1rem 0', textTransform: 'uppercase' }}>
                                                {order.paymentStatus === 'cancelled' ? 'CANCELADO' :
                                                    order.paymentStatus === 'rejected' ? 'RECUSADO' : 'APROVADO'}
                                            </td>
                                            <td style={{ padding: '1rem 0', paddingRight: '1.5rem' }}>
                                                {order.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => handleStatusUpdate(order._id, 'accepted')} style={{ padding: '4px 8px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Aceitar</button>
                                                        <button onClick={() => handleStatusUpdate(order._id, 'cancelled')} style={{ padding: '4px 8px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Recusar</button>
                                                    </div>
                                                )}
                                                {order.status === 'accepted' && (
                                                    <button onClick={() => handleStatusUpdate(order._id, 'preparing')} style={{ padding: '4px 8px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Preparo</button>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <button onClick={() => handleStatusUpdate(order._id, 'out_for_delivery')} style={{ padding: '4px 8px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Enviar</button>
                                                )}
                                                {order.status === 'out_for_delivery' && (
                                                    <button onClick={() => handleStatusUpdate(order._id, 'delivered')} style={{ padding: '4px 8px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Entregue</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
