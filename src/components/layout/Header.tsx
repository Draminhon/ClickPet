"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, User, Bell, X, MapPin, ChevronDown, Package, UserCircle, LogOut, Edit2, Trash2, Plus, Check, CheckCheck, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { useLocation } from '@/context/LocationContext';
import MapPicker from '@/components/ui/MapPicker';
import { formatAddress } from '@/utils/masks';
import styles from './Header.module.css';


export default function Header() {
    const { count, items: cartItems, updateQuantity, removeFromCart, total: cartTotal } = useCart();
    const { data: session, status } = useSession();
    const { showToast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const { address, setLocationFromGPS, clearLocation, setLocationManual } = useLocation();
    
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [userAddress, setUserAddress] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = new or primary, -1 = new, 0+ = deliveryAddresses index
    const [showCartDrawer, setShowCartDrawer] = useState(false);
    const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
    
    // States for mobile profile & notification modal
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileProfileModal, setShowMobileProfileModal] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    // Track screen width to determine mobile view (<= 768px)
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchNotifications = () => {
        if (!session) return;
        setNotificationsLoading(true);
        fetch(`/api/notifications?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
                setNotificationsLoading(false);
            })
            .catch(() => setNotificationsLoading(false));
    };

    // Auto-fetch notifications when modal opens or session shifts
    useEffect(() => {
        if (showMobileProfileModal && session) {
            fetchNotifications();
        }
    }, [showMobileProfileModal, session]);

    const handleMarkAsRead = async (notificationId: string) => {
        setNotifications(prev => prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch(`/api/notifications?id=${notificationId}`, { method: 'PUT' });
            fetchNotifications();
        } catch (error) {
            fetchNotifications();
        }
    };

    const handleMarkAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await fetch('/api/notifications', { method: 'PUT' });
            fetchNotifications();
        } catch (error) {
            fetchNotifications();
        }
    };

    const handleDeleteNotification = async (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        setUnreadCount(prev => {
            const deletedNotif = notifications.find(n => n._id === notificationId);
            if (deletedNotif && !deletedNotif.read) {
                return Math.max(0, prev - 1);
            }
            return prev;
        });

        try {
            await fetch(`/api/notifications?id=${notificationId}`, { method: 'DELETE' });
            fetchNotifications();
        } catch (error) {
            fetchNotifications();
        }
    };

    const handleClearAllNotifications = async () => {
        setNotifications([]);
        setUnreadCount(0);

        try {
            await fetch('/api/notifications', { method: 'DELETE' });
            fetchNotifications();
        } catch (error) {
            fetchNotifications();
        }
    };

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
            fetchNotifications();
        }
    }, [session]);

    // Re-fetch profile data when the LocationContext address changes
    // (e.g. user saved an address from the Profile or Checkout page)
    useEffect(() => {
        if (session && address) {
            fetchUserAddress();
        }
    }, [address]);

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
            .catch(err => console.error(err));
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
            setLocationManual(
                selectedAddr.coordinates.coordinates[1],
                selectedAddr.coordinates.coordinates[0],
                formatAddress(selectedAddr.street, selectedAddr.number),
                selectedAddr.city
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

    const handleDeleteAddress = async (index: number | null) => {
        if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
        
        try {
            let payload: any = {};
            const remainingDeliveries = [...(userProfile?.deliveryAddresses || [])];

            if (index === null) {
                // Delete primary address
                if (remainingDeliveries.length > 0) {
                    payload.address = remainingDeliveries.shift(); 
                    payload.deliveryAddresses = remainingDeliveries;
                } else {
                    payload.address = { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' };
                }
            } else {
                remainingDeliveries.splice(index, 1);
                payload.deliveryAddresses = remainingDeliveries;
            }

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                showToast('Endereço excluído');
                
                // If we deleted the primary address and it was currently selected in context, clear it
                if (index === null && payload.address?.street === '') {
                    clearLocation();
                }
                
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

                // If editing or adding the primary address, update the active LocationContext immediately
                if (editingIndex === null || (editingIndex === -1 && !hasPrimary)) {
                    setLocationManual(
                        parseFloat(addressForm.lat) || 0,
                        parseFloat(addressForm.lng) || 0,
                        formatAddress(addressForm.street, addressForm.number),
                        addressForm.city
                    );
                }
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
            <header className={`${styles.header} ${!session ? styles.headerTransparent : ''}`}>
                <div className={styles.headerContent}>
                    {/* Logo */}
                    <Link 
                        href="/" 
                        className={`${styles.logo} ${
                            pathname === '/about' || pathname === '/partner-about' 
                                ? styles.logoBlack 
                                : (!session ? styles.logoWhite : '')
                        }`}
                    >
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
                                <>
                                    <div 
                                        className={styles.locationBackdrop} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowLocationDropdown(false);
                                        }}
                                    />
                                    <div className={styles.locationDropdown} onClick={(e) => e.stopPropagation()}>
                                        <div className={styles.mobileModalHeader}>
                                            <span className={styles.mobileModalTitle}>Seus Endereços</span>
                                            <button 
                                                className={styles.mobileModalClose} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowLocationDropdown(false);
                                                }}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
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
                                                            {formatAddress(userProfile.address.street, userProfile.address.number) || "Sem endereço"}
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
                                                        <button 
                                                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteAddress(null); }}
                                                        >
                                                            <Trash2 size={14} />
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
                                                            {formatAddress(addr.street, addr.number) || "Sem endereço"}
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
                                </>
                            )}
                        </div>
                    )}

                    {/* Right Actions */}
                    <div className={styles.headerActions}>
                        {status === 'loading' ? (
                            <div style={{ opacity: 0, width: '150px' }} />
                        ) : session ? (
                            <>
                                {/* Logged in: notifications, cart, profile */}
                                <div 
                                    className={styles.notificationWrapper}
                                    onClick={() => {
                                        fetchNotifications();
                                        setShowNotificationsDrawer(true);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Bell className={styles.notificationIcon} size={24} />
                                    {unreadCount > 0 && (
                                        <span className={styles.badge}>{unreadCount}</span>
                                    )}
                                </div>

                                <div 
                                    className={styles.cartWrapper}
                                    onClick={() => setShowCartDrawer(true)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <ShoppingCart className={styles.cartIcon} size={24} />
                                    {count > 0 && (
                                        <span className={styles.badge}>{count}</span>
                                    )}
                                </div>

                                <div 
                                    className={styles.profileMenuWrapper}
                                    onMouseEnter={() => setShowProfileDropdown(true)}
                                    onMouseLeave={() => setShowProfileDropdown(false)}
                                >
                                    <div
                                        className={styles.profileCircle}
                                        onClick={() => {
                                            if (isMobile) {
                                                setShowMobileProfileModal(true);
                                            } else {
                                                router.push(getProfileLink());
                                            }
                                        }}
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
                                {/* Not logged in: Entrar */}
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
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <button
                            onClick={() => setShowAddressModal(false)}
                            className={styles.modalCloseBtn}
                        >
                            <X size={24} />
                        </button>

                        <h2 className={styles.modalTitle}>
                            {editingIndex === -1 ? 'Novo Endereço' : 'Editar Endereço'}
                        </h2>

                        <div className={styles.modalForm}>
                            <div className={styles.formGrid3}>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>Rua</label>
                                    <input
                                        value={addressForm.street}
                                        onChange={e => setAddressForm({ ...addressForm, street: e.target.value })}
                                        className={styles.formInput}
                                    />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>Número</label>
                                    <input
                                        value={addressForm.number}
                                        onChange={e => setAddressForm({ ...addressForm, number: e.target.value })}
                                        className={styles.formInput}
                                    />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>Complemento</label>
                                    <input
                                        value={addressForm.complement}
                                        onChange={e => setAddressForm({ ...addressForm, complement: e.target.value })}
                                        className={styles.formInput}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>

                            <div className={styles.formGrid2}>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>Cidade</label>
                                    <input
                                        value={addressForm.city}
                                        onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                                        className={styles.formInput}
                                    />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>CEP</label>
                                    <input
                                        value={addressForm.zip}
                                        onChange={e => setAddressForm({ ...addressForm, zip: e.target.value })}
                                        className={styles.formInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}>
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

                            <div className={styles.modalButtonsRow}>
                                <button
                                    onClick={() => setShowAddressModal(false)}
                                    className={styles.cancelBtn}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveAddress}
                                    className={styles.submitBtn}
                                >
                                    Salvar Endereço
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Profile & Notifications Modal */}
            {showMobileProfileModal && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'stretch',
                        justifyContent: 'flex-end',
                        zIndex: 9999,
                    }} 
                    onClick={() => setShowMobileProfileModal(false)}
                >
                    <style>{`
                        @keyframes slideInRight {
                            from { transform: translateX(100%); }
                            to { transform: translateX(0); }
                        }
                    `}</style>
                    <div 
                        style={{
                            background: 'white',
                            borderTopLeftRadius: '24px',
                            borderBottomLeftRadius: '24px',
                            padding: '24px 20px',
                            width: '85%',
                            maxWidth: '380px',
                            height: '100%',
                            maxHeight: '100vh',
                            overflowY: 'auto',
                            position: 'relative',
                            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {userImage ? (
                                        <Image src={userImage} alt="Profile" width={48} height={48} style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <User size={24} color="#3BB77E" />
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#272727', fontFamily: "'Baloo 2', sans-serif" }}>
                                        {userProfile?.name || 'Seu Perfil'}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#878787' }}>
                                        {userProfile?.email || ''}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowMobileProfileModal(false)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={24} color="#272727" />
                            </button>
                        </div>
 
                        {/* Profile Menu Links */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                            <button 
                                onClick={() => {
                                    router.push(getProfileLink());
                                    setShowMobileProfileModal(false);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid #DDE1E6', background: 'white', fontFamily: "'Baloo 2', sans-serif", fontWeight: 600, fontSize: '15px', color: '#272727', cursor: 'pointer', textAlign: 'left' }}
                            >
                                <UserCircle size={20} color="#3BB77E" />
                                Ver Perfil
                            </button>
                            <button 
                                onClick={() => {
                                    router.push('/orders');
                                    setShowMobileProfileModal(false);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid #DDE1E6', background: 'white', fontFamily: "'Baloo 2', sans-serif", fontWeight: 600, fontSize: '15px', color: '#272727', cursor: 'pointer', textAlign: 'left' }}
                            >
                                <Package size={20} color="#3BB77E" />
                                Meus Pedidos
                            </button>
                            <button 
                                onClick={() => {
                                    signOut({ callbackUrl: '/' });
                                    setShowMobileProfileModal(false);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid #FF3B30', background: 'rgba(255, 59, 48, 0.05)', fontFamily: "'Baloo 2', sans-serif", fontWeight: 600, fontSize: '15px', color: '#FF3B30', cursor: 'pointer', textAlign: 'left' }}
                            >
                                <LogOut size={20} color="#FF3B30" />
                                Sair da Conta
                            </button>
                        </div>
 
                        <hr style={{ border: 'none', height: '1px', background: '#DDE1E6', margin: '0 0 20px 0' }} />
 
                        {/* Notifications Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: '18px', color: '#272727' }}>
                                    Notificações {unreadCount > 0 && <span style={{ background: '#FF3B30', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', marginLeft: '6px' }}>{unreadCount}</span>}
                                </span>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={handleMarkAllAsRead}
                                        style={{ background: 'none', border: 'none', color: '#3BB77E', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        Marcar lidas
                                    </button>
                                )}
                            </div>
 
                            {notificationsLoading ? (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: '#878787' }}>Carregando notificações...</div>
                            ) : notifications.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <Bell size={32} color="#DDE1E6" />
                                    <span style={{ fontSize: '14px', color: '#878787' }}>Nenhuma notificação no momento</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: 'calc(100vh - 330px)', paddingRight: '4px' }}>
                                    {notifications.map(n => (
                                        <div 
                                            key={n._id}
                                            onClick={() => {
                                                if (!n.read) handleMarkAsRead(n._id);
                                                if (n.link) {
                                                    router.push(n.link);
                                                    setShowMobileProfileModal(false);
                                                }
                                            }}
                                            style={{
                                                display: 'flex',
                                                gap: '12px',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                background: n.read ? '#fdfdfd' : 'rgba(59, 183, 126, 0.05)',
                                                border: n.read ? '1px solid #eee' : '1px solid rgba(59, 183, 126, 0.2)',
                                                cursor: n.link ? 'pointer' : 'default',
                                                position: 'relative'
                                            }}
                                        >
                                            {!n.read && (
                                                <div style={{ width: '8px', height: '8px', background: '#3BB77E', borderRadius: '50%', position: 'absolute', top: '12px', right: '12px' }} />
                                            )}
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: n.type === 'order' ? 'rgba(59, 183, 126, 0.1)' : 'rgba(237, 128, 42, 0.1)',
                                                color: n.type === 'order' ? '#3BB77E' : '#ED802A',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {n.type === 'order' ? <Package size={18} /> : <Bell size={18} />}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, textAlign: 'left' }}>
                                                <span style={{ fontWeight: 700, fontSize: '13px', color: '#272727', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    {n.title}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#878787', marginTop: '2px', lineHeight: 1.3 }}>
                                                    {n.message}
                                                </span>
                                                <span style={{ fontSize: '10px', color: '#a0a0a0', marginTop: '6px' }}>
                                                    {new Date(n.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Side Drawer */}
            {showCartDrawer && (
                <div 
                    className={styles.drawerOverlay} 
                    onClick={() => setShowCartDrawer(false)}
                >
                    <div 
                        className={styles.drawerCard} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.drawerHeader}>
                            <h3 className={styles.drawerTitle}>
                                Carrinho {count > 0 && <span className={styles.drawerTitleBadge}>{count}</span>}
                            </h3>
                            <button 
                                className={styles.drawerCloseBtn}
                                onClick={() => setShowCartDrawer(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className={styles.drawerContent}>
                            {cartItems.length === 0 ? (
                                <div className={styles.drawerEmptyState}>
                                    <ShoppingCart size={48} color="#DDE1E6" />
                                    <span className={styles.emptyText}>Seu carrinho está vazio</span>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={item.id} className={styles.drawerCartItem}>
                                        <div className={styles.drawerItemImgWrapper}>
                                            <Image 
                                                src={item.image || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=80&h=80&fit=crop'} 
                                                alt={item.title}
                                                fill
                                                sizes="80px"
                                                className={styles.drawerItemImg}
                                            />
                                        </div>
                                        <div className={styles.drawerItemDetails}>
                                            <h4 className={styles.drawerItemTitle}>{item.title}</h4>
                                            <span className={styles.drawerItemShop}>Vendido por: {item.shopName}</span>
                                            
                                            <div className={styles.drawerItemPriceRow}>
                                                <span className={styles.drawerItemPrice}>
                                                    R$ {item.price.toFixed(2)}
                                                </span>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className={styles.qtySelector}>
                                                        <button 
                                                            className={styles.qtyBtn}
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            title="Diminuir quantidade"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className={styles.qtyValue}>{item.quantity}</span>
                                                        <button 
                                                            className={styles.qtyBtn}
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            title="Aumentar quantidade"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    
                                                    <button 
                                                        className={styles.itemRemoveBtn}
                                                        onClick={() => removeFromCart(item.id)}
                                                        title="Remover do carrinho"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer (Sticky only when items exist) */}
                        {cartItems.length > 0 && (
                            <div className={styles.drawerFooter}>
                                <div className={styles.drawerSubtotalRow}>
                                    <span className={styles.subtotalLabel}>Subtotal:</span>
                                    <span className={styles.subtotalVal}>
                                        R$ {cartTotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.footerButtons}>
                                    <button 
                                        className={styles.viewCartBtn}
                                        onClick={() => {
                                            router.push('/cart');
                                            setShowCartDrawer(false);
                                        }}
                                    >
                                        Ver meu carrinho
                                    </button>
                                    <button 
                                        className={styles.checkoutSolidBtn}
                                        onClick={() => {
                                            router.push('/checkout');
                                            setShowCartDrawer(false);
                                        }}
                                    >
                                        Finalizar Compra
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notifications Side Drawer */}
            {showNotificationsDrawer && (
                <div 
                    className={styles.drawerOverlay} 
                    onClick={() => setShowNotificationsDrawer(false)}
                >
                    <div 
                        className={styles.drawerCard} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.drawerHeader}>
                            <h3 className={styles.drawerTitle}>
                                Notificações 
                                {unreadCount > 0 && (
                                    <span className={styles.drawerTitleBadge}>{unreadCount}</span>
                                )}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {unreadCount > 0 && (
                                    <button 
                                        className={styles.markAllReadBtn}
                                        onClick={handleMarkAllAsRead}
                                    >
                                        Marcar todas como lidas
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button 
                                        className={styles.clearAllBtn}
                                        onClick={handleClearAllNotifications}
                                    >
                                        Limpar todas
                                    </button>
                                )}
                                <button 
                                    className={styles.drawerCloseBtn}
                                    onClick={() => setShowNotificationsDrawer(false)}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className={styles.drawerContent}>
                            {notificationsLoading ? (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: '#878787' }}>
                                    Carregando notificações...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className={styles.drawerEmptyState}>
                                    <Bell size={48} color="#DDE1E6" />
                                    <span className={styles.emptyText}>Nenhuma notificação no momento</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {notifications.map((n) => (
                                        <div 
                                            key={n._id}
                                            onClick={() => {
                                                if (!n.read) handleMarkAsRead(n._id);
                                                if (n.link) {
                                                    router.push(n.link);
                                                    setShowNotificationsDrawer(false);
                                                }
                                            }}
                                            className={`${styles.drawerNotificationItem} ${!n.read ? styles.drawerNotificationItemUnread : ''}`}
                                            style={{ cursor: n.link ? 'pointer' : 'default' }}
                                        >
                                            {!n.read && <div className={styles.unreadDot} />}
                                            <div className={`${styles.notifIconWrapper} ${n.type === 'order' ? styles.notifIconOrder : styles.notifIconPromo}`}>
                                                {n.type === 'order' ? <Package size={18} /> : <Bell size={18} />}
                                            </div>
                                            <div className={styles.notifBody}>
                                                <span className={styles.notifTitle}>{n.title}</span>
                                                <span className={styles.notifMsg}>{n.message}</span>
                                                <span className={styles.notifTime}>
                                                    {new Date(n.createdAt).toLocaleDateString('pt-BR', { 
                                                        day: '2-digit', 
                                                        month: 'short', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </span>
                                            </div>
                                            <button 
                                                className={styles.deleteNotifBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteNotification(n._id);
                                                }}
                                                title="Excluir notificação"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
