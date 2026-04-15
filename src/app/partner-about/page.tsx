"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Rocket, BarChart, Truck, Headphones } from 'lucide-react';
import styles from './PartnerAbout.module.css';

export default function PartnerAboutPage() {
    return (
        <div className={styles.pageWrapper}>
            <main className={styles.main}>
                <section className={styles.heroSection}>
                    <div className={styles.container}>
                        <div className={styles.heroContent}>
                            <h1 className={styles.heroTitle}>Transforme seu petshop em uma <br/> <span>loja de alta performance</span></h1>
                            <p className={styles.heroSubtitle}>
                                Junte-se ao marketplace que mais cresce no setor pet e alcance milhares de tutores na sua região.
                            </p>
                            <Link href="/register?role=partner" className={styles.primaryBtn}>
                                Começar agora
                            </Link>
                        </div>
                    </div>
                </section>

                <section className={styles.benefitsSection}>
                    <div className={styles.container}>
                        <h2 className={styles.sectionTitle}>Por que ser um parceiro ClickPet?</h2>
                        
                        <div className={styles.benefitsGrid}>
                            <div className={styles.benefitCard}>
                                <div className={styles.iconBox}><Rocket size={32} /></div>
                                <h3>Mais Vendas</h3>
                                <p>Aumente seu faturamento alcançando clientes que preferem a conveniência de comprar online.</p>
                            </div>
                            <div className={styles.benefitCard}>
                                <div className={styles.iconBox}><Truck size={32} /></div>
                                <h3>Logística Inteligente</h3>
                                <p>Utilize nossa inteligência de entrega para otimizar suas rotas e reduzir custos de frete.</p>
                            </div>
                            <div className={styles.benefitCard}>
                                <div className={styles.iconBox}><BarChart size={32} /></div>
                                <h3>Gestão de Dados</h3>
                                <p>Acesse um painel administrativo completo com estatísticas de vendas e comportamento dos clientes.</p>
                            </div>
                            <div className={styles.benefitCard}>
                                <div className={styles.iconBox}><Headphones size={32} /></div>
                                <h3>Suporte Dedicado</h3>
                                <p>Conte com um time de especialistas pronto para ajudar você a crescer dentro da plataforma.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.ctaSection}>
                    <div className={styles.container}>
                        <div className={styles.ctaCard}>
                            <h2>Pronto para escalar seu negócio?</h2>
                            <p>O cadastro leva menos de 5 minutos e sua loja pode estar ativa ainda hoje.</p>
                            <Link href="/register?role=partner" className={styles.whiteBtn}>
                                Cadastrar minha Loja
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
