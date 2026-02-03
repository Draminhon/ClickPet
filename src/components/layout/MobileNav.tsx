"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, User, TicketPercent } from 'lucide-react';
import styles from './MobileNav.module.css';

export default function MobileNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? styles.active : '';

    return (
        <nav className={styles.mobileNav}>
            <div className={styles.navContent}>
                <Link href="/" className={`${styles.navItem} ${isActive('/')}`}>
                    <Home size={24} />
                    <span>Início</span>
                </Link>
                <Link href="/search" className={`${styles.navItem} ${isActive('/search')}`}>
                    <Search size={24} />
                    <span>Buscar</span>
                </Link>
                <Link href="/orders" className={`${styles.navItem} ${isActive('/orders')}`}>
                    <ShoppingBag size={24} />
                    <span>Pedidos</span>
                </Link>
                <Link href="/coupons" className={`${styles.navItem} ${isActive('/coupons')}`}>
                    <TicketPercent size={24} />
                    <span>Cupons</span>
                </Link>
                <Link href="/profile" className={`${styles.navItem} ${isActive('/profile')}`}>
                    <User size={24} />
                    <span>Perfil</span>
                </Link>
            </div>
        </nav>
    );
}
