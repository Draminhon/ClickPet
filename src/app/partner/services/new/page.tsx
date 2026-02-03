"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

export default function NewService() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'bath',
        duration: '',
        image: '',
        prices: [
            { size: 'small', price: '' },
            { size: 'medium', price: '' },
            { size: 'large', price: '' },
        ]
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                showToast('A imagem deve ter no máximo 1MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePriceChange = (index: number, field: string, value: string) => {
        const newPrices = [...formData.prices];
        newPrices[index] = { ...newPrices[index], [field]: value };
        setFormData({ ...formData, prices: newPrices });
    };

    const addPriceRow = () => {
        setFormData({
            ...formData,
            prices: [...formData.prices, { size: 'xlarge', price: '' }]
        });
    };

    const removePriceRow = (index: number) => {
        const newPrices = formData.prices.filter((_, i) => i !== index);
        setFormData({ ...formData, prices: newPrices });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast('Serviço criado com sucesso!');
                router.push('/partner/services');
            } else {
                showToast('Erro ao criar serviço', 'error');
            }
        } catch (error) {
            showToast('Erro ao criar serviço', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/partner/services" style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Novo Serviço</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '700px' }}>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <label style={{
                        width: '150px',
                        height: '150px',
                        border: '2px dashed #ddd',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {formData.image ? (
                            <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <>
                                <Upload size={32} color="#ccc" />
                                <span style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>Adicionar Foto</span>
                            </>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome do Serviço</label>
                    <input
                        type="text"
                        required
                        placeholder="Ex: Banho e Tosa Completo"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Descrição</label>
                    <textarea
                        required
                        placeholder="Descreva o que está incluído no serviço..."
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Categoria</label>
                        <select
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="bath">Banho</option>
                            <option value="grooming">Tosa</option>
                            <option value="veterinary">Veterinário</option>
                            <option value="training">Adestramento</option>
                            <option value="aquarismo">Aquarismo</option>
                            <option value="other">Outro</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Duração (min)</label>
                        <input
                            type="number"
                            placeholder="60"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.duration}
                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <label style={{ fontWeight: 500 }}>Preços por Porte</label>
                        <button type="button" onClick={addPriceRow} style={{ background: 'none', border: 'none', color: '#6CC551', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}>
                            <Plus size={16} /> Adicionar Porte
                        </button>
                    </div>

                    {formData.prices.map((priceItem, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.8rem', marginBottom: '0.8rem' }}>
                            <select
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={priceItem.size}
                                onChange={e => handlePriceChange(index, 'size', e.target.value)}
                            >
                                <option value="small">Pequeno</option>
                                <option value="medium">Médio</option>
                                <option value="large">Grande</option>
                                <option value="xlarge">Extra Grande</option>
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="Preço (R$)"
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={priceItem.price}
                                onChange={e => handlePriceChange(index, 'price', e.target.value)}
                            />
                            {formData.prices.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removePriceRow(index)}
                                    style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={loading}
                >
                    {loading ? 'Salvando...' : 'Salvar Serviço'}
                </button>
            </form>
        </div>
    );
}
