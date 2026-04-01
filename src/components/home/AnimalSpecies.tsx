"use client";

import Image from 'next/image';
import styles from './AnimalSpecies.module.css';

export default function AnimalSpecies() {
    return (
        <section className={styles.section}>
            <h2 className={styles.heading}>
                Fornecendo atendimento para as mais diversas espécies
            </h2>

            <div className={styles.speciesRow}>
                {/* Left: Chihuahua (Dogs) */}
                <div className={styles.card} style={{ width: '430px', height: '523px' }}>
                    <Image
                        src="/assets/animals/chihuaha.png"
                        alt="Cachorros"
                        fill
                        sizes="(max-width: 768px) 100vw, 430px"
                        className={styles.cardImage}
                    />
                    <span className={`${styles.cardText} ${styles.textWhite}`}>Cachorros</span>
                </div>

                {/* Right Column */}
                <div className={styles.gridColumn}>
                    {/* Top Row: Diversos and Aves */}
                    <div className={styles.topRow}>
                        <div className={styles.card} style={{ width: '385px', height: '200px' }}>
                            <Image
                                src="/assets/animals/indian_pig.png"
                                alt="Diversos"
                                fill
                                sizes="(max-width: 768px) 100vw, 385px"
                                className={styles.cardImage}
                            />
                            <span className={`${styles.cardText} ${styles.textWhite}`}>Diversos</span>
                        </div>
                        <div className={styles.card} style={{ width: '385px', height: '200px' }}>
                            <Image
                                src="/assets/animals/parrot.png"
                                alt="Aves"
                                fill
                                sizes="(max-width: 768px) 100vw, 385px"
                                className={styles.cardImage}
                            />
                            <span className={`${styles.cardText} ${styles.textDark}`}>Aves</span>
                        </div>
                    </div>

                    {/* Bottom: Gatos */}
                    <div className={styles.card} style={{ width: '820px', height: '273px' }}>
                        <Image
                            src="/assets/animals/cat.png"
                            alt="Gatos"
                            fill
                            sizes="(max-width: 768px) 100vw, 820px"
                            className={styles.cardImage}
                        />
                        <span className={`${styles.cardText} ${styles.textWhite}`}>Gatos</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
