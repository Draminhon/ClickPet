"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';

export default function EditProduct() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'food',
        image: '',
        discount: '0',
        productType: 'Produto',
        subCategory: 'Geral',
    });

    useEffect(() => {
        if (params.id) {
            fetch(`/api/products/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setFormData({
                        title: data.title,
                        description: data.description,
                        price: data.price.toString(),
                        category: data.category,
                        image: data.image || '',
                        discount: data.discount?.toString() || '0',
                        productType: data.productType || 'Produto',
                        subCategory: data.subCategory || 'Geral',
                    });
                });
        }
    }, [params.id]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/products/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast('Produto atualizado com sucesso!');
                router.push('/partner/catalog');
            } else {
                showToast('Erro ao atualizar produto', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao atualizar produto', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const res = await fetch(`/api/products/${params.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                showToast('Produto excluído com sucesso!');
                router.push('/partner/catalog');
            } else {
                showToast('Erro ao excluir produto', 'error');
            }
        } catch (error) {
            showToast('Erro ao excluir produto', 'error');
        }
    };

    const finalPrice = parseFloat(formData.price) * (1 - parseFloat(formData.discount) / 100);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/partner/catalog" style={{ display: 'flex', alignItems: 'center', color: '#666' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Editar Produto</h1>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tipo (ex: Ração)</label>
                        <input
                            type="text"
                            required
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.productType}
                            onChange={e => setFormData({ ...formData, productType: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Porte/Categoria (ex: Grande)</label>
                        <input
                            type="text"
                            required
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.subCategory}
                            onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                        />
                    </div>
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Desconto (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.discount}
                            onChange={e => setFormData({ ...formData, discount: e.target.value })}
                        />
                    </div>
                </div>

                {parseFloat(formData.discount) > 0 && (
                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #6CC551' }}>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.3rem' }}>Preço com desconto:</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6CC551' }}>
                            R$ {finalPrice.toFixed(2).replace('.', ',')}
                            <span style={{ fontSize: '0.9rem', color: '#999', textDecoration: 'line-through', marginLeft: '0.5rem' }}>
                                R$ {parseFloat(formData.price).toFixed(2).replace('.', ',')}
                            </span>
                        </p>
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        style={{ background: '#dc3545', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Excluir
                    </button>
                </div>
            </form>
        </div>
    );
}
