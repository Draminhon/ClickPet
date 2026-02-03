"use client";

import { useEffect, useState } from 'react';
import { Plus, Ticket, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function CouponsPage() {
    const { showToast } = useToast();
    const [coupons, setCoupons] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discount: '',
        minPurchase: '',
        maxUses: '',
        expiresAt: '',
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = () => {
        fetch('/api/coupons')
            .then(res => res.json())
            .then(data => setCoupons(data));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast('Cupom criado com sucesso!');
                setFormData({ code: '', discount: '', minPurchase: '', maxUses: '', expiresAt: '' });
                setShowForm(false);
                fetchCoupons();
            } else {
                const error = await res.json();
                showToast(error.message || 'Erro ao criar cupom', 'error');
            }
        } catch (error) {
            showToast('Erro ao criar cupom', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

        try {
            await fetch(`/api/coupons?id=${id}`, { method: 'DELETE' });
            showToast('Cupom excluído');
            fetchCoupons();
        } catch (error) {
            showToast('Erro ao excluir cupom', 'error');
        }
    };

    const isExpired = (date: string) => new Date(date) < new Date();

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Cupons de Desconto</h1>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Novo Cupom
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Código do Cupom</label>
                            <input
                                type="text"
                                required
                                placeholder="PRIMEIRACOMPRA"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', textTransform: 'uppercase' }}
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Desconto (%)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="100"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.discount}
                                onChange={e => setFormData({ ...formData, discount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Compra Mínima (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.minPurchase}
                                onChange={e => setFormData({ ...formData, minPurchase: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Usos Máximos</label>
                            <input
                                type="number"
                                placeholder="Ilimitado"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.maxUses}
                                onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Data de Expiração</label>
                            <input
                                type="date"
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.expiresAt}
                                onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Criar Cupom
                    </button>
                </form>
            )}

            {coupons.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <Ticket size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666' }}>Nenhum cupom cadastrado ainda.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {coupons.map(coupon => (
                        <div key={coupon._id} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6CC551', fontFamily: 'monospace' }}>{coupon.code}</h3>
                                    <span style={{ background: '#6CC551', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
                                        -{coupon.discount}%
                                    </span>
                                    {isExpired(coupon.expiresAt) && (
                                        <span style={{ background: '#dc3545', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                                            Expirado
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#666' }}>
                                    {coupon.minPurchase > 0 && <p>Mínimo: R$ {coupon.minPurchase.toFixed(2)}</p>}
                                    {coupon.maxUses && <p>Usos: {coupon.usedCount}/{coupon.maxUses}</p>}
                                    <p>Expira: {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(coupon._id)}
                                style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem', cursor: 'pointer' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
