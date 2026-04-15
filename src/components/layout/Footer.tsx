"use client";

import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.topRow}>
                <div className={styles.logo}>ClickPet.</div>
                
                <div className={styles.linksContainer}>
                    <div className={styles.linkGroup}>
                        <span className={styles.linkTitle}>Instituição</span>
                        <Link href="/about" className={styles.linkText}>Sobre nós</Link>
                    </div>
                    
                    <div className={styles.linkGroup}>
                        <span className={styles.linkTitle}>Descubra</span>
                        <Link href="/partner-about" className={styles.linkText}>Cadastre sua empresa</Link>
                    </div>
                    
                    <div className={styles.linkGroup}>
                        <span className={styles.linkTitle}>Parcerias</span>
                        <Link href="/register?role=partner" className={styles.linkText}>Quero ser parceiro</Link>
                    </div>
                </div>
            </div>

            <hr className={styles.divider} />

            <div className={styles.bottomRow}>
                <div className={styles.legalColLeft}>
                    <span className={styles.legalText}>© Copyright 2026 - ClickPet - Todos os direitos reservados</span>
                    <span className={styles.legalText}>CNPJ: 0.000.000/0000-00</span>
                </div>
                
                <div className={styles.legalColRight}>
                    <Link href="/terms" className={styles.legalText}>Termos de uso</Link>
                    <Link href="/privacy" className={styles.legalText}>Política de Privacidade</Link>
                    <Link href="/security" className={styles.legalText}>Segurança</Link>
                    <Link href="/conduct" className={styles.legalText}>Código de Conduta</Link>
                </div>
            </div>
        </footer>
    );
}
