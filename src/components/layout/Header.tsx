"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, User, Bell, X, MapPin, ChevronDown, Package, UserCircle, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { useLocation } from '@/context/LocationContext';
import MapPicker from '@/components/ui/MapPicker';
import styles from './Header.module.css';

export default function Header() {
    const { count } = useCart();
    const { data: session } = useSession();
    const { showToast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const { address, setLocationFromGPS } = useLocation();
    
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [userAddress, setUserAddress] = useState<any>(null);
    const [userImage, setUserImage] = useState<string | null>(null);

    const [addressForm, setAddressForm] = useState({
        street: '',
        number: '',
        complement: '',
        city: '',
        zip: '',
        lat: '',
        lng: '',
    });

    useEffect(() => {
        if (session) {
            fetchUserAddress();
        }
    }, [session]);

    const fetchUserAddress = () => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => {
                setUserAddress(data.address);
                setUserImage(data.image || null);
                if (data.address) {
                    setAddressForm({
                        street: data.address.street || '',
                        number: data.address.number || '',
                        complement: data.address.complement || '',
                        city: data.address.city || '',
                        zip: data.address.zip || '',
                        lat: data.address.coordinates?.coordinates?.[1]?.toString() || '',
                        lng: data.address.coordinates?.coordinates?.[0]?.toString() || '',
                    });
                }
            })
            .catch(() => { });
    };

    const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();

            if (data.address) {
                setAddressForm(prev => ({
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

    const handleSaveAddress = async () => {
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: {
                        street: addressForm.street,
                        number: addressForm.number,
                        complement: addressForm.complement,
                        city: addressForm.city,
                        zip: addressForm.zip,
                        coordinates: {
                            type: 'Point',
                            coordinates: [parseFloat(addressForm.lng), parseFloat(addressForm.lat)]
                        }
                    }
                }),
            });

            if (res.ok) {
                showToast('Endereço atualizado com sucesso!');
                setShowAddressModal(false);
                fetchUserAddress();
            } else {
                showToast('Erro ao atualizar endereço', 'error');
            }
        } catch (error) {
            showToast('Erro ao atualizar endereço', 'error');
        }
    };

    const getProfileLink = () => {
        if (!session) return '/login';
        if (session.user.role === 'admin') return '/admin';
        return session.user.role === 'partner' ? '/partner/dashboard' : '/profile';
    };

    return (
        <>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        ClickPet.
                    </Link>

                    {/* Center: Location (Only when logged in) */}
                    {session && (
                        <div 
                            className={styles.locationGroup} 
                            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                        >
                            <MapPin color="#EC802B" size={18} strokeWidth={2.5} />
                            <div className={styles.verticalDivider} />
                            <span className={styles.locationText}>
                                {address || "Adicionar localização"}
                            </span>
                            <ChevronDown color="#272727" size={16} strokeWidth={2} style={{ width: '6px', height: '6px', transform: 'scale(2.5)' }} />

                            {showLocationDropdown && (
                                <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                            setLocationFromGPS();
                                            setShowLocationDropdown(false);
                                        }}
                                    >
                                        📍 Usar localização atual
                                    </button>
                                    <button 
                                        className={styles.dropdownItem}
                                        onClick={() => {
                                            setShowAddressModal(true);
                                            setShowLocationDropdown(false);
                                        }}
                                    >
                                        ➕ Editar/Adicionar endereço
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Right Actions */}
                    <div className={styles.headerActions}>
                        {session ? (
                            <>
                                {/* Logged in: notifications, cart, profile */}
                                <Link href="/notifications" className={styles.notificationWrapper}>
                                    <Bell className={styles.notificationIcon} size={24} />
                                </Link>

                                <Link href="/cart" className={styles.cartWrapper}>
                                    <ShoppingCart className={styles.cartIcon} size={24} />
                                    {count > 0 && (
                                        <span className={styles.badge}>{count}</span>
                                    )}
                                </Link>

                                <div 
                                    className={styles.profileMenuWrapper}
                                    onMouseEnter={() => setShowProfileDropdown(true)}
                                    onMouseLeave={() => setShowProfileDropdown(false)}
                                >
                                    <div
                                        className={styles.profileCircle}
                                        onClick={() => router.push(getProfileLink())}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {userImage ? (
                                            <Image
                                                src={userImage}
                                                alt="Profile"
                                                width={40}
                                                height={40}
                                                className={styles.headerAvatar}
                                            />
                                        ) : (
                                            <User className={styles.profileIcon} size={22} />
                                        )}
                                    </div>

                                    {showProfileDropdown && (
                                        <div className={styles.profileDropdown}>
                                            <button 
                                                className={styles.dropdownItem}
                                                onClick={() => {
                                                    router.push(getProfileLink());
                                                    setShowProfileDropdown(false);
                                                }}
                                            >
                                                <UserCircle size={18} color="#272727" />
                                                Ver Perfil
                                            </button>
                                            <button 
                                                className={styles.dropdownItem}
                                                onClick={() => {
                                                    router.push('/orders');
                                                    setShowProfileDropdown(false);
                                                }}
                                            >
                                                <Package size={18} color="#272727" />
                                                Meus Pedidos
                                            </button>
                                            <div className={styles.dropdownDivider} />
                                            <button 
                                                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                                                onClick={() => {
                                                    signOut({ callbackUrl: '/' });
                                                    setShowProfileDropdown(false);
                                                }}
                                            >
                                                <LogOut size={18} color="#FF3B30" />
                                                Sair
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Not logged in: Criar Conta + Entrar */}
                                <Link href="/register" className={styles.createAccountBtn}>
                                    Criar Conta
                                </Link>

                                <Link href="/login" className={styles.enterBtn}>
                                    Entrar
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Address Edit Modal */}
            {showAddressModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem',
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative',
                    }}>
                        <button
                            onClick={() => setShowAddressModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                            }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                            Editar Endereço
                        </h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Rua</label>
                                    <input
                                        value={addressForm.street}
                                        onChange={e => setAddressForm({ ...addressForm, street: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Número</label>
                                    <input
                                        value={addressForm.number}
                                        onChange={e => setAddressForm({ ...addressForm, number: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Complemento</label>
                                    <input
                                        value={addressForm.complement}
                                        onChange={e => setAddressForm({ ...addressForm, complement: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cidade</label>
                                    <input
                                        value={addressForm.city}
                                        onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>CEP</label>
                                    <input
                                        value={addressForm.zip}
                                        onChange={e => setAddressForm({ ...addressForm, zip: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Localização no Mapa (opcional)
                                </label>
                                <MapPicker
                                    lat={!isNaN(parseFloat(addressForm.lat)) ? parseFloat(addressForm.lat) : -23.550520}
                                    lng={!isNaN(parseFloat(addressForm.lng)) ? parseFloat(addressForm.lng) : -46.633308}
                                    onLocationChange={(lat: number, lng: number) => {
                                        setAddressForm(prev => ({
                                            ...prev,
                                            lat: lat.toString(),
                                            lng: lng.toString(),
                                        }));
                                        fetchAddressFromCoordinates(lat, lng);
                                    }}
                                    height="300px"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setShowAddressModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        background: '#f0f0f0',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveAddress}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Salvar Endereço
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
