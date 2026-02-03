"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { AlertCircle, Truck, MapPin } from 'lucide-react';
import MapPicker from '@/components/ui/MapPicker';
import { maskZip } from '@/utils/masks';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, total, clearCart } = useCart();
    const { showToast } = useToast();

    // Group items by partnerId
    const itemsByPartner = items.reduce((acc: any, item) => {
        const pId = item.partnerId || 'unknown';
        if (!acc[pId]) acc[pId] = [];
        acc[pId].push(item);
        return acc;
    }, {});

    const partnerIds = Object.keys(itemsByPartner);

    const [address, setAddress] = useState({
        street: '',
        number: '',
        complement: '',
        city: '',
        zip: '',
        lat: '',
        lng: '',
    });
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupons, setAppliedCoupons] = useState<Array<{
        code: string;
        partnerId: string;
        discountPercent: number;
        amount: number;
        shopName: string;
    }>>([]);
    // Modified state to handle multiple partners
    const [partnerData, setPartnerData] = useState<Record<string, {
        deliveryFee: number;
        distance: number;
        minimumOrder: number;
        shopName: string;
        outOfRange?: boolean;
    }>>({});

    const [isPickup, setIsPickup] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (partnerIds.length > 0) {
            // Fetch partner minimum order values and names
            partnerIds.forEach(pId => {
                if (pId === 'unknown') return;
                fetch(`/api/products?partnerId=${pId}`)
                    .then(res => res.json())
                    .then(data => {
                        const partnerIdInfo = data[0]?.partnerId;
                        if (partnerIdInfo) {
                            setPartnerData(prev => ({
                                ...prev,
                                [pId]: {
                                    ...prev[pId],
                                    minimumOrder: partnerIdInfo.minimumOrderValue || 0,
                                    shopName: partnerIdInfo.name || itemsByPartner[pId][0].shopName,
                                    deliveryFee: prev[pId]?.deliveryFee || 0,
                                    distance: prev[pId]?.distance || 0,
                                }
                            }));
                        }
                    });
            });
        }
    }, [items]);

    useEffect(() => {
        // Calculate delivery fees when address changes
        if (address.lat && address.lng && partnerIds.length > 0 && !isPickup) {
            calculateAllDeliveryFees();
        } else if (isPickup) {
            setPartnerData(prev => {
                const newData = { ...prev };
                partnerIds.forEach(pId => {
                    if (newData[pId]) {
                        newData[pId].deliveryFee = 0;
                        newData[pId].distance = 0;
                    }
                });
                return newData;
            });
        }
    }, [address.lat, address.lng, total, appliedCoupons, isPickup]);

    const calculateAllDeliveryFees = async () => {
        for (const pId of partnerIds) {
            if (pId === 'unknown') continue;

            try {
                const partnerItems = itemsByPartner[pId];
                const partnerSubtotal = partnerItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                // Apply proportional discount if multiple shops? 
                // For simplicity, let's just use the subtotal for free delivery check

                const res = await fetch('/api/calculate-delivery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partnerId: pId,
                        customerLat: parseFloat(address.lat),
                        customerLng: parseFloat(address.lng),
                        orderTotal: partnerSubtotal,
                    }),
                });

                const data = await res.json();

                setPartnerData(prev => ({
                    ...prev,
                    [pId]: {
                        ...prev[pId],
                        deliveryFee: data.deliveryFee || 0,
                        distance: data.distance || 0,
                        outOfRange: data.outOfRange
                    }
                }));

                if (data.outOfRange) {
                    showToast(`A loja ${data.partnerName || 'parceira'} está fora do raio de entrega`, 'error');
                } else if (data.isFreeDelivery) {
                    showToast(`🎉 Frete grátis na loja ${data.partnerName || ''}!`);
                }
            } catch (error) {
                console.error(`Error calculating delivery fee for ${pId}:`, error);
            }
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;

        try {
            const res = await fetch(`/api/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, total })
            });
            const data = await res.json();

            if (res.ok && data.valid) {
                // Check if already applied
                if (appliedCoupons.some(c => c.code === data.code)) {
                    showToast('Este cupom já foi aplicado', 'error');
                    return;
                }

                // Find matching items for this partner
                const partnerItems = itemsByPartner[data.partnerId] || [];
                if (partnerItems.length === 0) {
                    showToast('Este cupom não se aplica a nenhum item no seu carrinho', 'error');
                    return;
                }

                const partnerSubtotal = partnerItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                const discountAmount = (partnerSubtotal * data.discount) / 100;

                setAppliedCoupons(prev => [...prev, {
                    code: data.code,
                    partnerId: data.partnerId,
                    discountPercent: data.discount,
                    amount: discountAmount,
                    shopName: partnerItems[0].shopName
                }]);
                setCouponCode('');
                showToast(`Cupom aplicado! ${data.discount}% de desconto na loja ${partnerItems[0].shopName}`);
            } else {
                showToast(data.message || 'Cupom inválido', 'error');
            }
        } catch (error) {
            showToast('Erro ao validar cupom', 'error');
        }
    };

    const handleRemoveCoupon = (code: string) => {
        setAppliedCoupons(prev => prev.filter(c => c.code !== code));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate each partner
        for (const pId of partnerIds) {
            const pInfo = partnerData[pId];
            const partnerItems = itemsByPartner[pId];
            const partnerSubtotal = partnerItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

            if (pId !== 'unknown' && pInfo?.outOfRange && !isPickup) {
                showToast(`Não é possível entregar itens da loja ${pInfo?.shopName || 'parceira'}`, 'error');
                return;
            }

            if (pId !== 'unknown' && partnerSubtotal < (pInfo?.minimumOrder || 0)) {
                showToast(`Subtotal da loja ${pInfo?.shopName || ''} (R$ ${partnerSubtotal.toFixed(2)}) é menor que o mínimo (R$ ${pInfo?.minimumOrder.toFixed(2)})`, 'error');
                return;
            }
        }

        if (!isPickup && (!address.street || !address.city)) {
            showToast('Preencha o endereço de entrega', 'error');
            return;
        }

        setLoading(true);

        try {
            // Submit separate orders for each partner
            const orderPromises = partnerIds.map(async (pId) => {
                const pInfo = partnerData[pId];
                const partnerItems = itemsByPartner[pId];
                const partnerSubtotal = partnerItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

                // Find coupon for this partner
                const partnerCoupon = appliedCoupons.find(c => c.partnerId === pId);
                const partnerDiscount = partnerCoupon ? partnerCoupon.amount : 0;

                const partnerDelivery = isPickup ? 0 : (pInfo?.deliveryFee || 0);
                const partnerTotal = partnerSubtotal - partnerDiscount + partnerDelivery;

                const orderPayload = {
                    items: partnerItems.map((item: any) => ({
                        ...item,
                        productId: item.id
                    })),
                    partnerId: pId === 'unknown' ? undefined : pId,
                    total: partnerTotal,
                    deliveryFee: partnerDelivery,
                    distance: pInfo?.distance || 0,
                    isPickup,
                    address: isPickup ? {} : {
                        ...address,
                        coordinates: address.lat && address.lng ? {
                            type: 'Point',
                            coordinates: [parseFloat(address.lng), parseFloat(address.lat)]
                        } : undefined,
                    },
                    coupon: partnerCoupon?.code || undefined,
                    discount: partnerDiscount,
                };

                return fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload),
                });
            });

            const results = await Promise.all(orderPromises);
            const allOk = results.every(res => res.ok);

            if (allOk) {
                showToast('Pedido(s) realizado(s) com sucesso!');
                clearCart();
                router.push('/orders');
            } else {
                showToast('Alguns pedidos falharam ao ser criados', 'error');
            }
        } catch (error) {
            showToast('Erro ao criar pedido', 'error');
        } finally {
            setLoading(false);
        }
    };

    const totalDiscount = appliedCoupons.reduce((sum, c) => sum + c.amount, 0);
    const totalDeliveryFee = Object.values(partnerData).reduce((sum, d) => sum + (isPickup ? 0 : d.deliveryFee), 0);
    const finalTotal = total - totalDiscount + totalDeliveryFee;

    const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();

            if (data.address) {
                setAddress(prev => ({
                    ...prev,
                    street: data.address.road || data.address.pedestrian || prev.street || '',
                    number: data.address.house_number || prev.number || '',
                    city: data.address.city || data.address.town || data.address.village || prev.city || '',
                    zip: data.address.postcode || prev.zip || '',
                    lat: lat.toString(),
                    lng: lng.toString()
                }));
                showToast('Endereço preenchido automaticamente!');
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        }
    };

    if (items.length === 0) {
        return (
            <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
                <p>Seu carrinho está vazio</p>
                <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Continuar Comprando
                </a>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 className="section-title">Finalizar Pedido</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Delivery Option */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Opção de Entrega</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem', border: !isPickup ? '2px solid #6CC551' : '1px solid #ddd', borderRadius: '8px', flex: 1, background: !isPickup ? '#e8f5e9' : 'white' }}>
                                <input
                                    type="radio"
                                    checked={!isPickup}
                                    onChange={() => setIsPickup(false)}
                                />
                                <Truck size={20} />
                                <span>Entrega</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem', border: isPickup ? '2px solid #6CC551' : '1px solid #ddd', borderRadius: '8px', flex: 1, background: isPickup ? '#e8f5e9' : 'white' }}>
                                <input
                                    type="radio"
                                    checked={isPickup}
                                    onChange={() => setIsPickup(true)}
                                />
                                <MapPin size={20} />
                                <span>Retirar na Loja</span>
                            </label>
                        </div>
                    </div>

                    {/* Address */}
                    {!isPickup && (
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Endereço de Entrega</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Rua</label>
                                    <input
                                        required
                                        placeholder="Nome da rua"
                                        value={address.street}
                                        onChange={e => setAddress({ ...address, street: e.target.value })}
                                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Número</label>
                                    <input
                                        type="text"
                                        required
                                        value={address.number}
                                        onChange={e => setAddress({ ...address, number: e.target.value })}
                                        placeholder="Ex: 123"
                                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Complemento</label>
                                    <input
                                        type="text"
                                        value={address.complement}
                                        onChange={e => setAddress({ ...address, complement: e.target.value })}
                                        placeholder="Apto, bloco, etc"
                                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Cidade</label>
                                    <input
                                        required
                                        placeholder="Cidade"
                                        value={address.city}
                                        onChange={e => setAddress({ ...address, city: e.target.value })}
                                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>CEP</label>
                                    <input
                                        required
                                        placeholder="CEP"
                                        value={address.zip}
                                        onChange={e => setAddress({ ...address, zip: maskZip(e.target.value) })}
                                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Localização no Mapa (opcional)</label>
                                <MapPicker
                                    lat={address.lat ? parseFloat(address.lat) : -23.550520}
                                    lng={address.lng ? parseFloat(address.lng) : -46.633308}
                                    onLocationChange={(lat: number, lng: number) => {
                                        setAddress(prev => ({
                                            ...prev,
                                            lat: lat.toString(),
                                            lng: lng.toString(),
                                        }));
                                        fetchAddressFromCoordinates(lat, lng);
                                    }}
                                    height="300px"
                                />
                                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                                    💡 Selecione sua localização no mapa para cálculo preciso da taxa de entrega
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Coupon */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Cupom de Desconto</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                placeholder="Código do cupom"
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <button
                                type="button"
                                onClick={handleApplyCoupon}
                                style={{ padding: '0.8rem 1.5rem', background: '#6CC551', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Aplicar
                            </button>
                        </div>

                        {/* Applied Coupons List */}
                        {appliedCoupons.length > 0 && (
                            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
                                {appliedCoupons.map((c) => (
                                    <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e8f5e9', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <strong style={{ color: '#2e7d32' }}>{c.code}</strong>
                                            <span style={{ marginLeft: '0.5rem', color: '#666' }}>({c.shopName}) - R$ {c.amount.toFixed(2)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCoupon(c.code)}
                                            style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Processando...' : 'Finalizar Pedido'}
                    </button>
                </form>

                {/* Summary */}
                <div>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Resumo do Pedido</h3>

                        {partnerIds.map((pId) => {
                            const pItems = itemsByPartner[pId];
                            const pInfo = partnerData[pId];
                            const pSubtotal = pItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                            const missing = (pInfo?.minimumOrder || 0) - pSubtotal;

                            return (
                                <div key={pId} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '0.8rem', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                        {pInfo?.shopName || 'Carregando...'}
                                    </h4>

                                    {pItems.map((item: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                            <span>{item.quantity}x {item.title}</span>
                                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}

                                    <div style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                                            <span>Subtotal loja</span>
                                            <span>R$ {pSubtotal.toFixed(2)}</span>
                                        </div>
                                        {!isPickup && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                                                <span>Frete {pInfo?.distance > 0 && `(${pInfo.distance.toFixed(1)}km)`}</span>
                                                <span>{pInfo?.deliveryFee === 0 ? 'Grátis' : `R$ ${pInfo?.deliveryFee.toFixed(2)}`}</span>
                                            </div>
                                        )}
                                    </div>

                                    {missing > 0 && (
                                        <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#fff3cd', borderRadius: '6px', fontSize: '0.8rem', color: '#856404' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                <AlertCircle size={16} />
                                                <strong>Mínimo: R$ {pInfo?.minimumOrder.toFixed(2)}</strong>
                                            </div>
                                            <p style={{ marginTop: '0.2rem' }}>Faltam R$ {missing.toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div style={{ padding: '0 1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Subtotal Geral</span>
                                <span>R$ {total.toFixed(2)}</span>
                            </div>

                            {appliedCoupons.length > 0 && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    {appliedCoupons.map(c => (
                                        <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', color: '#6CC551', fontSize: '0.9rem' }}>
                                            <span>Desconto ({c.shopName})</span>
                                            <span>- R$ {c.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isPickup && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Total Frete</span>
                                    <span>R$ {totalDeliveryFee.toFixed(2)}</span>
                                </div>
                            )}

                            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '2px solid #333' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
                                <span>Total Final</span>
                                <span>R$ {finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
