"use client";

import styles from './BottomBanner.module.css';

export default function BottomBanner() {
    return (
        <div className={styles.bannerSection}>
            <div className={styles.contentColumn}>
                <h2 className={styles.title}>
                    Encontre o melhor para seu pet
                </h2>
                <p className={styles.subtitle}>
                    Não importa de qual espécie ele seja, temos tudo o que você precisa.
                </p>
            </div>
        </div>
    );
}
