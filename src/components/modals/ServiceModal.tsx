"use client";

import { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import styles from './ServiceModal.module.css';
import { useToast } from '@/context/ToastContext';

interface PriceRow {
    size: string;
    price: string;
}

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    partnerId: string;
    onSuccess: () => void;
    service?: any;
}

export default function ServiceModal({ isOpen, onClose, partnerId, onSuccess, service }: ServiceModalProps) {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'bath',
        species: 'all',
        duration: '',
        image: '',
        prices: [
            { size: 'small', price: '' },
            { size: 'medium', price: '' },
            { size: 'large', price: '' },
        ] as PriceRow[]
    });
 
    useEffect(() => {
        if (isOpen && service) {
            setFormData({
                name: service.name || '',
                description: service.description || '',
                category: service.category || 'bath',
                species: service.species || 'all',
                duration: service.duration?.toString() || '',
                image: service.image || '',
                prices: service.prices && service.prices.length > 0
                    ? service.prices.map((p: any) => ({ size: p.size, price: p.price?.toString() || '' }))
                    : [
                        { size: 'small', price: '' },
                        { size: 'medium', price: '' },
                        { size: 'large', price: '' },
                    ] as PriceRow[]
            });
        } else if (isOpen && !service) {
            setFormData({
                name: '',
                description: '',
                category: 'bath',
                species: 'all',
                duration: '',
                image: '',
                prices: [
                    { size: 'small', price: '' },
                    { size: 'medium', price: '' },
                    { size: 'large', price: '' },
                ] as PriceRow[]
            });
        }
    }, [isOpen, service]);

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

    const handlePriceChange = (index: number, field: keyof PriceRow, value: string) => {
        const newPrices = [...formData.prices];
        newPrices[index] = { ...newPrices[index], [field]: value };
        setFormData({ ...formData, prices: newPrices });
    };

    const addPriceRow = () => {
        setFormData({
            ...formData,
            prices: [...formData.prices, { size: 'medium', price: '' }]
        });
    };

    const removePriceRow = (index: number) => {
        if (formData.prices.length > 1) {
            const newPrices = formData.prices.filter((_, i) => i !== index);
            setFormData({ ...formData, prices: newPrices });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Filter and format prices
        const formattedPrices = formData.prices
            .filter(p => p.price && p.price.trim() !== '')
            .map(p => ({
                size: p.size,
                price: Number(p.price)
            }));
 
        const submitData = {
            ...formData,
            partnerId,
            duration: formData.duration ? Number(formData.duration) : undefined,
            prices: formattedPrices,
            price: formattedPrices[0]?.price || 0
        };

        try {
            const res = await fetch(service?._id ? `/api/services/${service._id}` : '/api/services', {
                method: service?._id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (res.ok) {
                showToast(service?._id ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!');
                onSuccess();
                onClose();
            } else {
                showToast(service?._id ? 'Erro ao atualizar serviço' : 'Erro ao criar serviço', 'error');
            }
        } catch (error) {
            showToast(service?._id ? 'Erro ao atualizar serviço' : 'Erro ao criar serviço', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{service?._id ? 'EDITAR SERVIÇO' : 'NOVO SERVIÇO'}</h2>
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
                        </div>

                        {/* Right Side: Form Fields */}
                        <div className={styles.fieldsColumn}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nome do Serviço</label>
                                <input
                                    type="text"
                                    required
                                    className={styles.formInput}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Descrição</label>
                                <textarea
                                    required
                                    className={styles.formTextarea}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Categoria</label>
                                    <select
                                        className={styles.formInput}
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="bath">Banho</option>
                                        <option value="grooming">Tosa</option>
                                        <option value="veterinary">Veterinário</option>
                                        <option value="training">Adestramento</option>
                                        <option value="aquarismo">Aquarismo</option>
                                        <option value="daycare">Daycare/Creche</option>
                                        <option value="hotel">Hospedagem</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Espécie</label>
                                    <select
                                        className={styles.formInput}
                                        value={formData.species}
                                        onChange={e => setFormData({ ...formData, species: e.target.value })}
                                    >
                                        <option value="all">Todas</option>
                                        <option value="dog">Cão</option>
                                        <option value="cat">Gato</option>
                                        <option value="bird">Pássaro</option>
                                        <option value="fish">Peixe</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Duração (min)</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>

                            <div className={styles.priceSection}>
                                <div className={styles.priceHeader}>
                                    <label className={styles.formLabel}>Preços por Porte</label>
                                    <button type="button" onClick={addPriceRow} className={styles.addPriceBtn}>
                                        <Plus size={14} /> ADICIONAR
                                    </button>
                                </div>

                                {formData.prices.map((priceItem, index) => (
                                    <div key={index} className={styles.priceRow}>
                                        <select
                                            className={styles.formInput}
                                            value={priceItem.size}
                                            onChange={e => handlePriceChange(index, 'size', e.target.value)}
                                        >
                                            <option value="mini">Mini</option>
                                            <option value="small">Pequeno</option>
                                            <option value="medium">Médio</option>
                                            <option value="large">Grande</option>
                                            <option value="giant">Gigante</option>
                                        </select>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="Preço R$"
                                            className={styles.formInput}
                                            value={priceItem.price}
                                            onChange={e => handlePriceChange(index, 'price', e.target.value)}
                                        />
                                        {formData.prices.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removePriceRow(index)}
                                                className={styles.removePriceBtn}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <button
                                type="submit"
                                className={styles.formSubmitBtn}
                                disabled={isSaving}
                            >
                                {isSaving ? 'SALVANDO...' : (service?._id ? 'SALVAR ALTERAÇÕES' : 'CRIAR SERVIÇO')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
