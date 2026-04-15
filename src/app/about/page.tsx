"use client";

import Image from 'next/image';
import { Heart, Shield, Users, Award } from 'lucide-react';
import styles from './About.module.css';

export default function AboutPage() {
    return (
        <div className={styles.pageWrapper}>
            <main className={styles.main}>
                <section className={styles.heroSection}>
                    <div className={styles.container}>
                        <h1 className={styles.heroTitle}>Cuidamos de quem <br/> <span>cuida de você</span></h1>
                        <p className={styles.heroSubtitle}>
                            A ClickPet nasceu do desejo de simplificar a vida dos tutores e oferecer o melhor
                            ecossistema de produtos e serviços para o bem-estar dos pets.
                        </p>
                    </div>
                </section>

                <section className={styles.contentSection}>
                    <div className={styles.container}>
                        <div className={styles.grid}>
                            <div className={styles.textContent}>
                                <h2>Nossa Missão</h2>
                                <p>
                                    Conectar tutores apaixonados aos melhores petshops e clínicas veterinárias da região, 
                                    proporcionando uma experiência de compra ágil, segura e repleta de carinho.
                                </p>
                                <p>
                                    Acreditamos que todo pet merece acesso rápido a produtos de qualidade e atendimento 
                                    especializado, por isso construímos uma rede de parceiros que compartilham dos nossos valores.
                                </p>
                            </div>
                            <div className={styles.imageContent}>
                                <div className={styles.imageFrame}>
                                    <Image 
                                        src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop" 
                                        alt="Pets felizes" 
                                        width={600} 
                                        height={400} 
                                        className={styles.aboutImage}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.valuesGrid}>
                            <div className={styles.valueCard}>
                                <div className={styles.iconBox}><Heart size={32} /></div>
                                <h3>Amor Animal</h3>
                                <p>Tudo o que fazemos é movido pelo respeito e carinho que temos pelos nossos companheiros de quatro patas.</p>
                            </div>
                            <div className={styles.valueCard}>
                                <div className={styles.iconBox}><Shield size={32} /></div>
                                <h3>Segurança</h3>
                                <p>Garantimos que todos os parceiros ClickPet passem por uma curadoria rigorosa de qualidade.</p>
                            </div>
                            <div className={styles.valueCard}>
                                <div className={styles.iconBox}><Award size={32} /></div>
                                <h3>Excelência</h3>
                                <p>Buscamos sempre a melhor tecnologia e logística para que sua entrega chegue no tempo certo.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
