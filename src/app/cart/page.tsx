"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import styles from './Cart.module.css';

interface AppliedCoupon {
    code: string;
    partnerId: string;
    type: 'fixed' | 'percentage';
    discountPercent: number;
    amount: number;
    shopName: string;
}

export default function CartPage() {
    const router = useRouter();
    const { items, removeFromCart, updateQuantity, total } = useCart();
    const { lat, lng } = useLocation();
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
    const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
    const [partnerDeliveryFees, setPartnerDeliveryFees] = useState<Record<string, number>>({});
    const [deliveryLoading, setDeliveryLoading] = useState(false);

    // Cart items can belong to multiple shops, and both coupons and delivery
    // fees are scoped to a single partner — group by partnerId so each can be
    // resolved per shop, the same way checkout/page.tsx does it.
    const itemsByPartner = items.reduce((acc: Record<string, CartItem[]>, item) => {
        const pId = item.partnerId || 'unknown';
        if (!acc[pId]) acc[pId] = [];
        acc[pId].push(item);
        return acc;
    }, {});
    const partnerIds = Object.keys(itemsByPartner);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;

        if (appliedCoupons.some(c => c.code === couponCode.toUpperCase())) {
            setCouponMessage({ text: 'Este cupom já foi aplicado.', type: 'error' });
            return;
        }

        try {
            // A coupon is scoped to one partner, so probe each shop in the cart
            // and stop at the first one where it validates.
            let foundValid = false;
            let lastError = 'Cupom inválido ou expirado.';

            for (const pId of partnerIds) {
                if (pId === 'unknown' || foundValid) continue;

                const partnerItems = itemsByPartner[pId];
                const partnerSubtotal = partnerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

                const res = await fetch('/api/coupons/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: couponCode, total: partnerSubtotal, partnerId: pId })
                });
                const data = await res.json();

                if (res.ok && data.valid) {
                    foundValid = true;

                    let discountAmount: number;
                    if (data.type === 'fixed') {
                        discountAmount = data.discount;
                    } else {
                        discountAmount = (partnerSubtotal * data.discount) / 100;
                        if (data.maxDiscount && discountAmount > data.maxDiscount) {
                            discountAmount = data.maxDiscount;
                        }
                    }

                    setAppliedCoupons(prev => [...prev, {
                        code: data.code,
                        partnerId: data.partnerId,
                        type: data.type,
                        discountPercent: data.type === 'fixed' ? 0 : data.discount,
                        amount: discountAmount,
                        shopName: partnerItems[0].shopName,
                    }]);
                    setCouponCode('');
                    setCouponMessage({
                        text: data.type === 'fixed'
                            ? `Cupom aplicado! Desconto de R$ ${discountAmount.toFixed(2)} na loja ${partnerItems[0].shopName}`
                            : `Cupom aplicado! ${data.discount}% de desconto na loja ${partnerItems[0].shopName}`,
                        type: 'success'
                    });
                } else {
                    lastError = data.message || lastError;
                }
            }

            if (!foundValid) {
                setCouponMessage({ text: lastError, type: 'error' });
            }
        } catch (error) {
            setCouponMessage({ text: 'Erro ao validar cupom.', type: 'error' });
        }
    };

    const handleRemoveCoupon = (code: string) => {
        setAppliedCoupons(prev => prev.filter(c => c.code !== code));
    };

    // Real, per-partner delivery estimate (mirrors checkout's
    // calculateAllDeliveryFees) so this page never has to guess or lie about
    // shipping cost — only shown once the user has a known location.
    const calculateAllDeliveryFees = useCallback(async () => {
        if (!lat || !lng) return;

        setDeliveryLoading(true);
        try {
            const entries = await Promise.all(
                partnerIds.filter(pId => pId !== 'unknown').map(async (pId) => {
                    const partnerItems = itemsByPartner[pId];
                    const partnerSubtotal = partnerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

                    try {
                        const res = await fetch('/api/calculate-delivery', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                partnerId: pId,
                                customerLat: lat,
                                customerLng: lng,
                                orderTotal: partnerSubtotal,
                            }),
                        });
                        const data = await res.json();
                        return [pId, data.deliveryFee || 0] as const;
                    } catch {
                        return [pId, 0] as const;
                    }
                })
            );
            setPartnerDeliveryFees(Object.fromEntries(entries));
        } finally {
            setDeliveryLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lat, lng, items]);

    useEffect(() => {
        if (lat && lng && partnerIds.length > 0) {
            calculateAllDeliveryFees();
        } else {
            setPartnerDeliveryFees({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lat, lng, items]);

    const discount = appliedCoupons.reduce((sum, c) => sum + c.amount, 0);
    const hasLocation = !!(lat && lng);
    const estimatedDeliveryFee = Object.values(partnerDeliveryFees).reduce((sum, fee) => sum + fee, 0);
    const finalTotal = total - discount + (hasLocation ? estimatedDeliveryFee : 0);

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
                        {appliedCoupons.length > 0 && (
                            <div className={styles.appliedCouponsList}>
                                {appliedCoupons.map((c) => (
                                    <div key={c.code} className={styles.appliedCouponItem}>
                                        <span className={styles.appliedCouponInfo}>
                                            <strong>{c.code}</strong> ({c.shopName}) - R$ {c.amount.toFixed(2).replace('.', ',')}
                                        </span>
                                        <button
                                            className={styles.appliedCouponRemoveBtn}
                                            onClick={() => handleRemoveCoupon(c.code)}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.summary}>
                        <h3 className={styles.summaryTitle}>Resumo do Pedido</h3>
                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span style={{ color: '#3bb77e' }}>R$ {total.toFixed(2).replace('.', ',')}</span>
                        </div>
                        {discount > 0 && (
                            <div className={styles.summaryRow}>
                                <span style={{ color: '#3bb77e' }}>Valor Desconto</span>
                                <span style={{ color: '#3bb77e' }}>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                            </div>
                        )}
                        <div className={styles.summaryRow} style={{ color: '#253D4E' }}>
                            <span>Frete</span>
                            {!hasLocation ? (
                                <span style={{ color: '#8897AD' }}>Calculado no checkout</span>
                            ) : deliveryLoading ? (
                                <span style={{ color: '#8897AD' }}>Calculando...</span>
                            ) : estimatedDeliveryFee === 0 ? (
                                <span style={{ color: '#3bb77e' }}>Grátis</span>
                            ) : (
                                <span>Estimado: R$ {estimatedDeliveryFee.toFixed(2).replace('.', ',')}</span>
                            )}
                        </div>
                        <div className={styles.summaryTotal}>
                            <span>Total</span>
                            <span style={{ color: '#3bb77e' }}>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                        </div>

                        <button
                            className={styles.checkoutBtn}
                            onClick={() => {
                                const params = new URLSearchParams();
                                // Checkout's own auto-apply effect only supports a single
                                // coupon code from the URL today, so when multiple
                                // per-shop coupons were applied here, only the first is
                                // forwarded automatically — the rest can be reapplied on
                                // the checkout page itself.
                                if (appliedCoupons.length > 0) {
                                    params.set('coupon', appliedCoupons[0].code);
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
