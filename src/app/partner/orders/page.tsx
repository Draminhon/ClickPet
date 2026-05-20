"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Search, 
    MoreHorizontal, 
    X, 
    Printer, 
    CreditCard, 
    User as UserIcon, 
    Calendar as CalendarIcon, 
    MapPin, 
    Receipt, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    RefreshCw,
    ShoppingBag,
    Phone,
    Mail,
    ChevronRight,
    DollarSign
} from 'lucide-react';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';

export default function PartnerOrders() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Novas states para a tabela
    const [activeTab, setActiveTab] = useState('TODOS');
    const [searchId, setSearchId] = useState('');

    // Novas states para o Drawer de Detalhes e Modal de Recibo (Opção A)
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [partnerProfile, setPartnerProfile] = useState<any | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchPartnerProfile();
    }, []);

    const fetchPartnerProfile = () => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => {
                setPartnerProfile(data);
            })
            .catch(err => console.error('Erro ao buscar perfil do parceiro:', err));
    };

    const fetchOrders = () => {
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
                
                // Se houver um pedido selecionado, atualiza com os dados mais recentes do polling/refresh
                if (selectedOrder) {
                    const freshOrder = data.find((o: any) => o._id === selectedOrder._id);
                    if (freshOrder) {
                        setSelectedOrder(freshOrder);
                    }
                }
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

        data.forEach(d => {
            const val = d.PedidosReal;
            if (val === 0) {
                d.Pedidos = 0;
            } else if (val <= 10) {
                d.Pedidos = val / 10;
            } else if (val <= 50) {
                d.Pedidos = 1 + ((val - 10) / 40);
            } else if (val <= 100) {
                d.Pedidos = 2 + ((val - 50) / 50);
            } else if (val <= 1000) {
                d.Pedidos = 3 + ((val - 100) / 900);
            } else {
                d.Pedidos = 4;
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

    // Função de mascarar chaves PIX para o comprovante
    const maskPixKey = (key: string, type: string) => {
        if (!key) return '-';
        const cleaned = key.trim();
        const upperType = String(type || '').toUpperCase();
        
        if (upperType === 'EMAIL') {
            const parts = cleaned.split('@');
            if (parts.length === 2) {
                const name = parts[0];
                const domain = parts[1];
                return name.charAt(0) + '****' + name.slice(-1) + '@' + domain;
            }
        }
        if (upperType === 'PHONE' || upperType === 'CELULAR' || upperType === 'TELEFONE') {
            const digits = cleaned.replace(/\D/g, '');
            if (digits.length >= 10) {
                return `(${digits.slice(0, 2)}) 9****-${digits.slice(-4)}`;
            }
        }
        if (upperType === 'CPF') {
            const digits = cleaned.replace(/\D/g, '');
            if (digits.length === 11) {
                return `***.***.${digits.slice(6, 9)}-${digits.slice(-2)}`;
            }
        }
        if (upperType === 'CNPJ') {
            const digits = cleaned.replace(/\D/g, '');
            if (digits.length === 14) {
                return `**.***.***.0001-**`;
            }
        }
        if (upperType === 'RANDOM' || upperType === 'ALEATORIA') {
            if (cleaned.length > 8) {
                return cleaned.slice(0, 8) + '-****-****-****-' + cleaned.slice(-4);
            }
        }
        return cleaned.slice(0, 4) + '****' + cleaned.slice(-4);
    };

    const chartData = getMonthlyData();
    const filteredOrders = filterOrders();

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div>
            {/* Estilos CSS Injetados para Animações e Print Customizado */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                
                .spin-animation {
                    animation: spin 1.5s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media print {
                    /* Oculta toda a barra lateral, banner de assinatura e elementos não relacionados */
                    aside, 
                    main > div:first-of-type, 
                    .no-print, 
                    button,
                    .recharts-responsive-container {
                        display: none !important;
                    }
                    main {
                        margin-left: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    /* Exibe somente o container de comprovante */
                    .clickpet-modal-overlay-print {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                        z-index: 99999 !important;
                    }
                    .clickpet-modal-content-print {
                        max-width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        transform: none !important;
                        background: white !important;
                    }
                    /* Força o navegador a imprimir cores de fundo */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            ` }} />

            {/* Painel do Dashboard Geral (Oculto na impressão) */}
            <div className="no-print">
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
                                fontWeight: 400,
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
                        fontWeight: 400,
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
                                        fontWeight: activeTab === tab ? 'bold' : 600,
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
                                        fontWeight: 400,
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
                        padding: '1.5rem 0',
                        border: '1px solid rgba(209, 217, 226, 1)',
                        overflowX: 'auto'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(209, 217, 226, 1)', color: '#757575', fontSize: '14px' }}>
                                    <th style={{ padding: '1rem 0', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>ID</th>
                                    <th style={{ padding: '1rem 0', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>DATA</th>
                                    <th style={{ padding: '1rem 0', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>ITENS</th>
                                    <th style={{ padding: '1rem 0', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>TOTAL</th>
                                    <th style={{ padding: '1rem 0', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>STATUS</th>
                                    <th style={{ padding: '1rem 0', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>CLIENTE</th>
                                    <th style={{ padding: '1rem 0', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>PAGAMENTO</th>
                                    <th style={{ padding: '1rem 0', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>AÇÕES</th>
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
                                            if (order.status === 'delivered') return 'rgba(59, 183, 126, 0.1)';
                                            if (order.status === 'cancelled') return 'rgba(255, 0, 4, 0.08)';
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
                                            <tr 
                                                key={order._id} 
                                                onClick={(e) => {
                                                    const target = e.target as HTMLElement;
                                                    // Abre o drawer somente se não clicou em um botão de ação rápida
                                                    if (target.tagName !== 'BUTTON' && !target.closest('button')) {
                                                        setSelectedOrder(order);
                                                    }
                                                }}
                                                style={{
                                                    fontSize: '15px',
                                                    color: '#475569',
                                                    fontWeight: 500,
                                                    background: getRowBackground(),
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid rgba(209, 217, 226, 0.4)',
                                                    transition: 'background 0.2s ease-in-out'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(230, 244, 238, 0.5)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = getRowBackground();
                                                }}
                                            >
                                                <td style={{ padding: '1.2rem 0', fontWeight: 600, color: '#3BB77E' }}>
                                                    #{order._id.slice(-6).toUpperCase()}
                                                </td>
                                                <td style={{ padding: '1.2rem 0' }}>
                                                    {new Date(order.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                </td>
                                                <td style={{ padding: '1.2rem 0' }}>{order.items?.length || 0}</td>
                                                <td style={{ padding: '1.2rem 0', fontWeight: 600, color: '#253D4E' }}>
                                                    R$ {order.total?.toFixed(2).replace('.', ',')}
                                                </td>
                                                <td style={{ padding: '1.2rem 0' }}>
                                                    <OrderStatusBadge status={order.status} />
                                                </td>
                                                <td style={{ padding: '1.2rem 0' }}>
                                                    {order.userId?.name || order.user?.name || '-'}
                                                </td>
                                                <td style={{ padding: '1.2rem 0', textTransform: 'uppercase', fontSize: '13px', fontWeight: 700 }}>
                                                    <span style={{
                                                        color: order.paymentStatus === 'approved' ? '#3BB77E' : 
                                                               order.paymentStatus === 'pending' ? '#FFC107' : '#FF3B30'
                                                    }}>
                                                        {order.paymentStatus === 'cancelled' ? 'CANCELADO' :
                                                         order.paymentStatus === 'rejected' ? 'RECUSADO' : 
                                                         order.paymentStatus === 'pending' ? 'PENDENTE' : 'APROVADO'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.2rem 0' }} onClick={(e) => e.stopPropagation()}>
                                                    {order.status === 'pending' && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button onClick={() => handleStatusUpdate(order._id, 'accepted')} style={{ padding: '6px 12px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#2aac6c'} onMouseLeave={e => e.currentTarget.style.background = '#3BB77E'}>Aceitar</button>
                                                            <button onClick={() => handleStatusUpdate(order._id, 'cancelled')} style={{ padding: '6px 12px', fontSize: '12px', background: '#FF3B30', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#d32f2f'} onMouseLeave={e => e.currentTarget.style.background = '#FF3B30'}>Recusar</button>
                                                        </div>
                                                    )}
                                                    {order.status === 'accepted' && (
                                                        <button onClick={() => handleStatusUpdate(order._id, 'preparing')} style={{ padding: '6px 14px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#2aac6c'} onMouseLeave={e => e.currentTarget.style.background = '#3BB77E'}>Iniciar Preparo</button>
                                                    )}
                                                    {order.status === 'preparing' && (
                                                        <button onClick={() => handleStatusUpdate(order._id, 'out_for_delivery')} style={{ padding: '6px 14px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#2aac6c'} onMouseLeave={e => e.currentTarget.style.background = '#3BB77E'}>Enviar p/ Entrega</button>
                                                    )}
                                                    {order.status === 'out_for_delivery' && (
                                                        <button onClick={() => handleStatusUpdate(order._id, 'delivered')} style={{ padding: '6px 14px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#2aac6c'} onMouseLeave={e => e.currentTarget.style.background = '#3BB77E'}>Marcar Entregue</button>
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

            {/* Backdrop do Drawer (Oculto na impressão) */}
            {selectedOrder && (
                <div 
                    className="no-print"
                    onClick={() => setSelectedOrder(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 999,
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                />
            )}

            {/* Painel Lateral (Drawer) de Detalhes do Pedido (Oculto na impressão) */}
            <div 
                className="no-print"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    height: '100vh',
                    width: '100%',
                    maxWidth: '480px',
                    background: '#ffffff',
                    boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.12)',
                    zIndex: 1000,
                    transform: selectedOrder ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: '1px solid rgba(209, 217, 226, 0.8)'
                }}
            >
                {selectedOrder && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
                        {/* Drawer Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.5rem',
                            borderBottom: '1px solid rgba(209, 217, 226, 0.8)',
                            background: '#F9FBFD'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <span style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: '#253D4E'
                                }}>
                                    Pedido #{selectedOrder._id.slice(-6).toUpperCase()}
                                </span>
                                <OrderStatusBadge status={selectedOrder.status} />
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#757575',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e6e9ec'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body Content */}
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            
                            {/* Cliente Details */}
                            <div>
                                <h4 style={{ margin: '0 0 0.8rem 0', color: '#253D4E', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Cliente
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: '#F9FBFD', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(209, 217, 226, 0.5)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <UserIcon size={16} color="#757575" />
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#253D4E' }}>
                                            {selectedOrder.userId?.name || selectedOrder.user?.name || 'Cliente ClickPet'}
                                        </span>
                                    </div>
                                    {(selectedOrder.userId?.phone || selectedOrder.user?.phone) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Phone size={16} color="#757575" />
                                            <span style={{ fontSize: '14px', color: '#475569' }}>
                                                {selectedOrder.userId?.phone || selectedOrder.user?.phone}
                                            </span>
                                        </div>
                                    )}
                                    {(selectedOrder.userId?.email || selectedOrder.user?.email) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Mail size={16} color="#757575" />
                                            <span style={{ fontSize: '14px', color: '#475569' }}>
                                                {selectedOrder.userId?.email || selectedOrder.user?.email}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Itens do Pedido */}
                            <div>
                                <h4 style={{ margin: '0 0 0.8rem 0', color: '#253D4E', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Itens do Pedido
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: '#F9FBFD', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(209, 217, 226, 0.5)' }}>
                                    {selectedOrder.items?.map((item: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid rgba(209, 217, 226, 0.3)' : 'none', paddingBottom: idx < selectedOrder.items.length - 1 ? '0.8rem' : 0 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#253D4E' }}>
                                                    {item.title}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#757575' }}>
                                                    Qtd: {item.quantity} x R$ {item.price?.toFixed(2).replace('.', ',')}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#253D4E' }}>
                                                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resumo Financeiro da Compra */}
                            <div>
                                <h4 style={{ margin: '0 0 0.8rem 0', color: '#253D4E', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Valores do Pedido
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: '#F9FBFD', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(209, 217, 226, 0.5)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#757575' }}>
                                        <span>Subtotal:</span>
                                        <span>R$ {(selectedOrder.total - (selectedOrder.deliveryFee || 0) + (selectedOrder.discount || 0) + (selectedOrder.pointsDiscount || 0)).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    {selectedOrder.discount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dc3545' }}>
                                            <span>Cupom Desconto:</span>
                                            <span>- R$ {selectedOrder.discount?.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    {selectedOrder.pointsDiscount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#dc3545' }}>
                                            <span>Fidelidade Resgate:</span>
                                            <span>- R$ {selectedOrder.pointsDiscount?.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    {selectedOrder.deliveryFee > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#757575' }}>
                                            <span>Taxa de Entrega:</span>
                                            <span>R$ {selectedOrder.deliveryFee?.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: '#253D4E', borderTop: '1px solid rgba(209, 217, 226, 0.5)', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
                                        <span>Total do Pedido:</span>
                                        <span>R$ {selectedOrder.total?.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Endereço de Entrega */}
                            {!selectedOrder.isPickup && selectedOrder.address && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#253D4E', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Endereço de Entrega
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#F9FBFD', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(209, 217, 226, 0.5)' }}>
                                        <MapPin size={18} color="#757575" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '13px', color: '#475569' }}>
                                            <span style={{ fontWeight: 600, color: '#253D4E' }}>
                                                {selectedOrder.address.street}, {selectedOrder.address.number}
                                            </span>
                                            {selectedOrder.address.complement && (
                                                <span>Comp: {selectedOrder.address.complement}</span>
                                            )}
                                            <span>Bairro: {selectedOrder.address.neighborhood || '-'}</span>
                                            <span>{selectedOrder.address.city || '-'} - {selectedOrder.address.state || '-'}</span>
                                            <span>CEP: {selectedOrder.address.zip}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Split de Pagamento - REPASSE FINANCEIRO DO PETSHOP */}
                            {selectedOrder.paymentStatus === 'approved' && (
                                <div>
                                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#253D4E', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Repasse Financeiro (Split Pix)
                                    </h4>
                                    {selectedOrder.splitStatus === 'completed' ? (
                                        <div style={{
                                            padding: '1.2rem',
                                            background: 'linear-gradient(135deg, #F4FAF7 0%, #FFFFFF 100%)',
                                            borderRadius: '10px',
                                            border: '1.5px solid #3BB77E',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.8rem',
                                            boxShadow: '0 4px 12px rgba(59, 183, 126, 0.05)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3BB77E' }}>
                                                <CheckCircle size={18} />
                                                <span style={{ fontWeight: 700, fontSize: '14px' }}>Pix Recebido com Sucesso</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '13px', color: '#475569' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Repasse Líquido (85%):</span>
                                                    <span style={{ fontWeight: 700, color: '#3BB77E', fontSize: '14px' }}>
                                                        R$ {selectedOrder.splitAmount?.toFixed(2).replace('.', ',')}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Comissão ClickPet (15%):</span>
                                                    <span>R$ {selectedOrder.platformFee?.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Data de Envio:</span>
                                                    <span>{selectedOrder.splitProcessedAt ? new Date(selectedOrder.splitProcessedAt).toLocaleString('pt-BR') : '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(209, 217, 226, 0.4)', paddingTop: '6px', marginTop: '4px' }}>
                                                    <span>E2E ID da Transação:</span>
                                                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#253D4E', wordBreak: 'break-all', background: '#f1f5f9', padding: '6px', borderRadius: '4px' }}>
                                                        {selectedOrder.splitPixId}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => setIsReceiptModalOpen(true)}
                                                style={{
                                                    marginTop: '0.4rem',
                                                    width: '100%',
                                                    padding: '12px',
                                                    background: '#3BB77E',
                                                    color: '#FEFEFE',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: '0 4px 12px rgba(59, 183, 126, 0.15)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#2aac6c';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#3BB77E';
                                                    e.currentTarget.style.transform = 'none';
                                                }}
                                            >
                                                <Receipt size={16} />
                                                Ver Comprovante Oficial
                                            </button>
                                        </div>
                                    ) : selectedOrder.splitStatus === 'processing' ? (
                                        <div style={{
                                            padding: '1rem',
                                            background: '#FFFDF5',
                                            borderRadius: '8px',
                                            border: '1px solid #FFC107',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem',
                                            color: '#B78103'
                                        }}>
                                            <Clock size={20} className="spin-animation" />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 700, fontSize: '13px' }}>Enviando PIX...</span>
                                                <span style={{ fontSize: '11px', color: '#7a5a02' }}>O Pix de repasse de 85% está sendo processado na rede bancária.</span>
                                            </div>
                                        </div>
                                    ) : selectedOrder.splitStatus === 'failed' ? (
                                        <div style={{
                                            padding: '1rem',
                                            background: '#FFF5F5',
                                            borderRadius: '8px',
                                            border: '1px solid #FF3B30',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                            color: '#FF3B30'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <AlertCircle size={20} />
                                                <span style={{ fontWeight: 700, fontSize: '13px' }}>Erro no Pix de Repasse</span>
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#8E1F1F', background: '#FFEBEB', padding: '6px', borderRadius: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                                Motivo: {selectedOrder.splitError || 'Erro no gateway de pagamento'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#757575' }}>
                                                Nosso sistema de inteligência financeira já registrou este evento e tentará reprocessar em instantes.
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '1rem',
                                            background: '#F8FAFC',
                                            borderRadius: '8px',
                                            border: '1px solid #CBD5E1',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.8rem',
                                            color: '#475569'
                                        }}>
                                            <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '13px' }}>Repasse Pendente</span>
                                                <span style={{ fontSize: '11px' }}>O PIX de repasse automático será executado assim que a cobrança do cliente for liquidada.</span>
                                                {!partnerProfile?.pixConfig?.key && (
                                                    <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 600, background: '#FFFBEB', border: '1px solid #FCD34D', padding: '6px', borderRadius: '4px', marginTop: '6px' }}>
                                                        ⚠️ Chave Pix Ausente! Por favor, cadastre uma Chave Pix em "Configuração" para receber os repasses.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Comprovante de Repasse Pix (Opção A) (Exibido na impressão) */}
            {selectedOrder && isReceiptModalOpen && (
                <div 
                    className="clickpet-modal-overlay-print"
                    onClick={() => setIsReceiptModalOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 1010,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <div 
                        className="clickpet-modal-content-print"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#ffffff',
                            borderRadius: '20px',
                            width: '100%',
                            maxWidth: '550px',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    >
                        {/* Modal Header (Oculto na impressão) */}
                        <div className="no-print" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.2rem 1.5rem',
                            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                            background: '#F9FBFD'
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#253D4E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comprovante de Transferência</span>
                            <button 
                                onClick={() => setIsReceiptModalOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#757575',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#e6e9ec'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body - O COMPROVANTE OFICIAL EM SI */}
                        <div id="clickpet-receipt-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#FFFFFF' }}>
                            
                            {/* Banner Superior Verde */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, #E2F3EC 0%, #FFFFFF 100%)',
                                borderRadius: '12px',
                                border: '1.5px solid #3BB77E',
                                textAlign: 'center',
                                gap: '0.8rem',
                                position: 'relative'
                            }}>
                                <CheckCircle size={40} color="#3BB77E" />
                                <div>
                                    <h3 style={{ margin: 0, color: '#253D4E', fontSize: '18px', fontWeight: 800 }}>Comprovante de Repasse Pix</h3>
                                    <span style={{ fontSize: '13px', color: '#3BB77E', fontWeight: 700 }}>Intermediação de Venda ClickPet</span>
                                </div>
                            </div>

                            {/* Valor Central em Destaque */}
                            <div style={{ textAlign: 'center', borderBottom: '1px dashed #D1D9E2', paddingBottom: '1.5rem' }}>
                                <span style={{ fontSize: '12px', color: '#757575', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>VALOR LIQUIDO ENVIADO</span>
                                <h2 style={{ margin: '0.2rem 0', fontSize: '32px', fontWeight: 800, color: '#3BB77E' }}>
                                    R$ {selectedOrder.splitAmount?.toFixed(2).replace('.', ',')}
                                </h2>
                                <span style={{ fontSize: '12px', color: '#757575', fontWeight: 500 }}>
                                    Transferência concluída com sucesso em {selectedOrder.splitProcessedAt ? new Date(selectedOrder.splitProcessedAt).toLocaleDateString('pt-BR') : ''} às {selectedOrder.splitProcessedAt ? new Date(selectedOrder.splitProcessedAt).toLocaleTimeString('pt-BR') : ''}
                                </span>
                            </div>

                            {/* Grid Detalhado da Operação */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '13px' }}>
                                
                                {/* DADOS DO PAGADOR (ORIGEM) */}
                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#253D4E', textTransform: 'uppercase', display: 'block', marginBottom: '6px', borderLeft: '3px solid #3BB77E', paddingLeft: '6px', letterSpacing: '0.5px' }}>
                                        Origem (Pagador)
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#757575' }}>Razão Social:</span>
                                            <span style={{ fontWeight: 600, color: '#253D4E' }}>ClickPet Plataforma de Serviços Pet Ltda.</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#757575' }}>CNPJ:</span>
                                            <span style={{ fontWeight: 600, color: '#253D4E' }}>66.020.276/0001-40</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#757575' }}>Instituição Financeira:</span>
                                            <span style={{ fontWeight: 600, color: '#253D4E' }}>AbacatePay IP S.A.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* DADOS DO RECEBEDOR (DESTINO) */}
                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#253D4E', textTransform: 'uppercase', display: 'block', marginBottom: '6px', borderLeft: '3px solid #3BB77E', paddingLeft: '6px', letterSpacing: '0.5px' }}>
                                        Destino (Recebedor / Seu Estabelecimento)
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#757575' }}>Nome Fantasia:</span>
                                            <span style={{ fontWeight: 600, color: '#253D4E' }}>{partnerProfile?.name || 'Petshop Parceiro'}</span>
                                        </div>
                                        {partnerProfile?.cnpj && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#757575' }}>CNPJ do Petshop:</span>
                                                <span style={{ fontWeight: 600, color: '#253D4E' }}>{partnerProfile.cnpj}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#757575' }}>Chave Pix Destinatária:</span>
                                            <span style={{ fontWeight: 600, color: '#253D4E' }}>
                                                {maskPixKey(partnerProfile?.pixConfig?.key || '-', partnerProfile?.pixConfig?.keyType || 'CELULAR')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#757575' }}>Tipo de Chave Pix:</span>
                                            <span style={{ fontWeight: 600, color: '#253D4E' }}>
                                                {partnerProfile?.pixConfig?.keyType || 'CELULAR'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* DETALHES DE TRANSAÇÃO DO BANCO CENTRAL */}
                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#253D4E', textTransform: 'uppercase', display: 'block', marginBottom: '6px', borderLeft: '3px solid #3BB77E', paddingLeft: '6px', letterSpacing: '0.5px' }}>
                                        Autenticação da Transação Pix
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#757575' }}>E2E Pix ID (Código Central):</span>
                                            <span style={{ fontWeight: 600, color: '#253D4E', fontSize: '11px', fontFamily: 'monospace' }}>{selectedOrder.splitPixId}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#757575' }}>Referência do Pedido:</span>
                                            <span style={{ fontWeight: 600, color: '#253D4E' }}>Pedido #{selectedOrder._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* DETALHAMENTO DO CÁLCULO E TAXAS ABSORVIDAS (TRANSPARÊNCIA TOTAL) */}
                                <div style={{ borderTop: '1.5px dashed #D1D9E2', paddingTop: '1.2rem', marginTop: '0.4rem' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#253D4E', textTransform: 'uppercase', display: 'block', marginBottom: '6px', borderLeft: '3px solid #3BB77E', paddingLeft: '6px', letterSpacing: '0.5px' }}>
                                        Demonstrativo de Valores & Taxas
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: '#F4FAF7', padding: '12px', borderRadius: '8px', border: '1px solid #E2F3EC' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                            <span>Valor Total Pago pelo Cliente:</span>
                                            <span>R$ {selectedOrder.total?.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                                            <span>Comissão Bruta ClickPet (15%):</span>
                                            <span>R$ {selectedOrder.platformFee?.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3BB77E', fontWeight: 600 }}>
                                            <span>Taxas da Operação (Absorvidas pela ClickPet):</span>
                                            <span>R$ 1,60</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: '#253D4E', borderTop: '1.5px solid #3BB77E', paddingTop: '8px', marginTop: '6px' }}>
                                            <span>Valor Líquido Recebido pelo Petshop (85%):</span>
                                            <span style={{ color: '#3BB77E', fontSize: '15px' }}>R$ {selectedOrder.splitAmount?.toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Aviso Legal de Autenticidade */}
                            <div style={{
                                fontSize: '10.5px',
                                color: '#757575',
                                textAlign: 'center',
                                lineHeight: '1.5',
                                borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                                paddingTop: '1rem',
                                marginTop: '0.5rem'
                            }}>
                                Este comprovante é emitido automaticamente pela ClickPet em conformidade com as diretrizes do Banco Central do Brasil para transferências PIX. A transação correspondente foi liquidada de forma irreversível na conta do recebedor através do gateway de pagamento AbacatePay IP S.A.
                            </div>
                        </div>

                        {/* Botões de Ação do Modal (Ocultos na impressão) */}
                        <div className="no-print" style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '1.2rem 1.5rem',
                            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                            background: '#F9FBFD',
                            borderRadius: '0 0 20px 20px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setIsReceiptModalOpen(false)}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    border: '1px solid #D1D9E2',
                                    background: '#ffffff',
                                    color: '#757575',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => window.print()}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#3BB77E',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(59, 183, 126, 0.15)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2aac6c'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#3BB77E'}
                            >
                                <Printer size={15} />
                                Imprimir Recibo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
