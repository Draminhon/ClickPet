"use client";

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import styles from './ProductModal.module.css';
import { useToast } from '@/context/ToastContext';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    partnerId: string;
    onSuccess: () => void;
}

export default function ProductModal({ isOpen, onClose, partnerId, onSuccess }: ProductModalProps) {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'food',
        image: '',
        productType: 'Produto',
        subCategory: 'Geral',
        discount: '0',
        weights: '',
        stock: '0',
        brand: '',
        sku: '',
        unit: 'un',
        isActive: true,
    });

    if (!isOpen) return null;

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
        setIsSaving(true);

        const weightsArray = formData.weights
            ? formData.weights.split(',').map(s => s.trim()).filter(s => s !== '')
            : [];

        const submitData = {
            ...formData,
            partnerId,
            weights: formData.category === 'food' ? weightsArray : []
        };

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (res.ok) {
                showToast('Produto criado com sucesso!');
                onSuccess();
                onClose();
            } else {
                showToast('Erro ao criar produto', 'error');
            }
        } catch (error) {
            showToast('Erro ao criar produto', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>NOVO PRODUTO</h2>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.divider} />
                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    <div className={styles.formContainer}>
                        {/* Left Side: Image */}
                        <div className={styles.imageColumn}>
                            <label className={styles.imageUploadLabel}>
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className={styles.imagePreview} />
                                ) : (
                                    <>
                                        <Upload size={32} color="#ccc" />
                                        <span className={styles.uploadIconText}>Foto</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                            </label>

                            <div className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <span className={styles.checkboxText}>Ativo</span>
                            </div>
                            <p className={styles.checkboxHint}>(Ocultar da loja se inativo)</p>
                        </div>

                        {/* Right Side: Form Fields */}
                        <div className={styles.fieldsColumn}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nome do Produto</label>
                                <input
                                    type="text"
                                    required
                                    className={styles.formInput}
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tipo (ex: Ração)</label>
                                    <input
                                        type="text"
                                        required
                                        className={styles.formInput}
                                        value={formData.productType}
                                        onChange={e => setFormData({ ...formData, productType: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Porte/Categoria</label>
                                    <input
                                        type="text"
                                        required
                                        className={styles.formInput}
                                        value={formData.subCategory}
                                        onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Preço (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className={styles.formInput}
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Desconto (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className={styles.formInput}
                                        value={formData.discount}
                                        onChange={e => setFormData({ ...formData, discount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Estoque</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className={styles.formInput}
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Unidade</label>
                                    <select
                                        className={styles.formInput}
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="un">Unidade (un)</option>
                                        <option value="kg">Quilograma (kg)</option>
                                        <option value="l">Litro (l)</option>
                                        <option value="pct">Pacote (pct)</option>
                                        <option value="cx">Caixa (cx)</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Categoria Global</label>
                                <select
                                    className={styles.formInput}
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

                            {formData.category === 'food' && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Pesos (kg) <span style={{fontSize: 10, color: '#999'}}>(ex: 1kg, 5kg)</span></label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={formData.weights}
                                        onChange={e => setFormData({ ...formData, weights: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Descrição</label>
                                <textarea
                                    required
                                    className={styles.formTextarea}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            
                            <button
                                type="submit"
                                className={styles.formSubmitBtn}
                                disabled={isSaving}
                            >
                                {isSaving ? 'SALVANDO...' : 'CRIAR PRODUTO'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
