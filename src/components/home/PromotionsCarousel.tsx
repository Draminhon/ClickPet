'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './PromotionsCarousel.module.css';

interface Promotion {
    id: string;
    title: string;
    tag: string;
    image: string;
    link: string;
}

const DEMO_PROMOS: Promotion[] = [
    {
        id: '1',
        title: 'Desconto em Rações Premium',
        tag: 'Oferta',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1000&h=400&fit=crop',
        link: '/search?category=Ração'
    },
    {
        id: '2',
        title: 'Banho e Tosa Profissional',
        tag: 'Serviços',
        image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=1000&h=400&fit=crop',
        link: '/partners'
    },
    {
        id: '3',
        title: 'Acessórios para Gatos',
        tag: 'Novidade',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000&h=400&fit=crop',
        link: '/search?category=Gatos'
    },
    {
        id: '4',
        title: 'Brinquedos Diversos',
        tag: 'Promo',
        image: 'https://images.unsplash.com/photo-1576201836106-ca1756a1dc3b?w=1000&h=400&fit=crop',
        link: '/search?category=Brinquedos'
    }
];

export default function PromotionsCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let animationFrame: number;
        
        // Auto-scroll logic
        const scroll = () => {
            if (!isPaused && container) {
                container.scrollLeft += 0.8; // Slightly faster for promos
                
                // Infinite loop reset
                if (container.scrollLeft >= container.scrollWidth / 2) {
                    container.scrollLeft = 0;
                }
            }
            animationFrame = requestAnimationFrame(scroll);
        };

        animationFrame = requestAnimationFrame(scroll);
        
        // Manual wheel handling (translate vertical to horizontal)
        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            cancelAnimationFrame(animationFrame);
            container.removeEventListener('wheel', handleWheel);
        };
    }, [isPaused]);

    // Double the array for seamless infinite scroll
    const extendedPromos = [...DEMO_PROMOS, ...DEMO_PROMOS];

    return (
        <section className={styles.sectionContainer}>
            <div 
                className={styles.carouselWrapper}
                ref={scrollRef}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className={styles.carouselTrack}>
                    {extendedPromos.map((promo, index) => (
                        <div key={`${promo.id}-${index}`} className={styles.promoContainer}>
                            <Image
                                src={promo.image}
                                alt={promo.title}
                                width={500}
                                height={200}
                                className={styles.promoImage}
                                priority
                            />
                            <div className={styles.overlay}>
                                <span className={styles.promoTag}>{promo.tag}</span>
                                <h3 className={styles.promoTitle}>{promo.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
