"use client";

import { useEffect, useState } from 'react';
import { Search, MapPin, Phone, Mail, FileText, Trash2, CreditCard, X, Check, PauseCircle, PlayCircle } from 'lucide-react';

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
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionForm, setSubscriptionForm] = useState({
        plan: 'basic',
        status: 'active',
        endDate: '',
    });

    useEffect(() => {
        fetchPartners();
    }, [search]);

    const fetchPartners = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#333' }}>
                    Gerenciar Petshops
                </h1>
            </div>

            {/* Search */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou CNPJ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 3rem',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            fontSize: '1rem'
                        }}
                    />
                </div>
            </div>

            {/* Partners Grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <p>Carregando...</p>
                </div>
            ) : partners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    Nenhuma petshop encontrada
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {partners.map((partner) => (
                        <div key={partner._id} style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{partner.name}</h3>
                                {getStatusBadge(partner.subscription?.status)}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={16} color="#999" />
                                    <span>{partner.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={16} color="#999" />
                                    <span>{partner.cnpj}</span>
                                </div>
                                {partner.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Phone size={16} color="#999" />
                                        <span>{partner.phone}</span>
                                    </div>
                                )}
                                {partner.address && (
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                                        <MapPin size={16} color="#999" style={{ marginTop: '2px' }} />
                                        <span>
                                            {partner.address.street}, {partner.address.number}
                                            <br />
                                            {partner.address.city} - {partner.address.zip}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    <span style={{ color: '#666' }}>
                                        Plano: <strong>{partner.subscription?.plan ? partner.subscription.plan.charAt(0).toUpperCase() + partner.subscription.plan.slice(1) : '-'}</strong>
                                    </span>
                                    <span style={{ color: '#999' }}>
                                        Desde {new Date(partner.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => openSubscriptionModal(partner)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            background: '#E3F2FD',
                                            color: '#2196F3',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                        title={partner.subscription ? 'Editar Plano' : 'Adicionar Plano'}
                                    >
                                        <CreditCard size={16} />
                                    </button>

                                    {partner.subscription && (
                                        <button
                                            onClick={() => handleTogglePause(partner)}
                                            style={{
                                                padding: '0.5rem',
                                                background: partner.subscription.status === 'suspended' ? '#E8F5E9' : '#FFF8E1',
                                                color: partner.subscription.status === 'suspended' ? '#4CAF50' : '#FFC107',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title={partner.subscription.status === 'suspended' ? 'Retomar Acesso' : 'Pausar Acesso'}
                                        >
                                            {partner.subscription.status === 'suspended' ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(partner._id, partner.name)}
                                        style={{
                                            padding: '0.5rem',
                                            background: '#FFEBEE',
                                            color: '#F44336',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Excluir Petshop"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
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
