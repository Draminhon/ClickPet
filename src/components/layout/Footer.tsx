"use client";

import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.topRow}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoRow}>
                        <Image 
                            src="/assets/icons/Logo mascote - V2.png" 
                            alt="ClickPet Mascote" 
                            width={110} 
                            height={110} 
                            className={styles.logoMascote}
                        />
                        <Image 
                            src="/assets/titles/Logo texto - V2.png" 
                            alt="ClickPet" 
                            width={360} 
                            height={110} 
                            className={styles.logoTexto}
                        />
                    </div>
                </div>
                
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
                        <Link href="/login" className={styles.linkText}>Quero ser parceiro</Link>
                    </div>
                </div>
            </div>

            <hr className={styles.divider} />

            <div className={styles.bottomRow}>
                <div className={styles.legalColLeft}>
                    <span className={styles.legalText}>© Copyright 2026 - ClickPet - Todos os direitos reservados</span>
                    <span className={styles.legalText}>CNPJ: 66.020.276/0001-40</span>
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
