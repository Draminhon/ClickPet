"use client";

import Image from 'next/image';
import { LayoutGrid, ShoppingCart, Truck } from 'lucide-react';
import styles from './About.module.css';

const stats = [
    { value: '3º', label: 'Maior mercado de petshop do mundo' },
    { value: '10%', label: 'Crescimento do setor por ano' },
    { value: 'R$ 78B', label: 'Faturamento do setor por ano' },
    { value: '160M', label: 'Pets no Brasil' },
];

const solutions = [
    {
        icon: <LayoutGrid size={32} />,
        title: 'Plataforma Digital',
        description: 'Interface simples e intuitiva que centraliza lojas, produtos e serviços em um só lugar, com foco total na experiência do tutor.',
    },
    {
        icon: <ShoppingCart size={32} />,
        title: 'Marketplace & Serviços',
        description: 'Compras e agendamentos integrados: produtos de parceiros, banho e tosa, consultas veterinárias e comparação inteligente de preços.',
    },
    {
        icon: <Truck size={32} />,
        title: 'Logística & Entrega',
        description: 'Entregas realizadas pelos próprios parceiros, com acompanhamento do pedido em tempo real até a porta da sua casa.',
    },
];

const team = [
    { name: 'Luis Soares', role: 'CEO', bio: 'Liderança estratégica e visão de negócio, focado na expansão e governança executiva da ClickPet.', photo: '/assets/team/luis.jpg' },
    { name: 'Murilo Rodrigues', role: 'CTO', bio: 'Arquitetura tecnológica e inovação escalável, liderando o desenvolvimento de soluções disruptivas.', photo: '/assets/team/Murilo.jpg' },
    { name: 'Gustavo Macedo', role: 'Brand Strategist', bio: 'Estratégia de marca e posicionamento global, construindo a identidade visual e verbal do ecossistema.', photo: '/assets/team/gustavo.PNG' },
];

export default function AboutPage() {
    return (
        <div className={styles.pageWrapper}>
            <main className={styles.main}>
                <section className={styles.heroSection}>
                    <div className={styles.container}>
                        <h1 className={styles.heroTitle}>Cuidamos de quem <br/> <span>cuida de você</span></h1>
                        <p className={styles.heroSubtitle}>
                            Compre o que seu pet precisa, do conforto da sua casa. A ClickPet nasceu para unir
                            produtos, serviços e atendimentos em um único ecossistema digital para o bem-estar animal.
                        </p>
                    </div>
                </section>

                <section className={styles.contentSection}>
                    <div className={styles.container}>
                        <div className={styles.grid}>
                            <div className={styles.textContent}>
                                <h2>Nossa Missão</h2>
                                <p>
                                    O setor pet cresceu, mas a experiência do tutor continuou fragmentada entre lojas,
                                    WhatsApp, redes sociais e sites diferentes só para cuidar de quem a gente ama.
                                    A ClickPet nasceu dessa dor real para unificar essa jornada em um só lugar.
                                </p>
                                <p>
                                    Acreditamos que cuidar do seu pet deveria ser simples, rápido e transparente,
                                    com comparação clara de preços, avaliações reais e acompanhamento do pedido em
                                    tempo real, do pedido até a porta de casa.
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
                            {solutions.map((item) => (
                                <div className={styles.valueCard} key={item.title}>
                                    <div className={styles.iconBox}>{item.icon}</div>
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.statsSection}>
                    <div className={styles.container}>
                        <h2 className={styles.statsTitle}>Um mercado em expansão, pronto para inovação digital</h2>
                        <p className={styles.statsSubtitle}>O setor pet cresce e a experiência ainda é analógica.</p>
                        <div className={styles.statsGrid}>
                            {stats.map((stat) => (
                                <div className={styles.statCard} key={stat.label}>
                                    <span className={styles.statValue}>{stat.value}</span>
                                    <span className={styles.statLabel}>{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.contentSection}>
                    <div className={styles.container}>
                        <div className={styles.teamHeader}>
                            <h2>Conheça nosso time</h2>
                            <p>Tecnologia própria, operação integrada e crescimento escalável.</p>
                        </div>
                        <div className={styles.teamGrid}>
                            {team.map((member) => (
                                <div className={styles.teamCard} key={member.name}>
                                    <div className={styles.teamAvatar}>
                                        <Image
                                            src={member.photo}
                                            alt={member.name}
                                            width={96}
                                            height={96}
                                            className={styles.teamPhoto}
                                        />
                                    </div>
                                    <h3>{member.name}</h3>
                                    <span className={styles.teamRole}>{member.role}</span>
                                    <p>{member.bio}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
