"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Settings, LogOut, Scissors, Calendar, Zap, CreditCard } from 'lucide-react';
import { signOut } from 'next-auth/react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? styles.active : '';

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <Image src="/logo.png" alt="ClickPet Partner" width={160} height={50} style={{ objectFit: 'contain' }} />
            </div>

            <nav className={styles.nav}>
                <Link href="/partner/dashboard" className={`${styles.navItem} ${isActive('/partner/dashboard')}`}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </Link>
                <Link href="/partner/orders" className={`${styles.navItem} ${isActive('/partner/orders')}`}>
                    <span style={{ fontSize: '20px' }}>📦</span>
                    <span>Pedidos</span>
                </Link>
                <Link href="/partner/catalog" className={`${styles.navItem} ${isActive('/partner/catalog')}`}>
                    <Package size={20} />
                    <span>Catálogo</span>
                </Link>
                <Link href="/partner/services" className={`${styles.navItem} ${isActive('/partner/services')}`}>
                    <Scissors size={20} />
                    <span>Serviços</span>
                </Link>
                <Link href="/partner/appointments" className={`${styles.navItem} ${isActive('/partner/appointments')}`}>
                    <Calendar size={20} />
                    <span>Agendamentos</span>
                </Link>
                <Link href="/partner/coupons" className={`${styles.navItem} ${isActive('/partner/coupons')}`}>
                    <span style={{ fontSize: '20px' }}>🎫</span>
                    <span>Cupons</span>
                </Link>
                <Link href="/partner/delivery" className={`${styles.navItem} ${isActive('/partner/delivery')}`}>
                    <span style={{ fontSize: '20px' }}>🚚</span>
                    <span>Entregadores</span>
                </Link>
                <Link href="/partner/subscription" className={`${styles.navItem} ${isActive('/partner/subscription')}`}>
                    <Zap size={20} color="#6CC551" />
                    <span>Minha Assinatura</span>
                </Link>
                <Link href="/partner/settings" className={`${styles.navItem} ${isActive('/partner/settings')}`}>
                    <Settings size={20} />
                    <span>Configurações</span>
                </Link>

                <button onClick={() => signOut()} className={styles.navItem} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </nav>
        </aside>
    );
}
