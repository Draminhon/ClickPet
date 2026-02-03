"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import { Package, User, MapPin, Calendar, Truck } from 'lucide-react';

export default function PartnerOrders() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'active' | 'history'>('active');
    const [filter, setFilter] = useState('all');
    const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);

    const activeStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery'];
    const historyStatuses = ['delivered', 'cancelled'];

    useEffect(() => {
        fetchOrders();
        fetchDeliveryPersons();
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

    const fetchDeliveryPersons = () => {
        fetch('/api/delivery-persons')
            .then(res => res.json())
            .then(data => setDeliveryPersons(data));
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

    const handleAssignDelivery = async (orderId: string, deliveryPersonId: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryPersonId }),
            });

            if (res.ok) {
                showToast('Entregador atribuído!');
                fetchOrders();
            } else {
                showToast('Erro ao atribuir entregador', 'error');
            }
        } catch (error) {
            showToast('Erro ao atribuir entregador', 'error');
        }
    };

    const filteredOrders = orders.filter(o => {
        const isHistory = historyStatuses.includes(o.status);
        if (view === 'active' && isHistory) return false;
        if (view === 'history' && !isHistory) return false;

        if (filter !== 'all' && o.status !== filter) return false;
        return true;
    });

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div>
            <h1 className="section-title">Pedidos</h1>

            {/* View Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: '1.5rem', gap: '2rem' }}>
                <button
                    onClick={() => { setView('active'); setFilter('all'); }}
                    style={{
                        padding: '1rem 0.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: view === 'active' ? '3px solid #6CC551' : '3px solid transparent',
                        color: view === 'active' ? '#6CC551' : '#666',
                        fontWeight: view === 'active' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '1.1rem'
                    }}
                >
                    Pedidos Ativos ({orders.filter(o => activeStatuses.includes(o.status)).length})
                </button>
                <button
                    onClick={() => { setView('history'); setFilter('all'); }}
                    style={{
                        padding: '1rem 0.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: view === 'history' ? '3px solid #6CC551' : '3px solid transparent',
                        color: view === 'history' ? '#6CC551' : '#666',
                        fontWeight: view === 'history' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '1.1rem'
                    }}
                >
                    Histórico ({orders.filter(o => historyStatuses.includes(o.status)).length})
                </button>
            </div>

            {/* Sub-Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setFilter('all')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: filter === 'all' ? 'none' : '1px solid #ddd',
                        background: filter === 'all' ? '#6CC551' : 'white',
                        color: filter === 'all' ? 'white' : '#666',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600
                    }}
                >
                    Todos
                </button>
                {(view === 'active' ? activeStatuses : historyStatuses).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: filter === status ? 'none' : '1px solid #ddd',
                            background: filter === status ? '#6CC551' : 'white',
                            color: filter === status ? 'white' : '#666',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}
                    >
                        {status === 'pending' ? 'Pendentes' :
                            status === 'accepted' ? 'Aceitos' :
                                status === 'preparing' ? 'Em Preparo' :
                                    status === 'out_for_delivery' ? 'Em Entrega' :
                                        status === 'delivered' ? 'Entregues' : 'Cancelados'}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center' }}>
                    <Package size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666' }}>Nenhum pedido encontrado</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {filteredOrders.map(order => (
                        <div key={order._id} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                        Pedido #{order._id.slice(-6).toUpperCase()}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                                        <Calendar size={16} />
                                        <span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>
                                <OrderStatusBadge status={order.status} />
                            </div>

                            {/* Items */}
                            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Itens:</h4>
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} style={{ fontSize: '0.9rem', color: '#666' }}>
                                        • {item.quantity}x {item.title} - R$ {item.price.toFixed(2)}
                                    </div>
                                ))}
                                {order.discount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6CC551', marginBottom: '0.2rem' }}>
                                        <span>Desconto {order.coupon && `(Cupom: ${order.coupon})`}:</span>
                                        <span>- R$ {order.discount.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                )}
                                <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Total:</span>
                                    <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>

                            {/* Address */}
                            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'start', gap: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                                <MapPin size={16} style={{ marginTop: '0.2rem' }} />
                                <span>{order.address.street}, {order.address.number}{order.address.complement ? ` - ${order.address.complement}` : ''} - {order.address.city}, {order.address.zip}</span>
                            </div>

                            {/* Delivery Person */}
                            {order.deliveryPersonId && (
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', background: '#e8f5e9', borderRadius: '8px' }}>
                                    <Truck size={18} color="#6CC551" />
                                    <span style={{ fontWeight: 600 }}>Entregador: {order.deliveryPersonId.name}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {order.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(order._id, 'accepted')}
                                            style={{ padding: '0.6rem 1rem', background: '#6CC551', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Aceitar Pedido
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                            style={{ padding: '0.6rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Recusar
                                        </button>
                                    </>
                                )}

                                {order.status === 'accepted' && (
                                    <button
                                        onClick={() => handleStatusUpdate(order._id, 'preparing')}
                                        style={{ padding: '0.6rem 1rem', background: '#6CC551', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Iniciar Preparo
                                    </button>
                                )}

                                {order.status === 'preparing' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(order._id, 'out_for_delivery')}
                                            style={{ padding: '0.6rem 1rem', background: '#6CC551', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Saiu para Entrega
                                        </button>
                                        {!order.deliveryPersonId && deliveryPersons.length > 0 && (
                                            <select
                                                onChange={(e) => e.target.value && handleAssignDelivery(order._id, e.target.value)}
                                                style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                            >
                                                <option value="">Atribuir Entregador</option>
                                                {deliveryPersons.map(dp => (
                                                    <option key={dp._id} value={dp._id}>{dp.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </>
                                )}

                                {order.status === 'out_for_delivery' && (
                                    <button
                                        onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                        style={{ padding: '0.6rem 1rem', background: '#6CC551', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Marcar como Entregue
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
