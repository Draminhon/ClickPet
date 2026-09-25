"use client";

import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import styles from './ProductModal.module.css';
import { useToast } from '@/context/ToastContext';
import { IMAGE_SIZE_LIMITS } from '@/lib/validation';
import ImageCropModal from './ImageCropModal';

// Sanity cap on the RAW source file before it's even loaded into the
// browser/canvas for cropping — this is about not choking on a huge file,
// not the real business limit (that's enforced below, after crop, against
// the actual encoded output).
const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_EXTRA_IMAGES = 4;
// Matches the product image aspect ratio used on the product detail page
// (mainImageContainer: 659x449) so what a partner crops here is what
// customers actually see, not a different ratio that gets re-cropped by CSS.
const PRODUCT_IMAGE_ASPECT = 659 / 449;

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    partnerId: string;
    onSuccess: () => void;
    product?: any;
}

export default function ProductModal({ isOpen, onClose, partnerId, onSuccess, product }: ProductModalProps) {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'food',
        image: '',
        images: [] as string[],
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
    // Raw (uncropped) image awaiting the crop step, and which field it's
    // headed for once confirmed.
    const [cropSource, setCropSource] = useState<string | null>(null);
    const [cropTarget, setCropTarget] = useState<'main' | 'extra' | null>(null);

    useEffect(() => {
        if (isOpen && product) {
            setFormData({
                title: product.title || '',
                description: product.description || '',
                price: product.price?.toString() || '',
                category: product.category || 'food',
                image: product.image || '',
                images: Array.isArray(product.images) ? product.images : [],
                productType: product.productType || 'Produto',
                subCategory: product.subCategory || 'Geral',
                discount: product.discount?.toString() || '0',
                weights: product.weights?.join(', ') || '',
                stock: product.stock?.toString() || '0',
                brand: product.brand || '',
                sku: product.sku || '',
                unit: product.unit || 'un',
                isActive: product.isActive !== undefined ? product.isActive : true,
            });
        } else if (isOpen && !product) {
            setFormData({
                title: '',
                description: '',
                price: '',
                category: 'food',
                image: '',
                images: [],
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
        }
    }, [isOpen, product]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Selecting a file never writes straight to formData — it goes through
    // the crop modal first. This closes a real race condition the old code
    // had: FileReader.readAsDataURL is async, so a fast click on "Criar
    // Produto" right after picking a file could submit before the reader's
    // onloadend fired, silently saving the product with no image at all.
    // Routing through an explicit crop-and-confirm step means nothing reaches
    // formData until the user deliberately confirms it.
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Apenas arquivos de imagem são aceitos', 'error');
            return;
        }
        if (file.size > MAX_SOURCE_FILE_BYTES) {
            showToast('Arquivo muito grande. Escolha uma imagem de até 15MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setCropSource(reader.result as string);
            setCropTarget('main');
        };
        reader.readAsDataURL(file);
    };

    const handleExtraImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (formData.images.length >= MAX_EXTRA_IMAGES) {
            showToast(`Você pode adicionar no máximo ${MAX_EXTRA_IMAGES} fotos adicionais`, 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('Apenas arquivos de imagem são aceitos', 'error');
            return;
        }
        if (file.size > MAX_SOURCE_FILE_BYTES) {
            showToast('Arquivo muito grande. Escolha uma imagem de até 15MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setCropSource(reader.result as string);
            setCropTarget('extra');
        };
        reader.readAsDataURL(file);
    };

    const removeExtraImage = (index: number) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    // ImageCropModal already enforces IMAGE_SIZE_LIMITS.ITEM_IMAGE_MAX_BYTES
    // itself (retrying at lower quality, then surfacing its own error) via
    // the `maxBytes` prop passed below — by the time this fires, the result
    // is guaranteed to pass the server's check too.
    const handleCropConfirm = (croppedImage: string) => {
        if (cropTarget === 'main') {
            setFormData(prev => ({ ...prev, image: croppedImage }));
        } else if (cropTarget === 'extra') {
            setFormData(prev => ({ ...prev, images: [...prev.images, croppedImage] }));
        }
        setCropSource(null);
        setCropTarget(null);
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
            images: formData.images,
            weights: formData.category === 'food' ? weightsArray : []
        };

        try {
            const res = await fetch(product?._id ? `/api/products/${product._id}` : '/api/products', {
                method: product?._id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (res.ok) {
                showToast(product?._id ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
                onSuccess();
                onClose();
            } else {
                // Surface the server's actual reason (e.g. an image still over
                // the size limit) instead of a generic message that hides why
                // it failed.
                const data = await res.json().catch(() => null);
                showToast(data?.message || (product?._id ? 'Erro ao atualizar produto' : 'Erro ao criar produto'), 'error');
            }
        } catch (error) {
            showToast(product?._id ? 'Erro ao atualizar produto' : 'Erro ao criar produto', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{product?._id ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</h2>
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

                            <div className={styles.extraImagesLabel}>Fotos adicionais</div>
                            <div className={styles.extraImagesRow}>
                                {formData.images.map((img, index) => (
                                    <div key={index} className={styles.extraImageThumb}>
                                        <img src={img} alt={`Foto ${index + 2}`} className={styles.extraImageThumbImg} />
                                        <button
                                            type="button"
                                            className={styles.extraImageRemoveBtn}
                                            onClick={() => removeExtraImage(index)}
                                            aria-label="Remover foto"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {formData.images.length < MAX_EXTRA_IMAGES && (
                                    <label className={styles.extraImageAddTile}>
                                        <Upload size={16} color="#ccc" />
                                        <input type="file" accept="image/*" onChange={handleExtraImageChange} style={{ display: 'none' }} />
                                    </label>
                                )}
                            </div>

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
                                {isSaving ? 'SALVANDO...' : (product?._id ? 'SALVAR ALTERAÇÕES' : 'CRIAR PRODUTO')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        {cropSource && (
            <ImageCropModal
                image={cropSource}
                aspect={PRODUCT_IMAGE_ASPECT}
                title={cropTarget === 'main' ? 'Ajustar foto principal' : 'Ajustar foto adicional'}
                maxBytes={IMAGE_SIZE_LIMITS.ITEM_IMAGE_MAX_BYTES}
                onClose={() => { setCropSource(null); setCropTarget(null); }}
                onConfirm={handleCropConfirm}
            />
        )}
        </>
    );
}
