"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, User, Bell, X, MapPin, ChevronDown, Package, UserCircle, LogOut, Edit2, Trash2, Plus } from 'lucide-react';
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
    const { address, setLocationFromGPS, setLocationManual } = useLocation();
    
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [userAddress, setUserAddress] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = new or primary, -1 = new, 0+ = deliveryAddresses index

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
                setUserProfile(data);
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

    const handleSelectAddress = async (selectedAddr: any, isPrimary: boolean, index?: number) => {
        try {
            // Update context first for immediate UI update
            const coords = selectedAddr.coordinates?.coordinates;
            setLocationManual(
                coords?.[1] || 0,
                coords?.[0] || 0,
                `${selectedAddr.street}${selectedAddr.number ? `, ${selectedAddr.number}` : ""}`,
                selectedAddr.city || ""
            );

            // If it was already primary, just close
            if (isPrimary) {
                setShowLocationDropdown(false);
                return;
            }

            // Swap: move current primary to deliveryAddresses, and selected to primary
            const newDeliveryAddresses = [...(userProfile?.deliveryAddresses || [])];
            const oldPrimary = { ...userProfile.address };
            
            if (index !== undefined) {
                newDeliveryAddresses.splice(index, 1);
            }
            newDeliveryAddresses.push(oldPrimary);

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: selectedAddr,
                    deliveryAddresses: newDeliveryAddresses
                }),
            });

            if (res.ok) {
                showToast('Endereço alterado!');
                fetchUserAddress();
                setShowLocationDropdown(false);
            }
        } catch (error) {
            showToast('Erro ao trocar endereço', 'error');
        }
    };

    const handleDeleteAddress = async (index: number) => {
        if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
        
        try {
            const newAddresses = [...(userProfile?.deliveryAddresses || [])];
            newAddresses.splice(index, 1);

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliveryAddresses: newAddresses }),
            });

            if (res.ok) {
                showToast('Endereço excluído');
                fetchUserAddress();
            }
        } catch (error) {
            showToast('Erro ao excluir endereço', 'error');
        }
    };

    const handleEditAddress = (addr: any, index: number | null) => {
        setEditingIndex(index);
        setAddressForm({
            street: addr.street || '',
            number: addr.number || '',
            complement: addr.complement || '',
            city: addr.city || '',
            zip: addr.zip || '',
            lat: addr.coordinates?.coordinates?.[1]?.toString() || '',
            lng: addr.coordinates?.coordinates?.[0]?.toString() || '',
        });
        setShowAddressModal(true);
        setShowLocationDropdown(false);
    };

    const handleSaveAddress = async () => {
        try {
            const newAddr = {
                street: addressForm.street,
                number: addressForm.number,
                complement: addressForm.complement,
                city: addressForm.city,
                zip: addressForm.zip,
                coordinates: {
                    type: 'Point',
                    coordinates: [parseFloat(addressForm.lng), parseFloat(addressForm.lat)]
                }
            };

            let payload: any = {};

            const hasPrimary = !!userProfile?.address?.street;

            if (editingIndex === null) {
                // Editing existing primary
                payload.address = newAddr;
            } else if (editingIndex === -1) {
                // Adding new
                if (!hasPrimary) {
                    // If no primary, this becomes primary
                    payload.address = newAddr;
                } else {
                    // Otherwise add to deliveryAddresses
                    payload.deliveryAddresses = [...(userProfile?.deliveryAddresses || []), newAddr];
                }
            } else {
                // Editing specific index in deliveryAddresses
                const newDelivery = [...(userProfile?.deliveryAddresses || [])];
                newDelivery[editingIndex] = newAddr;
                payload.deliveryAddresses = newDelivery;
            }

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                showToast(editingIndex === -1 ? 'Endereço adicionado!' : 'Endereço atualizado!');
                setShowAddressModal(false);
                fetchUserAddress();
            } else {
                showToast('Erro ao salvar endereço', 'error');
            }
        } catch (error) {
            showToast('Erro ao salvar endereço', 'error');
        }
    };

    const getProfileLink = () => {
        if (!session) return '/login';
        if (session.user.role === 'admin') return '/admin';
        if (session.user.role === 'veterinarian') return '/vet/dashboard';
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
                                <div className={styles.locationDropdown} onClick={(e) => e.stopPropagation()}>
                                    <div className={styles.dropdownSection}>
                                        <span className={styles.sectionTitle}>Seus Endereços</span>
                                        <div className={styles.addressList}>
                                            {/* Primary Address */}
                                            {userProfile?.address && (
                                                <div 
                                                    className={`${styles.addressItem} ${styles.activeAddressItem}`}
                                                    onClick={() => handleSelectAddress(userProfile.address, true)}
                                                >
                                                    <div className={styles.addressIconWrapper}>
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div className={styles.addressInfo}>
                                                        <span className={styles.addressStreet}>
                                                            {userProfile.address.street}, {userProfile.address.number}
                                                        </span>
                                                        <span className={styles.addressCity}>{userProfile.address.city}</span>
                                                    </div>
                                                    <div className={styles.addressActions}>
                                                        <button 
                                                            className={`${styles.iconBtn} ${styles.editBtn}`}
                                                            onClick={(e) => { e.stopPropagation(); handleEditAddress(userProfile.address, null); }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delivery Addresses */}
                                            {userProfile?.deliveryAddresses?.map((addr: any, index: number) => (
                                                <div 
                                                    key={index} 
                                                    className={styles.addressItem}
                                                    onClick={() => handleSelectAddress(addr, false, index)}
                                                >
                                                    <div className={styles.addressIconWrapper}>
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div className={styles.addressInfo}>
                                                        <span className={styles.addressStreet}>
                                                            {addr.street}, {addr.number}
                                                        </span>
                                                        <span className={styles.addressCity}>{addr.city}</span>
                                                    </div>
                                                    <div className={styles.addressActions}>
                                                        <button 
                                                            className={`${styles.iconBtn} ${styles.editBtn}`}
                                                            onClick={(e) => { e.stopPropagation(); handleEditAddress(addr, index); }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteAddress(index); }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <span className={styles.sectionTitle}>Opções</span>
                                        <button 
                                            className={styles.actionItem}
                                            onClick={() => {
                                                setLocationFromGPS();
                                                setShowLocationDropdown(false);
                                            }}
                                        >
                                            <MapPin className={styles.actionIcon} size={18} />
                                            Usar localização atual
                                        </button>
                                        <button 
                                            className={styles.actionItem}
                                            onClick={() => {
                                                setEditingIndex(-1); // -1 means new delivery address
                                                setAddressForm({
                                                    street: '', number: '', complement: '', city: '', zip: '', lat: '', lng: ''
                                                });
                                                setShowAddressModal(true);
                                                setShowLocationDropdown(false);
                                            }}
                                        >
                                            <Plus className={styles.actionIcon} size={18} />
                                            Adicionar novo endereço
                                        </button>
                                    </div>
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
                            {editingIndex === -1 ? 'Novo Endereço' : 'Editar Endereço'}
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
