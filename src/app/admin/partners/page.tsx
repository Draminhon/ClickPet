"use client";

import { useEffect, useState } from 'react';
import { Search, MapPin, Phone, Mail, FileText, Trash2, CreditCard, X, Check, PauseCircle, PlayCircle, Store } from 'lucide-react';

interface Partner {
    _id: string;
    name: string;
    email: string;
    cnpj: string;
    phone: string;
    address: {
        street: string;
        number: string;
        city: string;
        zip: string;
    };
    subscription: {
        _id: string;
        plan: string;
        status: string;
        endDate: string;
    } | null;
    createdAt: string;
}

export default function PartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionForm, setSubscriptionForm] = useState({
        plan: 'basic',
        status: 'active',
        endDate: '',
    });

    useEffect(() => {
        fetchPartners();
    }, [search, planFilter]);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (planFilter && planFilter !== 'all') params.append('plan', planFilter);

            const response = await fetch(`/api/admin/partners?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setPartners(data.partners || []);
            }
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir a petshop "${name}"? Esta ação não pode ser desfeita e removerá também a assinatura.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/partners/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setPartners(partners.filter(p => p._id !== id));
                alert('Parceiro excluído com sucesso!');
            } else {
                alert('Erro ao excluir parceiro.');
            }
        } catch (error) {
            console.error('Error deleting partner:', error);
            alert('Erro ao excluir parceiro.');
        }
    };

    const handleTogglePause = async (partner: Partner) => {
        if (!partner.subscription) return;

        const isSuspended = partner.subscription.status === 'suspended';
        const newStatus = isSuspended ? 'active' : 'suspended';
        const action = isSuspended ? 'retomar' : 'pausar';

        if (!confirm(`Tem certeza que deseja ${action} o acesso da petshop "${partner.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/subscriptions/${partner.subscription._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                alert(`Acesso ${isSuspended ? 'retomado' : 'pausado'} com sucesso!`);
                fetchPartners();
            } else {
                alert(`Erro ao ${action} acesso.`);
            }
        } catch (error) {
            console.error(`Error toggling pause:`, error);
            alert(`Erro ao ${action} acesso.`);
        }
    };

    const openSubscriptionModal = (partner: Partner) => {
        setSelectedPartner(partner);
        if (partner.subscription) {
            setSubscriptionForm({
                plan: partner.subscription.plan,
                status: partner.subscription.status,
                endDate: partner.subscription.endDate ? new Date(partner.subscription.endDate).toISOString().split('T')[0] : '',
            });
        } else {
            // Default values for new subscription
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setSubscriptionForm({
                plan: 'basic',
                status: 'active',
                endDate: nextMonth.toISOString().split('T')[0],
            });
        }
        setShowSubscriptionModal(true);
    };

    const handleSaveSubscription = async () => {
        if (!selectedPartner) return;

        try {
            let response;

            if (selectedPartner.subscription) {
                // Update existing subscription
                response = await fetch(`/api/admin/subscriptions/${selectedPartner.subscription._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscriptionForm),
                });
            } else {
                // Create new subscription
                response = await fetch('/api/admin/subscriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partnerId: selectedPartner._id,
                        ...subscriptionForm,
                    }),
                });
            }

            if (response.ok) {
                alert('Assinatura salva com sucesso!');
                setShowSubscriptionModal(false);
                fetchPartners(); // Refresh list
            } else {
                const data = await response.json();
                alert(data.error || 'Erro ao salvar assinatura.');
            }
        } catch (error) {
            console.error('Error saving subscription:', error);
            alert('Erro ao salvar assinatura.');
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return <span style={{ background: '#eee', color: '#666', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>Sem assinatura</span>;

        const styles: Record<string, any> = {
            active: { bg: '#E8F5E9', color: '#4CAF50', label: 'Ativa' },
            expired: { bg: '#FFEBEE', color: '#F44336', label: 'Expirada' },
            cancelled: { bg: '#FFF3E0', color: '#FF9800', label: 'Cancelada' },
            pending: { bg: '#E3F2FD', color: '#2196F3', label: 'Pendente' },
            suspended: { bg: '#FFF8E1', color: '#FFC107', label: 'Pausada' },
        };
        const style = styles[status] || styles.pending;
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 600
            }}>
                {style.label}
            </span>
        );
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#253D4E', margin: 0, letterSpacing: '-0.5px' }}>
                        Petshops Parceiras
                    </h1>
                    <p style={{ color: '#7E7E7E', marginTop: '0.5rem', fontSize: '1rem' }}>
                        Gerencie o acesso e as assinaturas de todas as lojas cadastradas
                    </p>
                </div>
                <div style={{ 
                    background: '#3BB77E', 
                    color: 'white', 
                    padding: '0.75rem 1.5rem', 
                    borderRadius: '12px', 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(59, 183, 126, 0.2)'
                }}>
                    <Store size={20} />
                    <span>{partners.length} Lojas Ativas</span>
                </div>
            </div>

            {/* Search and Filters */}
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                marginBottom: '2.5rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                gap: '1.5rem'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#BDBDBD' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome da loja, e-mail ou CNPJ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3.5rem',
                            border: '1px solid #F1F1F1',
                            borderRadius: '16px',
                            fontSize: '1rem',
                            background: '#F9F9F9',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.border = '1px solid #3BB77E';
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 183, 126, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.border = '1px solid #F1F1F1';
                            e.currentTarget.style.background = '#F9F9F9';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>

                <div style={{ minWidth: '200px' }}>
                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1.25rem',
                            border: '1px solid #F1F1F1',
                            borderRadius: '16px',
                            fontSize: '1rem',
                            background: '#F9F9F9',
                            outline: 'none',
                            cursor: 'pointer',
                            color: '#253D4E',
                            fontWeight: 600,
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23BDBDBD\' %3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1.25rem'
                        }}
                    >
                        <option value="all">Todos os Planos</option>
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                </div>

                <button 
                    onClick={() => fetchPartners()}
                    style={{
                        padding: '1rem 2rem',
                        background: '#253D4E',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    Filtrar
                </button>
            </div>

            {/* Partners Grid */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '40vh', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #eee', borderTopColor: '#3BB77E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#666' }}>Carregando parceiros...</p>
                </div>
            ) : partners.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '5rem', 
                    background: 'white', 
                    borderRadius: '24px',
                    border: '2px dashed #eee'
                }}>
                    <Store size={48} color="#ddd" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#999', fontSize: '1.1rem', fontWeight: 500 }}>Nenhuma petshop encontrada com esses critérios.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                    {partners.map((partner) => (
                        <div key={partner._id} style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '2rem',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.03)';
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#253D4E', margin: 0 }}>{partner.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <Mail size={14} color="#3BB77E" />
                                        <span style={{ fontSize: '0.85rem', color: '#7E7E7E' }}>{partner.email}</span>
                                    </div>
                                </div>
                                {getStatusBadge(partner.subscription?.status)}
                            </div>

                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '1rem',
                                background: '#F9F9F9',
                                padding: '1.25rem',
                                borderRadius: '16px'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#BDBDBD', fontWeight: 700, textTransform: 'uppercase' }}>CNPJ</span>
                                    <span style={{ fontSize: '0.9rem', color: '#253D4E', fontWeight: 600 }}>{partner.cnpj}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#BDBDBD', fontWeight: 700, textTransform: 'uppercase' }}>Telefone</span>
                                    <span style={{ fontSize: '0.9rem', color: '#253D4E', fontWeight: 600 }}>{partner.phone || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#BDBDBD', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={10} /> Localização
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#253D4E', lineHeight: 1.4 }}>
                                        {partner.address ? (
                                            `${partner.address.street}, ${partner.address.number} - ${partner.address.city}`
                                        ) : (
                                            'Endereço não cadastrado'
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3BB77E' }} />
                                    <span style={{ color: '#7E7E7E' }}>Plano: <strong style={{ color: '#253D4E' }}>{partner.subscription?.plan?.toUpperCase() || 'FREE'}</strong></span>
                                </div>
                                <span style={{ color: '#BDBDBD', fontSize: '0.8rem' }}>Desde {new Date(partner.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    onClick={() => openSubscriptionModal(partner)}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        background: 'rgba(59, 183, 126, 0.1)',
                                        color: '#3BB77E',
                                        border: 'none',
                                        borderRadius: '14px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 183, 126, 0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 183, 126, 0.1)'}
                                >
                                    <CreditCard size={18} />
                                    <span>Assinatura</span>
                                </button>

                                {partner.subscription && (
                                    <button
                                        onClick={() => handleTogglePause(partner)}
                                        style={{
                                            padding: '0.85rem',
                                            background: partner.subscription.status === 'suspended' ? '#3BB77E' : '#253D4E',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        title={partner.subscription.status === 'suspended' ? 'Ativar Acesso' : 'Suspender Acesso'}
                                    >
                                        {partner.subscription.status === 'suspended' ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
                                    </button>
                                )}

                                <button
                                    onClick={() => handleDelete(partner._id, partner.name)}
                                    style={{
                                        padding: '0.85rem',
                                        background: 'rgba(255, 107, 107, 0.1)',
                                        color: '#FF6B6B',
                                        border: 'none',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'}
                                    title="Remover Parceiro"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Subscription Modal */}
            {showSubscriptionModal && selectedPartner && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Gerenciar Assinatura</h2>
                            <button onClick={() => setShowSubscriptionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#666" />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ margin: 0, color: '#666' }}>Petshop: <strong>{selectedPartner.name}</strong></p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Plano</label>
                                <select
                                    value={subscriptionForm.plan}
                                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, plan: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="free">Free</option>
                                    <option value="basic">Basic</option>
                                    <option value="premium">Premium</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Status</label>
                                <select
                                    value={subscriptionForm.status}
                                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, status: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="active">Ativa</option>
                                    <option value="expired">Expirada</option>
                                    <option value="cancelled">Cancelada</option>
                                    <option value="pending">Pendente</option>
                                    <option value="suspended">Pausada</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Data de Vencimento</label>
                                <input
                                    type="date"
                                    value={subscriptionForm.endDate}
                                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setShowSubscriptionModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#f5f5f5',
                                        color: '#333',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveSubscription}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Check size={18} />
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
