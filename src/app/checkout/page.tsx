"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useLocation } from '@/context/LocationContext';
import { AlertCircle, Truck, MapPin, CreditCard, QrCode, Plus, User, Copy, Check, Loader2 } from 'lucide-react';
import MapPicker from '@/components/ui/MapPicker';
import CardForm, { CardFormData } from '@/components/payments/CardForm';
import { maskZip, formatAddress } from '@/utils/masks';
import styles from './Checkout.module.css';

interface SavedCard {
    _id: string;
    // NOT reliably unique per card — ASAAS's sandbox returns the same token
    // for a customer no matter which card is tokenized, so `_id` (the saved
    // row's own identity) is what selection/keys/delete use; `cardToken` is
    // only ever read at charge time, when we send it to create-billing.
    cardToken: string;
    lastFourDigits: string;
    brand: string;
    expirationMonth: number;
    expirationYear: number;
    cardholderName: string;
    addedAt?: string;
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { items, total, clearCart } = useCart();
    const { showToast } = useToast();
    const { setLocationManual } = useLocation();

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
    // The backend keeps one primary address (`user.address`) separate from a
    // list of additional ones (`user.deliveryAddresses`) — both need to be
    // shown together here, or the primary silently disappears whenever the
    // user also has secondary addresses saved.
    const [primaryAddress, setPrimaryAddress] = useState<any | null>(null);
    const [deliveryAddresses, setDeliveryAddresses] = useState<any[]>([]);
    const displayAddresses = primaryAddress ? [primaryAddress, ...deliveryAddresses] : deliveryAddresses;
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
    const [showMissingDocModal, setShowMissingDocModal] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
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
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao' | 'pix_cartao'>('pix_cartao');
    const [pointsBalance, setPointsBalance] = useState(0);
    const [usePoints, setUsePoints] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [userHasRequiredDocs, setUserHasRequiredDocs] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [createdOrders, setCreatedOrders] = useState<any[]>([]);

    // Transparent PIX checkout: QR code shown in-app, never redirects to the
    // gateway's hosted invoice page (which displays the ASAAS account holder's
    // own registered name/CNPJ, not "ClickPet").
    const [pixData, setPixData] = useState<{
        orderId: string;
        payload: string;
        qrCodeImage: string;
        expiresAt: string;
    } | null>(null);
    const [pixStatus, setPixStatus] = useState<'waiting' | 'paid' | 'expired'>('waiting');
    const [pixCopied, setPixCopied] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Card checkout ("Somente Cartão"): pick a previously-saved card (tokenized
    // via /api/payments/cards) or enter a new one inline with CardForm. Same
    // transparent-in-app philosophy as PIX above — never redirect to ASAAS's
    // hosted invoice page.
    const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
    const [cardsLoading, setCardsLoading] = useState(false);
    const [cardsLoaded, setCardsLoaded] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState<string | 'new' | null>(null);
    const [saveNewCard, setSaveNewCard] = useState(true);
    const [cardFormLoading, setCardFormLoading] = useState(false);

    // In-app "charging the card" modal — mirrors the PIX modal's states.
    const [cardChargeOrderId, setCardChargeOrderId] = useState<string | null>(null);
    const [cardChargeStatus, setCardChargeStatus] = useState<'processing' | 'polling' | 'success' | 'declined' | 'timeout' | null>(null);
    const [cardChargeError, setCardChargeError] = useState('');
    const cardPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Fetch user addresses from profile
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setUserHasRequiredDocs(!!data.cpf && !!data.phone);
                }
                
                const primary = data && data.address && data.address.street ? data.address : null;
                const secondary = data && Array.isArray(data.deliveryAddresses) ? data.deliveryAddresses : [];
                setPrimaryAddress(primary);
                setDeliveryAddresses(secondary);

