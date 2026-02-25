"use client";

import Link from 'next/link';
import { Youtube, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.topRow}>
                {/* Left side: Nav links in 243x48 box */}
                <div className={styles.navLinksBox}>
                    <Link href="/" className={styles.navLink}>Início</Link>
                    <Link href="/suporte" className={styles.navLink}>Suporte</Link>
                    <Link href="/sobre" className={styles.navLink}>Sobre</Link>
                </div>

                {/* Right side: Social Icons */}
                <div className={styles.socialIcons}>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                        <Youtube size={20} />
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                        <Facebook size={20} />
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                        <Twitter size={20} />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                        <Instagram size={20} />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                        <Linkedin size={20} />
                    </a>
                </div>
            </div>

            <hr className={styles.divider} />

            <p className={styles.copyright}>
                ClickPet @ 2026. Todos os direitos reservados.
            </p>
        </footer>
    );
}
