"use client";

import { useEffect, useState } from 'react';
import { Package, MapPin, Calendar, Truck, AlertCircle } from 'lucide-react';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import { useToast } from '@/context/ToastContext';

export default function CustomerOrders() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;

        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled', cancelReason: 'Cancelado pelo cliente' }),
            });

            if (res.ok) {
                showToast('Pedido cancelado');
                fetchOrders();
            } else {
                showToast('Erro ao cancelar pedido', 'error');
            }
        } catch (error) {
            showToast('Erro ao cancelar pedido', 'error');
        }
    };

    const getStatusTimeline = (order: any) => {
        const steps = [
            { status: 'pending', label: 'Pedido Realizado', date: order.createdAt },
            { status: 'accepted', label: 'Pedido Aceito', date: order.acceptedAt },
            { status: 'preparing', label: 'Em Preparo', date: null },
            { status: 'out_for_delivery', label: 'Saiu para Entrega', date: null },
            { status: 'delivered', label: 'Entregue', date: order.deliveredAt },
        ];

        const currentIndex = steps.findIndex(s => s.status === order.status);

        return steps.map((step, idx) => ({
            ...step,
            completed: idx <= currentIndex,
            active: idx === currentIndex,
        }));
    };

    if (loading) {
        return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 className="section-title">Meus Pedidos</h1>

            {orders.length === 0 ? (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Package size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666', marginBottom: '1rem' }}>Você ainda não fez nenhum pedido</p>
                    <a href="/" className="btn btn-primary">Começar a Comprar</a>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {orders.map(order => (
                        <div key={order._id} style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                        Pedido #{order._id.slice(-6).toUpperCase()}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                                        <Calendar size={16} />
                                        <span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>
                                <OrderStatusBadge status={order.status} />
                            </div>

                            {/* Timeline */}
                            {order.status !== 'cancelled' && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                                        {getStatusTimeline(order).map((step, idx) => (
                                            <div key={idx} style={{ flex: 1, position: 'relative', textAlign: 'center' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: step.completed ? '#6CC551' : '#ddd',
                                                    margin: '0 auto 0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: '0.9rem',
                                                }}>
                                                    {step.completed ? '✓' : idx + 1}
                                                </div>
                                                <p style={{ fontSize: '0.75rem', color: step.completed ? '#333' : '#999', fontWeight: step.active ? 600 : 400 }}>
                                                    {step.label}
                                                </p>
                                                {idx < 4 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '16px',
                                                        left: '50%',
                                                        width: '100%',
                                                        height: '2px',
                                                        background: step.completed ? '#6CC551' : '#ddd',
                                                        zIndex: -1,
                                                    }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cancelled Message */}
                            {order.status === 'cancelled' && (
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8d7da', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={20} color="#721c24" />
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#721c24' }}>Pedido Cancelado</p>
                                        {order.cancelReason && <p style={{ fontSize: '0.9rem', color: '#721c24' }}>Motivo: {order.cancelReason}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Itens do Pedido</h4>
                                <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
                                    {order.items.map((item: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                            <span>{item.quantity}x {item.title}</span>
                                            <span style={{ fontWeight: 600 }}>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    ))}
                                    {order.discount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#6CC551' }}>
                                            <span>Desconto {order.coupon && `(Cupom: ${order.coupon})`}</span>
                                            <span>- R$ {order.discount.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    <div style={{ borderTop: '1px solid #ddd', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                                        <span>Total</span>
                                        <span style={{ color: '#6CC551' }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={18} />
                                    Endereço de Entrega
                                </h4>
                                <p style={{ fontSize: '0.95rem', color: '#666' }}>
                                    {order.address.street}, {order.address.number}{order.address.complement ? ` - ${order.address.complement}` : ''}<br />
                                    {order.address.city} - CEP: {order.address.zip}
                                </p>
                            </div>

                            {/* Delivery Person */}
                            {order.deliveryPersonId && (
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Truck size={20} color="#6CC551" />
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#155724' }}>Entregador</p>
                                        <p style={{ fontSize: '0.9rem', color: '#155724' }}>{order.deliveryPersonId.name} - {order.deliveryPersonId.phone}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {order.status === 'pending' && (
                                <button
                                    onClick={() => handleCancelOrder(order._id)}
                                    style={{ padding: '0.8rem 1.5rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Cancelar Pedido
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
