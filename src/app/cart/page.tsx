"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import styles from './Cart.module.css';

export default function CartPage() {
    const router = useRouter();
    const { items, removeFromCart, updateQuantity, total } = useCart();
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
    const [discount, setDiscount] = useState(0);
    const [discountPercentage, setDiscountPercentage] = useState(0);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, total })
            });
            const data = await res.json();

            if (res.ok && data.valid) {
                let discountAmount: number;
                if (data.type === 'fixed') {
                    discountAmount = data.discount;
                } else {
                    discountAmount = (total * data.discount) / 100;
                    if (data.maxDiscount && discountAmount > data.maxDiscount) {
                        discountAmount = data.maxDiscount;
                    }
                }

                setDiscount(discountAmount);
                setDiscountPercentage(data.type === 'fixed' ? 0 : data.discount);
                setCouponMessage({ text: data.type === 'fixed'
                    ? `Cupom aplicado! Desconto de R$ ${discountAmount.toFixed(2)}`
                    : `Cupom aplicado com sucesso! (${data.discount}%)`, type: 'success' });
            } else {
                setDiscount(0);
                setDiscountPercentage(0);
                setCouponMessage({ text: data.message || 'Cupom inválido ou expirado.', type: 'error' });
            }
        } catch (error) {
            setDiscount(0);
            setDiscountPercentage(0);
            setCouponMessage({ text: 'Erro ao validar cupom.', type: 'error' });
        }
    };

    const finalTotal = total - discount;

    if (items.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className="container">
                    <h1 className="section-title">Seu Carrinho</h1>
                    <p style={{ color: '#666', marginBottom: '2rem' }}>Seu carrinho está vazio.</p>
                    <Link href="/" className="btn btn-primary">
                        <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} />
                        Voltar as compras
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className="section-title">Seu Carrinho</h1>

            <div className={styles.cartGrid}>
                <div className={styles.cartItemsContainer}>
                    {items.map((item, index) => (
                        <div key={item.id}>
                            <div className={styles.cartItem}>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className={styles.removeBtn}
                                    title="Remover item"
                                >
                                    <X size={16} />
                                </button>

                                <Image
                                    src={item.image || '/placeholder-product.png'}
                                    alt={item.title}
                                    width={100}
                                    height={100}
                                    className={styles.productImage}
                                />

                                <div className={styles.infoColumn}>
                                    <h3 className={styles.productTitle}>{item.title}</h3>

                                    <div className={styles.metaRow}>
                                        <span>{item.productType}</span>
                                        {item.selectedWeight && (
                                            <>
                                                <div className={styles.metaDivider} />
                                                <span>{item.selectedWeight}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className={styles.sizeBadge}>
                                        {item.subCategory}
                                    </div>
                                </div>

                                <div className={styles.priceColumn}>
                                    <div className={styles.unitPrice}>
                                        R$ {item.price.toFixed(2).replace('.', ',')}
                                    </div>

                                    <div className={styles.quantitySelector}>
                                        <button
                                            className={`${styles.qtyBtn} ${styles.qtyBtnMinus}`}
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className={styles.qtyValue}>{item.quantity}</span>
                                        <button
                                            className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`}
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    <div className={styles.totalPrice}>
                                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                    </div>
                                </div>
                            </div>

                            {index < items.length - 1 && (
                                <div className={styles.itemDivider} />
                            )}
                        </div>
                    ))}

                </div>

                <div className={styles.sidebar}>
                    <div className={styles.couponSection}>
                        <h3 className={styles.couponTitle}>Cupom</h3>
                        <div className={styles.couponInputArea}>
                            <div className={styles.couponInputContainer}>
                                <input
                                    type="text"
                                    className={styles.couponInput}
                                    placeholder="Insira o código"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                />
                            </div>
                            <button className={styles.couponApplyBtn} onClick={handleApplyCoupon}>
                                Aplicar
                            </button>
                        </div>
                        {couponMessage.text && (
                            <p className={`${styles.couponMessage} ${couponMessage.type === 'success' ? styles.success : styles.error}`}>
                                {couponMessage.text}
                            </p>
                        )}
                    </div>

                    <div className={styles.summary}>
                        <h3 className={styles.summaryTitle}>Resumo do Pedido</h3>
                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span style={{ color: '#3bb77e' }}>R$ {total.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span style={{ fontSize: '16px', color: '#253D4E' }}>Desconto</span>
                            <span style={{ fontSize: '16px', color: '#3bb77e' }}>
                                {discountPercentage.toString().padStart(2, '0')}%
                            </span>
                        </div>
                        {discount > 0 && (
                            <div className={styles.summaryRow}>
                                <span style={{ color: '#3bb77e' }}>Valor Desconto</span>
                                <span style={{ color: '#3bb77e' }}>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                            </div>
                        )}
                        <div className={styles.summaryRow} style={{ color: '#253D4E' }}>
                            <span>Frete</span>
                            <span style={{ color: '#3bb77e' }}>Grátis</span>
                        </div>
                        <div className={styles.summaryTotal}>
                            <span>Total</span>
                            <span style={{ color: '#3bb77e' }}>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                        </div>

                        <button
                            className={styles.checkoutBtn}
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (couponCode && discount > 0) {
                                    params.set('coupon', couponCode);
                                }
                                router.push(`/checkout${params.toString() ? '?' + params.toString() : ''}`);
                            }}
                        >
                            Finalizar Compra
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
