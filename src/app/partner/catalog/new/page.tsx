"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

export default function NewProduct() {
    const router = useRouter();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'food',
        image: '',
    });
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast('Produto criado com sucesso!');
                router.push('/partner/catalog');
            } else {
                showToast('Erro ao criar produto', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao criar produto', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/partner/catalog" style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Novo Produto</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '600px' }}>

                {/* Image Upload Preview */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome do Produto</label>
                    <input
                        type="text"
                        required
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Descrição</label>
                    <textarea
                        required
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Preço (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Categoria</label>
                        <select
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="food">Rações</option>
                            <option value="toys">Brinquedos</option>
                            <option value="pharma">Farmácia</option>
                            <option value="bath">Banho & Tosa</option>
                            <option value="vet">Veterinário</option>
                            <option value="pets">Pets</option>
                            <option value="aquarismo">Aquarismo</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={loading}
                >
                    {loading ? 'Salvando...' : 'Salvar Produto'}
                </button>
            </form>
        </div>
    );
}
