'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import styles from './PartnersCarousel.module.css';

interface Partner {
    _id: string;
    name: string;
    shopLogo: string;
    specialization?: string;
}

interface PartnersCarouselProps {
    partners: Partner[];
    title?: string;
}

export default function PartnersCarousel({ 
    partners, 
    title = "Conheça alguns de nossos parceiros" 
}: PartnersCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setIsPaused(true);
        startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
        scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setIsPaused(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsPaused(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
        const walk = (x - startX.current) * 2;
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollLeft.current - walk;
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
                // Altere o valor abaixo (ex: 0.2). Valores maiores = mais rápido.
                accumulator += 0.5; 
                
                if (accumulator >= 1) {
                    container.scrollLeft += Math.floor(accumulator);
                    accumulator -= Math.floor(accumulator);
                }
                
                // Infinite loop reset
                // Since we extended the array (partners * 4), we reset when halfway
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

    if (!partners || partners.length === 0) {
        return null;
    }

    return (
        <section className={styles.sectionContainer}>
            <h2 className={styles.title}>{title}</h2>
            
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
                    {partners.map((partner, index) => (
                        <div key={`${partner._id}-${index}`} className={styles.itemContainer}>
                            <div className={styles.logoContainer}>
                                <Image
                                    src={partner.shopLogo || '/placeholder-petshop.png'}
                                    alt={partner.name}
                                    width={50}
                                    height={50}
                                    className={styles.logo}
                                />
                            </div>
                            
                            <div className={styles.infoColumn}>
                                <div className={styles.nameRow}>
                                    <span className={styles.name}>{partner.name}</span>
                                    <BadgeCheck 
                                        size={18} 
                                        strokeWidth={2} 
                                        className={styles.checkIcon}
                                    />
                                </div>
                                <span className={styles.specialization}>
                                    {partner.specialization || 'Petshop'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
