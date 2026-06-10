'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    User, 
    Settings, 
    MapPin, 
    LogOut,
    ChevronRight,
    Bell,
    X
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import styles from './VetSidebar.module.css';

interface VetSidebarProps {
    user: {
        name: string;
        image?: string;
        role: string;
    };
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function VetSidebar({ user, activeTab, setActiveTab, isOpen = false, onClose }: VetSidebarProps) {
    const navItems = [
        { id: 'overview', label: 'Painel Geral', icon: LayoutDashboard },
        { id: 'profile', label: 'Meu Perfil', icon: User },
        { id: 'location', label: 'Localização', icon: MapPin },
    ];

    return (
        <>
            {isOpen && <div className={styles.backdrop} onClick={onClose} />}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.topArea}>
                    <div className={styles.logoRow}>
                        <Link href="/" className={styles.logo}>
                            ClickPet<span>.</span>
                        </Link>
                        {onClose && (
                            <button onClick={onClose} className={styles.closeButton}>
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    
                    <div className={styles.profileSummary}>
                        <div className={styles.avatarContainer}>
                            {user.image ? (
                                <Image src={user.image} alt={user.name} fill className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className={styles.profileInfo}>
                            <h4 className={styles.userName}>{user.name}</h4>
                            <span className={styles.userRole}>Veterinário</span>
                        </div>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (onClose) onClose();
                                }}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight size={16} className={styles.activeIndicator} />}
                            </button>
                        );
                    })}
                </nav>

                <div className={styles.bottomArea}>
                    <button 
                        className={styles.logoutButton}
                        onClick={() => signOut({ callbackUrl: '/' })}
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