                const combined = primary ? [primary, ...secondary] : secondary;
                if (combined.length > 0) {
                    setSelectedAddressIndex(0);
                    setAddress({
                        street: combined[0].street || '',
                        number: combined[0].number || '',
                        complement: combined[0].complement || '',
                        city: combined[0].city || '',
                        zip: combined[0].zip || '',
                        lat: combined[0].coordinates?.coordinates?.[1]?.toString() || '',
                        lng: combined[0].coordinates?.coordinates?.[0]?.toString() || '',
                    });
                }
            })
            .catch(err => console.error('Error fetching profile:', err));

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

        // Fetch loyalty points balance
        fetch('/api/loyalty')
            .then(res => res.json())
            .then(data => {
                if (data && data.account) {
                    setPointsBalance(data.account.totalPoints || 0);
                }
            })
            .catch(err => console.error('Error fetching loyalty balance:', err));
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

    const handleApplyCoupon = useCallback(async (codeOverride?: string) => {
        const code = codeOverride || couponCode;
        if (!code) return;
        
        try {
            // Loop through unique partners in cart to find one where the coupon is valid
            // This is more secure than global probe as it only checks stores the user is buying from
            let foundValid = false;
            let lastError = 'Cupom inválido para as lojas no seu carrinho';

            for (const pId of partnerIds) {
                if (foundValid) break;

                const res = await fetch(`/api/coupons/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        code, 
                        total: itemsByPartner[pId].reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0),
                        partnerId: pId 
                    })
                });
                const data = await res.json();

                if (res.ok && data.valid) {
                    foundValid = true;
                    // Check if already applied
                    if (appliedCoupons.some(c => c.code === data.code)) {
                        if (!codeOverride) showToast('Este cupom já foi aplicado', 'error');
                        return;
                    }

                    // Find matching items for this partner
                    const partnerItems = itemsByPartner[data.partnerId] || [];
                    const partnerSubtotal = partnerItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                    
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
                        discountPercent: data.discount,
                        amount: discountAmount,
                        shopName: partnerItems[0].shopName
                    }]);
                    setCouponCode('');
                    showToast(
                        data.type === 'fixed'
                            ? `Cupom aplicado! Desconto de R$ ${discountAmount.toFixed(2)} na loja ${partnerItems[0].shopName}`
                            : `Cupom aplicado! ${data.discount}% de desconto na loja ${partnerItems[0].shopName}`
                    );
                } else {
                    lastError = data.message || lastError;
                }
            }

            if (!foundValid) {
                showToast(lastError, 'error');
            }
        } catch (error) {
            showToast('Erro ao validar cupom', 'error');
        }
    }, [couponCode, total, appliedCoupons, itemsByPartner, showToast]);

    // Auto-apply coupon from URL (passed from Cart page)
    useEffect(() => {
        const urlCoupon = searchParams.get('coupon');
        if (urlCoupon && items.length > 0 && appliedCoupons.length === 0) {
            setCouponCode(urlCoupon.toUpperCase());
            // Small delay to ensure partner data is loaded
            const timer = setTimeout(() => {
                handleApplyCoupon(urlCoupon.toUpperCase());
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchParams, items]);

    const handleRemoveCoupon = (code: string) => {
        setAppliedCoupons(prev => prev.filter(c => c.code !== code));
    };

    // Poll payment status while the PIX modal is open; stop on paid/expired/unmount.
    useEffect(() => {
        if (!pixData || pixStatus !== 'waiting') return;

        const poll = async () => {
            try {
                const res = await fetch(`/api/payments/check-status?orderId=${pixData.orderId}`);
                const data = await res.json();
                if (data.status === 'PAID') {
                    setPixStatus('paid');
                    if (pollRef.current) clearInterval(pollRef.current);
                    clearCart();
                    setTimeout(() => router.push(`/payment/success?orderId=${pixData.orderId}`), 1200);
                }
            } catch (err) {
                console.error('PIX status poll error:', err instanceof Error ? err.message : err);
            }
        };

        poll();
        pollRef.current = setInterval(poll, 4000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [pixData, pixStatus, router, clearCart]);

    // Flip to "expired" once the PIX charge's expiration timestamp passes.
    useEffect(() => {
        if (!pixData || pixStatus !== 'waiting') return;
        const msLeft = new Date(pixData.expiresAt).getTime() - Date.now();
        if (msLeft <= 0) {
            setPixStatus('expired');
            return;
        }
        const timer = setTimeout(() => setPixStatus('expired'), msLeft);
        return () => clearTimeout(timer);
    }, [pixData, pixStatus]);

    // Fetch saved cards once the user picks "Somente Cartão" — no need to hit
    // this endpoint for PIX-only checkouts.
    useEffect(() => {
        if (paymentMethod !== 'cartao' || cardsLoaded) return;

        setCardsLoading(true);
        fetch('/api/payments/cards')
            .then(res => res.json())
            .then(data => {
                const cards: SavedCard[] = Array.isArray(data) ? data : [];
                setSavedCards(cards);
                setSelectedCardId(cards.length > 0 ? cards[0]._id : 'new');
            })
            .catch(err => {
                console.error('Error fetching saved cards:', err instanceof Error ? err.message : err);
                setSelectedCardId('new');
            })
            .finally(() => {
                setCardsLoading(false);
                setCardsLoaded(true);
            });
    }, [paymentMethod, cardsLoaded]);

    // Poll payment status while a card charge is under risk analysis
    // (AWAITING_RISK_ANALYSIS/PENDING) — same pattern as the PIX poll above,
    // just capped at ~60s since a card charge that stays unresolved that long
    // is unusual and shouldn't poll forever.
    useEffect(() => {
        if (!cardChargeOrderId || cardChargeStatus !== 'polling') return;

        const startedAt = Date.now();
        const POLL_TIMEOUT_MS = 60000;

        const poll = async () => {
            try {
                const res = await fetch(`/api/payments/check-status?orderId=${cardChargeOrderId}`);
                const data = await res.json();
                if (data.status === 'PAID') {
                    setCardChargeStatus('success');
                    if (cardPollRef.current) clearInterval(cardPollRef.current);
                    clearCart();
                    setTimeout(() => router.push(`/payment/success?orderId=${cardChargeOrderId}`), 1200);
                    return;
                }
                if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
                    setCardChargeStatus('timeout');
                    if (cardPollRef.current) clearInterval(cardPollRef.current);
                }
            } catch (err) {
                console.error('Card status poll error:', err instanceof Error ? err.message : err);
            }
        };

        poll();
        cardPollRef.current = setInterval(poll, 4000);
        return () => {
            if (cardPollRef.current) clearInterval(cardPollRef.current);
        };
    }, [cardChargeOrderId, cardChargeStatus, router, clearCart]);

    const handleCopyPixCode = async () => {
        if (!pixData) return;
        try {
            await navigator.clipboard.writeText(pixData.payload);
            setPixCopied(true);
            setTimeout(() => setPixCopied(false), 2500);
        } catch {
            showToast('Não foi possível copiar automaticamente. Selecione o código manualmente.', 'error');
        }
    };

    // Shared validation + order-creation preamble. Used by the main "Pagar e
    // Finalizar Pedido" button (PIX / a saved card) AND by the inline
    // CardForm's own submit button (brand-new card) — both need an order to
    // exist before they can call create-billing, and re-clicking either one
    // after a failed billing attempt must reuse the same order rather than
    // creating a duplicate.
    const prepareOrders = async (): Promise<any[] | null> => {
        if (!userHasRequiredDocs) {
            setShowMissingDocModal(true);
            return null;
        }

        // Validate each partner
        for (const pId of partnerIds) {
            const pInfo = partnerData[pId];
            const partnerItems = itemsByPartner[pId];
            const partnerSubtotal = partnerItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

            if (pId !== 'unknown' && pInfo?.outOfRange && !isPickup) {
                showToast(`Não é possível entregar itens da loja ${pInfo?.shopName || 'parceira'}`, 'error');
                return null;
            }

            if (pId !== 'unknown' && partnerSubtotal < (pInfo?.minimumOrder || 0)) {
                showToast(`Subtotal da loja ${pInfo?.shopName || ''} (R$ ${partnerSubtotal.toFixed(2)}) é menor que o mínimo (R$ ${pInfo?.minimumOrder.toFixed(2)})`, 'error');
                return null;
            }
        }

        if (!isPickup && (!address.street || !address.city)) {
            showToast('Preencha o endereço de entrega', 'error');
            return null;
        }

        if (createdOrders.length > 0) {
            return createdOrders;
        }

        try {
            const orderResults: any[] = [];
            for (const pId of partnerIds) {
                const pInfo = partnerData[pId];
                const partnerItems = itemsByPartner[pId];
                const partnerSubtotal = partnerItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

                // Find coupon for this partner
                const partnerCoupon = appliedCoupons.find(c => c.partnerId === pId);
                const partnerDiscount = partnerCoupon ? partnerCoupon.amount : 0;

                const partnerDelivery = isPickup ? 0 : (pInfo?.deliveryFee || 0);
                const partnerTotal = partnerSubtotal - partnerDiscount + partnerDelivery;

                const orderPayload: any = {
                    items: partnerItems.map((item: any) => ({
                        ...item,
                        productId: item.id
                    })),
                    partnerId: pId === 'unknown' ? undefined : pId,
                    total: partnerTotal,
                    deliveryFee: partnerDelivery,
                    distance: pInfo?.distance || 0,
                    isPickup,
                    paymentMethod,
                    address: isPickup ? {} : {
                        ...address,
                        coordinates: address.lat && address.lng ? {
                            type: 'Point',
                            coordinates: [parseFloat(address.lng), parseFloat(address.lat)]
                        } : undefined,
                    },
                    coupon: partnerCoupon?.code || undefined,
                    discount: partnerDiscount,
                    // If multiple partners, we only apply points to the FIRST order to be simple
                    pointsRedeemed: (orderResults.length === 0 && usePoints) ? pointsToRedeem : 0,
                };

                const orderRes = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload),
                });

                if (!orderRes.ok) {
                    setErrorMessage('Houve um problema ao criar seu pedido. Por favor, tente novamente.');
                    setShowErrorModal(true);
                    return null;
                }

                const orderData = await orderRes.json();
                orderResults.push(orderData);
            }
            setCreatedOrders(orderResults);
            return orderResults;
        } catch (error) {
            console.error('Checkout error:', error);
            setErrorMessage('Ocorreu um erro ao processar sua compra.');
            setShowErrorModal(true);
            return null;
        }
    };

    // Charges a saved-card token synchronously via create-billing and drives
    // the in-app card modal through its three possible outcomes: paid right
    // away, declined outright (route throws → non-ok response), or still
    // resolving (AWAITING_RISK_ANALYSIS/PENDING) — in which case we poll
    // check-status, same as PIX does.
    const chargeWithCard = async (orderId: string, cardToken: string) => {
        setCardChargeOrderId(orderId);
        setCardChargeStatus('processing');
        setCardChargeError('');

        try {
            const res = await fetch('/api/payments/create-billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, cardToken }),
            });
            const data = await res.json();

            if (!res.ok) {
                setCardChargeStatus('declined');
                setCardChargeError(data.message || 'Pagamento recusado. Verifique os dados do cartão ou tente outro cartão.');
                return;
            }

            if (data.paid) {
                setCardChargeStatus('success');
                clearCart();
                setTimeout(() => router.push(`/payment/success?orderId=${orderId}`), 1200);
                return;
            }

            // Not declined, not yet confirmed (e.g. AWAITING_RISK_ANALYSIS/PENDING).
            setCardChargeStatus('polling');
        } catch (err) {
            console.error('Card charge error:', err instanceof Error ? err.message : err);
            setCardChargeStatus('declined');
            setCardChargeError('Houve uma falha ao comunicar-se com o gateway de pagamento.');
        }
    };

    // Main submit button: PIX / PIX-ou-Cartão (unchanged in-app PIX flow), or
    // "Somente Cartão" with an already-selected saved card. Entering a brand
    // new card is handled separately by CardForm's own submit button below
    // (see handleNewCardSubmit) since ASAAS can only charge a token — the
    // card has to be tokenized before create-billing can even be called.
    const handleSubmit = async () => {
        if (paymentMethod === 'cartao' && selectedCardId === 'new') {
            showToast('Preencha os dados do novo cartão para continuar.', 'error');
            return;
        }

        setLoading(true);
        try {
            const orderResults = await prepareOrders();
            if (!orderResults) return;
            const mainOrder = orderResults[0];

            if (paymentMethod === 'cartao') {
                const selectedCard = savedCards.find(c => c._id === selectedCardId);
                if (!selectedCard) {
                    showToast('Selecione um cartão para continuar.', 'error');
                    return;
                }
                await chargeWithCard(mainOrder._id, selectedCard.cardToken);
                return;
            }

            try {
                const billingRes = await fetch('/api/payments/create-billing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: mainOrder._id }),
                });

                const billingData = await billingRes.json();

                if (billingRes.ok && billingData.pix) {
                    // PIX: stay in-app and show the QR code/copia-e-cola instead of
                    // redirecting to the gateway's hosted invoice page.
                    setPixData({
                        orderId: mainOrder._id,
                        payload: billingData.pix.payload,
                        qrCodeImage: billingData.pix.qrCodeImage,
                        expiresAt: billingData.pix.expiresAt,
                    });
                    setPixStatus('waiting');
                } else if (billingRes.status === 400 && billingData.message && (billingData.message.includes('CPF') || billingData.message.includes('CNPJ'))) {
                    setShowMissingDocModal(true);
                } else {
                    console.error('Billing error:', billingRes.status, billingData);
                    setErrorMessage(billingData.message || 'Houve um erro ao processar o seu pagamento.');
                    setShowErrorModal(true);
                }
            } catch (billingError) {
                console.error('Billing error:', billingError instanceof Error ? billingError.message : billingError);
                setErrorMessage('Houve uma falha ao comunicar-se com o gateway de pagamento.');
                setShowErrorModal(true);
            }
        } finally {
            setLoading(false);
        }
    };

    // CardForm's own submit button (brand new card, no saved token yet):
    // tokenizes the card first (mandatory — ASAAS only charges via a saved
    // token, there's no one-off transparent card charge in this API), then
    // charges it. If the user didn't want it kept for next time, the
    // freshly-created token is deleted right after the charge attempt.
    const handleNewCardSubmit = async (data: CardFormData) => {
        setCardFormLoading(true);
        try {
            const orderResults = await prepareOrders();
            if (!orderResults) return;
            const mainOrder = orderResults[0];

            const tokenizeRes = await fetch('/api/payments/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const tokenizeData = await tokenizeRes.json();

            if (!tokenizeRes.ok) {
                showToast(tokenizeData.message || 'Não foi possível salvar o cartão.', 'error');
                return;
            }

            const updatedCards: SavedCard[] = Array.isArray(tokenizeData) ? tokenizeData : [];
            setSavedCards(updatedCards);
            const newCard = updatedCards[updatedCards.length - 1];
            if (!newCard) {
                showToast('Não foi possível processar o cartão.', 'error');
                return;
            }

            if (saveNewCard) {
                setSelectedCardId(newCard._id);
            }

            await chargeWithCard(mainOrder._id, newCard.cardToken);

            // Tokenizing was mandatory regardless of the checkbox — if the user
            // didn't actually want it kept on file, remove it now rather than
            // leaving an unwanted card saved to their account. Deleted by its
            // own `_id`, not `cardToken` — the token alone can't tell this row
            // apart from another saved card that happens to share it.
            if (!saveNewCard) {
                fetch(`/api/payments/cards/${newCard._id}`, { method: 'DELETE' }).catch(err => {
                    console.error('Error removing non-saved card:', err instanceof Error ? err.message : err);
                });
            }
        } catch (err) {
            console.error('New card checkout error:', err instanceof Error ? err.message : err);
            showToast('Ocorreu um erro ao processar o pagamento.', 'error');
        } finally {
            setCardFormLoading(false);
        }
    };

    const totalDiscount = appliedCoupons.reduce((sum, c) => sum + c.amount, 0);
    const totalDeliveryFee = Object.values(partnerData).reduce((sum, d) => sum + (isPickup ? 0 : d.deliveryFee), 0);
    const pointsDiscount = usePoints ? (pointsToRedeem * 0.1) : 0;
    const finalTotal = total - totalDiscount - pointsDiscount + totalDeliveryFee;

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

    const handleSelectAddress = (idx: number) => {
        setSelectedAddressIndex(idx);
        const addr = displayAddresses[idx];
        setAddress({
            street: addr.street || '',
            number: addr.number || '',
            complement: addr.complement || '',
            city: addr.city || '',
            zip: addr.zip || '',
            lat: addr.coordinates?.coordinates?.[1]?.toString() || '',
            lng: addr.coordinates?.coordinates?.[0]?.toString() || '',
        });
        setShowAddressForm(false);
    };

    const handleSaveNewAddress = async () => {
        if (!address.street || !address.city || !address.zip) {
            showToast('Preencha os campos obrigatórios primeiro', 'error');
            return;
        }

        try {
            const formData = {
                street: address.street,
                number: address.number,
                complement: address.complement,
                neighborhood: '',
                city: address.city,
                state: '',
                zip: address.zip,
                coordinates: {
                    type: 'Point',
                    coordinates: [parseFloat(address.lng || '0'), parseFloat(address.lat || '0')]
                }
            };

            // The first address ever saved becomes the primary (`user.address`);
            // every one after that goes into the secondary `deliveryAddresses`
            // list — mirrors how /profile saves addresses, so the two stay
            // in the same shape on the backend.
            const hasPrimary = !!primaryAddress;
            const payload: any = hasPrimary
                ? { deliveryAddresses: [...deliveryAddresses, formData] }
                : { address: formData };

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (hasPrimary) {
                    const updatedSecondary = [...deliveryAddresses, formData];
                    setDeliveryAddresses(updatedSecondary);
                    setSelectedAddressIndex(updatedSecondary.length); // last in [primary, ...secondary]
                } else {
                    setPrimaryAddress(formData);
                    setSelectedAddressIndex(0);
                }
                setShowAddressForm(false);
                showToast('Endereço adicionado aos seus locais!');

                // Update LocationContext top bar immediately if this is the primary address
                if (!hasPrimary) {
                    setLocationManual(
                        parseFloat(address.lat || '0') || 0,
                        parseFloat(address.lng || '0') || 0,
                        formatAddress(address.street, address.number),
                        address.city
                    );
                }
            } else {
                showToast('Erro ao salvar endereço', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro interno', 'error');
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
        <div className={`container ${styles.checkoutContainer}`}>
            <h1 className="section-title">Finalizar Pedido</h1>

            <div className={styles.checkoutGrid}>
                {/*
                    Not a native <form>: CardForm below (used for the "enter a
                    new card" step) renders its own <form>, and nesting a
                    <form> inside a <form> is invalid HTML that browsers won't
                    reliably submit correctly. Submission is instead driven
                    explicitly by the "Pagar e Finalizar Pedido" button's
                    onClick (and, for a brand-new card, by CardForm's own
                    submit button — see handleNewCardSubmit).
                */}
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Delivery Option */}
                    <div className={styles.checkoutCard}>
                        <h3 className={styles.cardTitle}>Opção de Entrega</h3>
                        <div className={styles.deliverySelectorArea}>
                            <label className={`${styles.deliveryLabel} ${!isPickup ? styles.deliveryLabelActive : ''}`}>
                                <input
                                    type="radio"
                                    checked={!isPickup}
                                    onChange={() => setIsPickup(false)}
                                    className={styles.addressInputRadio}
                                />
                                <Truck size={22} color={!isPickup ? '#3BB77E' : '#9CA3AF'} />
                                <span className={`${styles.deliveryLabelText} ${!isPickup ? styles.deliveryLabelTextActive : ''}`}>Entrega</span>
                            </label>
                            <label className={`${styles.deliveryLabel} ${isPickup ? styles.deliveryLabelActive : ''}`}>
                                <input
                                    type="radio"
                                    checked={isPickup}
                                    onChange={() => setIsPickup(true)}
                                    className={styles.addressInputRadio}
                                />
                                <MapPin size={22} color={isPickup ? '#3BB77E' : '#9CA3AF'} />
                                <span className={`${styles.deliveryLabelText} ${isPickup ? styles.deliveryLabelTextActive : ''}`}>Retirar na Loja</span>
                            </label>
                        </div>
                    </div>

                    {/* Address UI Block */}
                    {!isPickup && (
                        <div className={styles.checkoutCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>Local de Entrega</h3>
                                {displayAddresses.length > 0 && !showAddressForm && (
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddressForm(true)}
                                        className={styles.addAddressButton}
                                    >
                                        <Plus size={16} /> Adicionar Endereço
                                    </button>
                                )}
                            </div>

                            {displayAddresses.length === 0 && !showAddressForm && (
                                <div className={styles.addressEmptyState}>
                                    <MapPin size={40} className={styles.addressEmptyIcon} />
                                    <p className={styles.addressEmptyText}>
                                        Você ainda não possui nenhum endereço para entrega salvo.
                                    </p>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddressForm(true)}
                                        className={styles.addressEmptyBtn}
                                    >
                                        Cadastrar Meu Endereço
                                    </button>
                                </div>
                            )}

                            {displayAddresses.length > 0 && !showAddressForm && (
                                <div className={styles.addressList}>
                                    {displayAddresses.map((addr, idx) => (
                                        <label key={idx} className={`${styles.addressLabel} ${selectedAddressIndex === idx ? styles.addressLabelActive : ''}`}>
                                            <input 
                                                type="radio" 
                                                name="selectedAddress" 
                                                checked={selectedAddressIndex === idx} 
                                                onChange={() => handleSelectAddress(idx)}
                                                className={styles.addressInputRadio}
                                            />
                                            <div className={styles.addressCardContent}>
                                                <div className={styles.addressCardTitle}>
                                                    {addr.street}, {addr.number}
                                                    {idx === 0 && <span className={styles.addressBadgePrimary}>Principal</span>}
                                                </div>
                                                <div className={styles.addressCardSubtitle}>{addr.neighborhood} - {addr.city}/{addr.state}</div>
                                                <div className={styles.addressCardZip}>CEP: {maskZip(addr.zip)} {addr.complement ? `| Cpl: ${addr.complement}` : ''}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                            
                            {showAddressForm && (
                                <div className={styles.newAddressForm}>
                                    <div className={styles.newAddressFormHeader}>
                                        <h4 className={styles.newAddressFormTitle}>Novo Endereço</h4>
                                        {displayAddresses.length > 0 && (
                                            <button type="button" onClick={() => setShowAddressForm(false)} className={styles.cancelFormBtn}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>

                                    <div className={styles.addressFormGrid3}>
                                        <div>
                                            <label className={styles.addressFieldLabel}>Rua</label>
                                            <input
                                                required
                                                placeholder="Nome da rua"
                                                value={address.street}
                                                onChange={e => setAddress({ ...address, street: e.target.value })}
                                                className={styles.addressFieldInput}
                                            />
                                        </div>
                                        <div>
                                            <label className={styles.addressFieldLabel}>Número</label>
                                            <input
                                                type="text"
                                                required
                                                value={address.number}
                                                onChange={e => setAddress({ ...address, number: e.target.value })}
                                                placeholder="Ex: 123"
                                                className={styles.addressFieldInput}
                                            />
                                        </div>
                                        <div>
                                            <label className={styles.addressFieldLabel}>Complemento</label>
                                            <input
                                                type="text"
                                                value={address.complement}
                                                onChange={e => setAddress({ ...address, complement: e.target.value })}
                                                placeholder="Apto, bloco"
                                                className={styles.addressFieldInput}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.addressFormGrid2}>
                                        <div>
                                            <label className={styles.addressFieldLabel}>Cidade</label>
                                            <input
                                                required
                                                placeholder="Sua cidade"
                                                value={address.city}
                                                onChange={e => setAddress({ ...address, city: e.target.value })}
                                                className={styles.addressFieldInput}
                                            />
                                        </div>
                                        <div>
                                            <label className={styles.addressFieldLabel}>CEP</label>
                                            <input
                                                required
                                                placeholder="00000-000"
                                                value={address.zip}
                                                onChange={e => setAddress({ ...address, zip: maskZip(e.target.value) })}
                                                className={styles.addressFieldInput}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.mapWrapper}>
                                        <label className={styles.mapLabel}>
                                            <MapPin size={18} color="#3BB77E" /> Localização no Mapa (Recomendado)
                                        </label>
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
                                            height="250px"
                                        />
                                        <p className={styles.mapHint}>
                                            <AlertCircle size={14} /> Confirme o pino exato para evitar erros no cálculo do frete.
                                        </p>
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        onClick={handleSaveNewAddress} 
                                        className={styles.saveNewAddressBtn}
                                    >
                                        Salvar e Utilizar Este Endereço
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Loyalty Points */}
                    {pointsBalance > 0 && (
                        <div className={styles.checkoutCard}>
                            <div className={styles.loyaltyTitleArea}>
                                <h3 className={styles.cardTitle}>Pontos de Fidelidade</h3>
                                <span className={styles.loyaltyBadge}>
                                    {pointsBalance} disponíveis
                                </span>
                            </div>

                            <div className={styles.loyaltySliderContainer}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={usePoints}
                                        onChange={(e) => {
                                            setUsePoints(e.target.checked);
                                            if (e.target.checked) {
                                                // Default to using all points up to 100% of subtotal
                                                setPointsToRedeem(Math.min(pointsBalance, Math.floor((total * 10))));
                                            }
                                        }}
                                        style={{ width: '20px', height: '20px', accentColor: '#3BB77E' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: '#253D4E' }}>Usar meus pontos para desconto</div>
                                        <div style={{ fontSize: '0.85rem', color: '#7E8D9E' }}>Cada 10 pontos equivalem a R$ 1,00 de desconto</div>
                                    </div>
                                </label>

                                {usePoints && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                        <input
                                            type="range"
                                            min="10"
                                            max={pointsBalance}
                                            step="10"
                                            value={pointsToRedeem}
                                            onChange={(e) => setPointsToRedeem(parseInt(e.target.value))}
                                            style={{ width: '100%', accentColor: '#3BB77E', marginBottom: '0.6rem' }}
                                        />
                                        <div className={styles.loyaltyResultRow}>
                                            <span style={{ color: '#7E8D9E', fontWeight: 500 }}>Resgatando: <span style={{ color: '#253D4E', fontWeight: 700 }}>{pointsToRedeem} pontos</span></span>
                                            <span style={{ color: '#3BB77E' }}>- R$ {(pointsToRedeem * 0.1).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Coupon */}
                    <div className={styles.checkoutCard}>
                        <h3 className={styles.cardTitle}>Cupom de Desconto</h3>
                        <div className={styles.couponInputArea}>
                            <input
                                placeholder="Digite seu código"
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                className={styles.couponInput}
                            />
                            <button
                                type="button"
                                onClick={() => handleApplyCoupon()}
                                className={styles.couponBtn}
                            >
                                Aplicar
                            </button>
                        </div>

                        {/* Applied Coupons List */}
                        {appliedCoupons.length > 0 && (
                            <div style={{ marginTop: '1.2rem', display: 'grid', gap: '0.6rem' }}>
                                {appliedCoupons.map((c) => (
                                    <div key={c.code} className={styles.couponItem}>
                                        <div style={{ fontSize: '0.95rem' }}>
                                            <strong style={{ color: '#2d9063' }}>{c.code}</strong>
                                            <span style={{ marginLeft: '0.5rem', color: '#4B5563' }}>({c.shopName}) - R$ {c.amount.toFixed(2)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCoupon(c.code)}
                                            className={styles.couponRemoveBtn}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Method Selection */}
                    <div className={styles.checkoutCard}>
                        <h3 className={styles.cardTitle}>Método de Pagamento</h3>
                        <div className={styles.paymentSelectorArea}>
                            <label className={`${styles.paymentLabel} ${paymentMethod === 'pix_cartao' ? styles.paymentLabelActive : ''}`}>
                                <input type="radio" checked={paymentMethod === 'pix_cartao'} onChange={() => setPaymentMethod('pix_cartao')} className={styles.addressInputRadio}/>
                                <QrCode size={20} color={paymentMethod === 'pix_cartao' ? '#3BB77E' : '#6B7280'}/>
                                <CreditCard size={20} color={paymentMethod === 'pix_cartao' ? '#3BB77E' : '#6B7280'}/>
                                <span className={`${styles.paymentLabelText} ${paymentMethod === 'pix_cartao' ? styles.paymentLabelTextActive : ''}`}>PIX ou Cartão</span>
                            </label>
                            <label className={`${styles.paymentLabel} ${paymentMethod === 'pix' ? styles.paymentLabelActive : ''}`}>
                                <input type="radio" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className={styles.addressInputRadio}/>
                                <QrCode size={20} color={paymentMethod === 'pix' ? '#3BB77E' : '#6B7280'}/>
                                <span className={`${styles.paymentLabelText} ${paymentMethod === 'pix' ? styles.paymentLabelTextActive : ''}`}>Somente PIX</span>
                            </label>
                            <label className={`${styles.paymentLabel} ${paymentMethod === 'cartao' ? styles.paymentLabelActive : ''}`}>
                                <input type="radio" checked={paymentMethod === 'cartao'} onChange={() => setPaymentMethod('cartao')} className={styles.addressInputRadio}/>
                                <CreditCard size={20} color={paymentMethod === 'cartao' ? '#3BB77E' : '#6B7280'}/>
                                <span className={`${styles.paymentLabelText} ${paymentMethod === 'cartao' ? styles.paymentLabelTextActive : ''}`}>Somente Cartão</span>
                            </label>
                        </div>

                        {paymentMethod === 'cartao' && (
                            <div className={styles.cardPaymentArea}>
                                {cardsLoading && (
                                    <p className={styles.cardsLoadingText}>Carregando seus cartões...</p>
                                )}

                                {!cardsLoading && savedCards.length > 0 && selectedCardId !== 'new' && (
                                    <div className={styles.addressList}>
                                        {savedCards.map((card) => (
                                            <label
                                                key={card._id}
                                                className={`${styles.addressLabel} ${selectedCardId === card._id ? styles.addressLabelActive : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="selectedCard"
                                                    checked={selectedCardId === card._id}
                                                    onChange={() => setSelectedCardId(card._id)}
                                                    className={styles.addressInputRadio}
                                                />
                                                <div className={styles.addressCardContent}>
                                                    <div className={styles.addressCardTitle}>
                                                        {card.brand || 'Cartão'} •••• {card.lastFourDigits}
                                                    </div>
                                                    <div className={styles.addressCardSubtitle}>{card.cardholderName}</div>
                                                    <div className={styles.addressCardZip}>
                                                        Validade {String(card.expirationMonth).padStart(2, '0')}/{String(card.expirationYear).slice(-2)}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCardId('new')}
                                            className={styles.addAddressButton}
                                        >
                                            <Plus size={16} /> Usar novo cartão
                                        </button>
                                    </div>
                                )}

                                {!cardsLoading && (savedCards.length === 0 || selectedCardId === 'new') && (
                                    <div className={styles.newAddressForm}>
                                        <div className={styles.newAddressFormHeader}>
                                            <h4 className={styles.newAddressFormTitle}>Novo Cartão</h4>
                                            {savedCards.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCardId(savedCards[0]._id)}
                                                    className={styles.cancelFormBtn}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>

                                        <CardForm
                                            onSubmit={handleNewCardSubmit}
                                            submitLabel="Pagar com este cartão"
                                            loading={cardFormLoading}
                                        />

                                        <label className={styles.saveCardCheckboxRow}>
                                            <input
                                                type="checkbox"
                                                checked={saveNewCard}
                                                onChange={(e) => setSaveNewCard(e.target.checked)}
                                                className={styles.addressInputRadio}
                                            />
                                            <span>Salvar cartão para próximas compras</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || (paymentMethod === 'cartao' && selectedCardId === 'new')}
                        className={styles.submitCheckoutBtn}
                    >
                        {loading
                            ? 'Preparando Integração Segura...'
                            : (paymentMethod === 'cartao' && selectedCardId === 'new')
                                ? 'Preencha os dados do cartão acima'
                                : 'Pagar e Finalizar Pedido'}
                    </button>
                </div>

                {/* Summary */}
                <div>
                    <div className={styles.summaryCard}>
                        <h3 className={styles.cardTitle} style={{ marginBottom: '1.5rem' }}>Resumo do Pedido</h3>

                        {partnerIds.map((pId) => {
                            const pItems = itemsByPartner[pId];
                            const pInfo = partnerData[pId];
                            const pSubtotal = pItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                            const missing = (pInfo?.minimumOrder || 0) - pSubtotal;

                            return (
                                <div key={pId} className={styles.partnerSummaryCard}>
                                    <h4 className={styles.partnerShopTitle}>
                                        {pInfo?.shopName || 'Carregando...'}
                                    </h4>

                                    {pItems.map((item: any, idx: number) => (
                                        <div key={idx} className={styles.summaryItemRow}>
                                            <span className={styles.summaryItemTitle}>{item.quantity}x {item.title}</span>
                                            <span className={styles.summaryItemPrice}>R$ {(item.price * item.quantity).toFixed(2)}</span>
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

                        <div className={styles.summaryTotalsContainer}>
                            <div className={styles.summaryTotalRow}>
                                <span>Subtotal Geral</span>
                                <span>R$ {total.toFixed(2)}</span>
                            </div>

                            {appliedCoupons.length > 0 && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    {appliedCoupons.map(c => (
                                        <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', color: '#3BB77E', fontSize: '0.95rem', fontWeight: 500 }}>
                                            <span>Desconto ({c.shopName})</span>
                                            <span>- R$ {c.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isPickup && (
                                <div className={styles.summaryTotalRow}>
                                    <span>Total Frete</span>
                                    <span>R$ {totalDeliveryFee.toFixed(2)}</span>
                                </div>
                            )}

                            {usePoints && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#3BB77E', fontSize: '0.95rem', fontWeight: 500 }}>
                                    <span>Pontos ({pointsToRedeem} pts)</span>
                                    <span>- R$ {pointsDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            <hr style={{ margin: '1.2rem 0', border: 'none', borderTop: '2px solid #E5E7EB' }} />

                            <div className={styles.summaryTotalFinalRow}>
                                <span>Total Final</span>
                                <span style={{ color: '#3BB77E' }}>R$ {finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PIX Modal (transparent checkout — never leaves ClickPet) */}
            {pixData && (
                <div className={styles.modalOverlay}>
                    <div className={styles.pixModalCard}>
                        {pixStatus === 'paid' ? (
                            <>
                                <div className={styles.pixSuccessIconWrapper}>
                                    <Check size={32} />
                                </div>
                                <h2 className={styles.modalTitle}>Pagamento confirmado!</h2>
                                <p className={styles.modalDesc}>Redirecionando...</p>
                            </>
                        ) : pixStatus === 'expired' ? (
                            <>
                                <div className={styles.modalIconWrapper}>
                                    <AlertCircle size={32} />
                                </div>
                                <h2 className={styles.modalTitle}>QR Code expirado</h2>
                                <p className={styles.modalDesc}>
                                    O tempo para pagamento deste PIX acabou. Gere um novo código para continuar.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setPixData(null); setPixStatus('waiting'); }}
                                    className={styles.modalActionBtn}
                                >
                                    Gerar novo QR Code
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className={styles.modalTitle}>Pague com PIX</h2>
                                <p className={styles.modalDesc}>
                                    Escaneie o QR Code no app do seu banco ou copie o código abaixo.
                                </p>

                                {pixData.qrCodeImage && (
                                    <img
                                        src={`data:image/png;base64,${pixData.qrCodeImage}`}
                                        alt="QR Code PIX"
                                        className={styles.pixQrImage}
                                    />
                                )}

                                <div className={styles.pixCodeBox}>
                                    <span className={styles.pixCodeText}>{pixData.payload}</span>
                                </div>

                                <button type="button" onClick={handleCopyPixCode} className={styles.pixCopyBtn}>
                                    {pixCopied ? <Check size={18} /> : <Copy size={18} />}
                                    {pixCopied ? 'Código copiado!' : 'Copiar código PIX'}
                                </button>

                                <div className={styles.pixWaitingRow}>
                                    <Loader2 size={16} className={styles.pixSpinner} />
                                    Aguardando confirmação do pagamento...
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setPixData(null); setPixStatus('waiting'); }}
                                    className={styles.modalCancelBtn}
                                >
                                    Cancelar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Card Charge Modal (transparent checkout — never leaves ClickPet) */}
            {cardChargeStatus && (
                <div className={styles.modalOverlay}>
                    <div className={styles.pixModalCard}>
                        {cardChargeStatus === 'success' ? (
                            <>
                                <div className={styles.pixSuccessIconWrapper}>
                                    <Check size={32} />
                                </div>
                                <h2 className={styles.modalTitle}>Pagamento aprovado!</h2>
                                <p className={styles.modalDesc}>Redirecionando...</p>
                            </>
                        ) : cardChargeStatus === 'declined' ? (
                            <>
                                <div className={styles.modalIconWrapper}>
                                    <AlertCircle size={32} />
                                </div>
                                <h2 className={styles.modalTitle}>Pagamento não aprovado</h2>
                                <p className={styles.modalDesc}>
                                    {cardChargeError || 'O pagamento foi recusado pela operadora do cartão. Verifique os dados ou tente outro cartão.'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setCardChargeStatus(null); setCardChargeOrderId(null); }}
                                    className={styles.modalActionBtn}
                                >
                                    Tentar novamente
                                </button>
                            </>
                        ) : cardChargeStatus === 'timeout' ? (
                            <>
                                <div className={styles.modalIconWrapper}>
                                    <AlertCircle size={32} />
                                </div>
                                <h2 className={styles.modalTitle}>Ainda estamos confirmando</h2>
                                <p className={styles.modalDesc}>
                                    Seu pagamento está em análise e pode levar mais alguns minutos para ser confirmado.
                                    Você pode acompanhar o status do seu pedido em "Meus Pedidos".
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setCardChargeStatus(null); setCardChargeOrderId(null); router.push('/orders'); }}
                                    className={styles.modalActionBtn}
                                >
                                    Ver meus pedidos
                                </button>
                            </>
                        ) : (
                            <>
                                <div className={styles.cardProcessingIconWrapper}>
                                    <Loader2 size={32} className={styles.pixSpinner} />
                                </div>
                                <h2 className={styles.modalTitle}>Processando pagamento...</h2>
                                <p className={styles.modalDesc}>
                                    {cardChargeStatus === 'polling'
                                        ? 'Estamos confirmando seu pagamento com a operadora do cartão. Isso pode levar alguns instantes.'
                                        : 'Não feche esta janela enquanto processamos o pagamento do seu cartão.'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Missing Document Modal */}
            {showMissingDocModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <div className={styles.modalIconWrapper}>
                            <User size={32} />
                        </div>
                        <h2 className={styles.modalTitle}>Falta um detalhe!</h2>
                        <p className={styles.modalDesc}>
                            Para prosseguirmos de forma segura e gerarmos o pagamento, exigimos que você <strong>informe seu CPF e Telefone</strong> no seu perfil.
                        </p>
                        <button 
                            type="button"
                            onClick={() => router.push('/profile')}
                            className={styles.modalActionBtn}
                        >
                            Ir para Meu Perfil
                        </button>
                        <button 
                            type="button"
                            onClick={() => setShowMissingDocModal(false)}
                            className={styles.modalCancelBtn}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <div className={styles.modalIconWrapper}>
                            <AlertCircle size={32} />
                        </div>
                        <h2 className={styles.modalTitle}>Ops, ocorreu um erro!</h2>
                        <p className={styles.modalDesc}>
                            Ocorreu um problema ao processar seu pagamento. Por favor, tente novamente dentro de alguns instantes.
                        </p>
                        <button 
                            type="button"
                            onClick={() => setShowErrorModal(false)}
                            className={styles.modalActionBtn}
                            style={{ background: '#EF4444', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem' }}>Carregando dados do checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
