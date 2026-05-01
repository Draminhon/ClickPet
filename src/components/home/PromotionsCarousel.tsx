'use client';

import React, { useRef, useEffect, useState } from 'react';
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
        image: 'https://images.unsplash.com/photo-1576201836105-81186fab35ed?w=1000&h=400&fit=crop',
        link: '/search?category=Brinquedos'
    }
];

export default function PromotionsCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);
    const isMouseDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        isMouseDown.current = true;
        setHasMoved(false);
        setIsPaused(true);
        startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
        scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    };

    const handleMouseLeave = () => {
        isMouseDown.current = false;
        setIsDragging(false);
        setIsPaused(false);
    };

    const handleMouseUp = () => {
        isMouseDown.current = false;
        setTimeout(() => {
            setIsDragging(false);
            setHasMoved(false);
        }, 10);
        setIsPaused(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isMouseDown.current) return;

        const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
        const walk = x - startX.current;

        if (Math.abs(walk) > 5) {
            setIsDragging(true);
            setHasMoved(true);
        }

        if (isDragging) {
            e.preventDefault();
            if (scrollRef.current) {
                scrollRef.current.scrollLeft = scrollLeft.current - walk * 2;
            }
        }
    };

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let animationFrame: number;
        
        let accumulator = 0;
        
        // Auto-scroll logic
        const scroll = () => {
            if (!isPaused && !isDragging && container) {
                // CONFIGURAÇÃO DE VELOCIDADE:
                // Altere o valor abaixo (ex: 0.3). Valores maiores = mais rápido.
                accumulator += 0.5; 
                
                if (accumulator >= 1) {
                    container.scrollLeft += Math.floor(accumulator);
                    accumulator -= Math.floor(accumulator);
                }
                
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
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <div className={styles.carouselTrack} style={isDragging ? { pointerEvents: 'none' } : {}}>
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
