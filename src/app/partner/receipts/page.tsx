"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { 
    Search, 
    X, 
    Printer, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Receipt, 
    User, 
    TrendingUp, 
    ArrowUpRight, 
    FileText,
    Calendar,
    ChevronRight,
    DollarSign
} from 'lucide-react';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';

export default function PartnerReceipts() {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('TODOS');
    const [searchId, setSearchId] = useState('');
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
                // Filtramos apenas pedidos que já foram pagos/aprovados (pois apenas eles geram split/repasse)
                const paidOrders = data.filter((o: any) => o.paymentStatus === 'approved');
                setOrders(paidOrders);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const getStats = () => {
        let totalReceived = 0;
        let totalPending = 0;
        let countCompleted = 0;

        orders.forEach(o => {
            if (o.splitStatus === 'completed') {
                totalReceived += o.splitAmount || 0;
                countCompleted++;
            } else if (o.splitStatus === 'pending' || o.splitStatus === 'processing') {
                // Cálculo estimado do valor que o parceiro irá receber (85%)
                totalPending += o.splitAmount || (o.total * 0.85);
            }
        });

        return {
            totalReceived,
            totalPending,
            countCompleted,
            totalTransactions: orders.length
        };
    };

    const filterOrders = () => {
        let filtered = orders;

        if (activeTab === 'CONCLUIDOS') {
            filtered = filtered.filter(o => o.splitStatus === 'completed');
        } else if (activeTab === 'PROCESSANDO') {
            filtered = filtered.filter(o => o.splitStatus === 'processing');
        } else if (activeTab === 'FALHADOS') {
            filtered = filtered.filter(o => o.splitStatus === 'failed');
        }

        if (searchId) {
            filtered = filtered.filter(o => o._id.toLowerCase().includes(searchId.toLowerCase()));
        }

        return filtered;
    };

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

    const stats = getStats();
    const filteredOrders = filterOrders();

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando comprovantes...</div>;
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

                @media print {
                    aside, 
                    .no-print, 
                    button,
                    nav,
                    header {
                        display: none !important;
                    }
                    main {
                        margin-left: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        overflow: visible !important;
                    }
                    body, html {
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    .clickpet-modal-overlay-print {
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        backdrop-filter: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                        overflow: visible !important;
                    }
                    .clickpet-modal-content-print {
                        max-width: 100% !important;
                        max-height: none !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        transform: none !important;
                        animation: none !important;
                        background: white !important;
                        overflow: visible !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }

                @media (max-width: 768px) {
                    .receipts-toolbar {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0.75rem !important;
                    }
                    .receipts-tabs-container {
                        width: 100% !important;
                    }
                    .receipts-search-container {
                        width: 100% !important;
                    }
                    .receipts-table-container {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                    }
                    .receipts-table, 
                    .receipts-table tbody, 
                    .receipts-table-row, 
                    .receipts-table-cell {
                        display: block !important;
                        width: 100% !important;
                    }
                    .receipts-table-header {
                        display: none !important;
                    }
                    .receipts-table-row {
                        background: #F9FBFD !important;
                        border: 1px solid rgba(209, 217, 226, 1) !important;
                        border-radius: 12px !important;
                        padding: 1rem !important;
                        margin-bottom: 1rem !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
                        text-align: left !important;
                    }
                    .receipts-table-cell {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        padding: 10px 0 !important;
                        border-bottom: 1px dashed rgba(209, 217, 226, 0.4) !important;
                        text-align: right !important;
                        font-size: 14px !important;
                    }
                    .receipts-table-cell:last-child {
                        border-bottom: none !important;
                    }
                    .receipts-table-cell::before {
                        content: attr(data-label) !important;
                        font-weight: 700 !important;
                        color: #757575 !important;
                        text-transform: uppercase !important;
                        font-size: 11px !important;
                        text-align: left !important;
                        margin-right: 16px !important;
                    }
                    .receipts-table-cell:first-child {
                        border-bottom: 1px solid rgba(209, 217, 226, 1) !important;
                        padding-bottom: 12px !important;
                        margin-bottom: 8px !important;
                        justify-content: flex-start !important;
                        padding-top: 0 !important;
                    }
                    .receipts-table-cell:first-child::before {
                        display: none !important;
                    }
                }
            ` }} />

            {/* Painel Geral (Oculto na impressão) */}
            <div className="no-print">
                {/* Header */}
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
                    Histórico de Comprovantes e Repasses
                </h1>

                {/* Cards de Métricas Finanças */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Card 1: Total Recebido */}
                    <div style={{
                        background: 'linear-gradient(135deg, #F4FAF7 0%, #FFFFFF 100%)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid rgba(59, 183, 126, 0.3)',
                        boxShadow: '0 4px 12px rgba(59, 183, 126, 0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span style={{ fontSize: '13px', color: '#757575', fontWeight: 600, textTransform: 'uppercase' }}>Total Recebido (Líquido)</span>
                            <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '24px', fontWeight: 800, color: '#3BB77E' }}>
                                R$ {stats.totalReceived.toFixed(2).replace('.', ',')}
                            </h2>
                        </div>
                        <div style={{ background: '#E2F3EC', padding: '12px', borderRadius: '10px', color: '#3BB77E' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>

                    {/* Card 2: Valores Pendentes */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid rgba(209, 217, 226, 1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span style={{ fontSize: '13px', color: '#757575', fontWeight: 600, textTransform: 'uppercase' }}>Repasses em Processamento</span>
                            <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '24px', fontWeight: 800, color: '#253D4E' }}>
                                R$ {stats.totalPending.toFixed(2).replace('.', ',')}
                            </h2>
                        </div>
                        <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '10px', color: '#475569' }}>
                            <Clock size={24} />
                        </div>
                    </div>

                    {/* Card 3: Repasses Realizados */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid rgba(209, 217, 226, 1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span style={{ fontSize: '13px', color: '#757575', fontWeight: 600, textTransform: 'uppercase' }}>Quantidade de Repasses</span>
                            <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '24px', fontWeight: 800, color: '#253D4E' }}>
                                {stats.countCompleted} <span style={{ fontSize: '14px', fontWeight: 500, color: '#757575' }}>de {stats.totalTransactions} vendas</span>
                            </h2>
                        </div>
                        <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '10px', color: '#475569' }}>
                            <FileText size={24} />
                        </div>
                    </div>
                </div>

                {/* Filtros e Toolbar */}
                <div className="receipts-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    {/* Tabs */}
                    <div className="receipts-tabs-container" style={{
                        display: 'flex',
                        width: '450px',
                        height: '40px',
                        borderRadius: '5px',
                        border: '1px solid #D1D9E2',
                        overflow: 'hidden',
                        background: '#FFFFFF'
                    }}>
                        {['TODOS', 'CONCLUIDOS', 'PROCESSANDO', 'FALHADOS'].map((tab, idx) => (
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

                    {/* Pesquisar por ID */}
                    <div className="receipts-search-container" style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '280px',
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid #D1D9E2',
                        padding: '0 1rem',
                        background: 'white'
                    }}>
                        <Search size={18} color="#757575" />
                        <input
                            type="text"
                            placeholder="PESQUISAR PEDIDO ID"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                width: '100%',
                                marginLeft: '0.5rem',
                                fontSize: '13px',
                                color: '#757575',
                                background: 'transparent'
                            }}
                        />
                    </div>
                </div>

                {/* Tabela de Comprovantes */}
                <div className="receipts-table-container" style={{
                    background: '#F9FBFD',
                    borderRadius: '12px',
                    padding: '1.5rem 0',
                    border: '1px solid rgba(209, 217, 226, 1)',
                    overflowX: 'auto'
                }}>
                    <table className="receipts-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr className="receipts-table-header" style={{ borderBottom: '1px solid rgba(209, 217, 226, 1)', color: '#757575', fontSize: '13px' }}>
                                <th style={{ padding: '1rem', fontWeight: 700, width: '15%', textAlign: 'center' }}>ID PEDIDO</th>
                                <th style={{ padding: '1rem', fontWeight: 700, width: '15%', textAlign: 'center' }}>DATA REPASSE</th>
                                <th style={{ padding: '1rem', fontWeight: 700, width: '15%', textAlign: 'center' }}>VALOR DA COMPRA</th>
                                <th style={{ padding: '1rem', fontWeight: 700, width: '15%', textAlign: 'center' }}>COMISSÃO (15%)</th>
                                <th style={{ padding: '1rem', fontWeight: 700, width: '15%', textAlign: 'center' }}>VALOR REPASSE (85%)</th>
                                <th style={{ padding: '1rem', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>STATUS PIX</th>
                                <th style={{ padding: '1rem', fontWeight: 700, width: '12.5%', textAlign: 'center' }}>COMPROVANTE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#999', fontSize: '14px' }}>
                                        Nenhum repasse de pagamento encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    const getSplitStatusColor = (status: string) => {
                                        if (status === 'completed') return '#3BB77E';
                                        if (status === 'processing') return '#FFC107';
                                        if (status === 'failed') return '#FF3B30';
                                        return '#757575';
                                    };

                                    const getSplitStatusLabel = (status: string) => {
                                        if (status === 'completed') return 'ENVIADO';
                                        if (status === 'processing') return 'PROCESSANDO';
                                        if (status === 'failed') return 'FALHOU';
                                        return 'PENDENTE';
                                    };

                                    return (
                                        <tr 
                                            key={order._id}
                                            className="receipts-table-row"
                                            style={{
                                                fontSize: '14px',
                                                color: '#475569',
                                                fontWeight: 500,
                                                textAlign: 'center',
                                                borderBottom: '1px solid rgba(209, 217, 226, 0.4)',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(230, 244, 238, 0.3)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td className="receipts-table-cell" data-label="ID Pedido" style={{ padding: '1rem 0', fontWeight: 600, color: '#3BB77E' }}>
                                                #{order._id.slice(-6).toUpperCase()}
                                            </td>
                                            <td className="receipts-table-cell" data-label="Data" style={{ padding: '1rem 0' }}>
                                                {order.splitProcessedAt 
                                                    ? new Date(order.splitProcessedAt).toLocaleDateString('pt-BR') 
                                                    : new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="receipts-table-cell" data-label="Valor Compra" style={{ padding: '1rem 0' }}>
                                                R$ {order.total?.toFixed(2).replace('.', ',')}
                                            </td>
                                            <td className="receipts-table-cell" data-label="Comissão" style={{ padding: '1rem 0', color: '#888' }}>
                                                R$ {order.platformFee?.toFixed(2).replace('.', ',') || (order.total * 0.15).toFixed(2).replace('.', ',')}
                                            </td>
                                            <td className="receipts-table-cell" data-label="Valor Repasse" style={{ padding: '1rem 0', fontWeight: 700, color: '#253D4E' }}>
                                                R$ {order.splitAmount?.toFixed(2).replace('.', ',') || (order.total * 0.85).toFixed(2).replace('.', ',')}
                                            </td>
                                            <td className="receipts-table-cell" data-label="Status Pix" style={{ padding: '1rem 0' }}>
                                                <span style={{
                                                    background: getSplitStatusColor(order.splitStatus) + '1A',
                                                    color: getSplitStatusColor(order.splitStatus),
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    display: 'inline-block'
                                                }}>
                                                    {getSplitStatusLabel(order.splitStatus)}
                                                </span>
                                            </td>
                                            <td className="receipts-table-cell" data-label="Comprovante" style={{ padding: '1rem 0' }}>
                                                {order.splitStatus === 'completed' ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setIsReceiptModalOpen(true);
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#3BB77E',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#2aac6c'}
                                                        onMouseLeave={e => e.currentTarget.style.background = '#3BB77E'}
                                                    >
                                                        <Receipt size={14} />
                                                        Ver Recibo
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>-</span>
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

            {/* Modal de Comprovante de Repasse Pix (Exibido na impressão) */}
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

                                {/* DETALHAMENTO DO CÁLCULO E TAXAS ABSORVIDAS */}
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
                                            <span>R$ {selectedOrder.platformFee?.toFixed(2).replace('.', ',') || (selectedOrder.total * 0.15).toFixed(2).replace('.', ',')}</span>
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

                            {/* Aviso Legal */}
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
