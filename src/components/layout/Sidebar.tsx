"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Scissors,
    Calendar,
    Ticket,
    Truck,
    Zap,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Failed to invalidate session remotely:", error);
        }
        signOut({ callbackUrl: '/login' });
    };

    const isAdmin = session?.user?.role === 'admin';
    const [shopData, setShopData] = useState({
        name: 'Petshop',
        logo: ''
    });

    useEffect(() => {
        const fetchShopData = async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    setShopData({
                        name: data.name || 'Petshop',
                        logo: data.shopLogo || data.image || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching shop data:', error);
            }
        };

        if (session) {
            fetchShopData();
        }
    }, [session]);

    const isActive = (path: string) => pathname === path ? styles.active : '';

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const navItems = [
        { href: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/partner/orders', label: 'Pedidos', icon: ShoppingBag },
        { href: '/partner/services', label: 'Serviços', icon: Scissors },
        { href: '/partner/appointments', label: 'Agendamentos', icon: Calendar },
        { href: '/partner/coupons', label: 'Cupons', icon: Ticket },
        { href: '/partner/delivery', label: 'Entregadores', icon: Truck },
        { href: '/partner/subscription', label: 'Minha assinatura', icon: Zap },
    ];

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            <button className={styles.toggleBtn} onClick={toggleSidebar}>
                {isCollapsed ? <ChevronRight size={16} color="#757575" /> : <ChevronLeft size={16} color="#757575" />}
            </button>

            <div className={styles.container}>
                {/* Header Profile */}
                <div className={styles.header}>
                    <div className={styles.shopLogoWrapper}>
                        {shopData.logo ? (
                            <Image
                                src={shopData.logo}
                                alt={shopData.name}
                                width={44}
                                height={44}
                                className={styles.shopLogo}
                            />
                        ) : (
                            <div className={styles.shopLogoPlaceholder}>
                                <ShoppingBag size={20} color="#3BB77E" />
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className={styles.shopInfo}>
                            <span className={styles.petshopLabel}>PETSHOP</span>
                            <span className={styles.shopName}>{shopData.name}</span>
                        </div>
                    )}
                </div>

                <div className={styles.divider} />

                <span className={styles.sectionLabel}>Main</span>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href)}`}
                        >
                            <item.icon className={styles.navIcon} />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className={styles.divider} />

                <span className={styles.sectionLabel}>CONFIGURAÇÃO</span>

                <Link 
                    href="/partner/settings" 
                    className={`${styles.navItem} ${isActive('/partner/settings')}`}
                >
                    <Settings className={styles.navIcon} />
                    {!isCollapsed && <span>Configuração</span>}
                </Link>

                <div className={styles.logoutContainer}>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut className={styles.navIcon} />
                        {!isCollapsed && <span>Sair</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
