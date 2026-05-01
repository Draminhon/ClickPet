'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import styles from './TrendingPartnersCarousel.module.css';
import { isShopOpen } from '@/utils/shopUtils';

interface Partner {
    _id: string;
    name: string;
    shopLogo: string;
    specialization?: string;
    distance?: number;
    workingHours?: any[];
}

interface LoggedInClinicsCarouselProps {
    clinics: Partner[];
}

export default function LoggedInClinicsCarousel({ clinics }: LoggedInClinicsCarouselProps) {
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
                // Altere o valor abaixo (ex: 0.2). Valores maiores = mais rápido.
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

    if (!clinics || clinics.length === 0) return null;

    return (
        <section 
            className={styles.carouselContainer}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <div className={styles.carouselTrack} ref={scrollRef} style={isDragging ? { pointerEvents: 'none' } : {}}>
                {clinics.map((clinic, index) => {
                    const shopType = clinic.specialization || 'Clínica Veterinária';
                    const distanceStr = clinic.distance != null 
                        ? `${clinic.distance.toFixed(1)} km` 
                        : 'Calculando...';
                    
                    const isOpen = clinic.workingHours ? isShopOpen(clinic.workingHours) : false;

                    return (
                        <Link 
                            href={`/clinica/${clinic._id}`} 
                            key={`${clinic._id}-${index}`} 
                            className={styles.card}
                            onClick={(e) => {
                                if (hasMoved) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            {/* Fotografia da loja */}
                            <div className={styles.imageWrapper}>
                                <Image 
                                    src={clinic.shopLogo || 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=100&h=100&fit=crop'} 
                                    alt={clinic.name}
                                    fill
                                    sizes="80px"
                                    className={styles.shopImage}
                                />
                            </div>

                            {/* Detalhes da loja em Coluna */}
                            <div className={styles.detailsColumn}>
                                <div className={styles.nameRow}>
                                    <h3 className={styles.shopName}>{clinic.name}</h3>
                                    <BadgeCheck className={styles.badge} size={22} fill="currentColor" color="white" />
                                </div>

                                <div className={styles.infoRow}>
                                    <span className={styles.infoText}>Veterinário</span>
                                    <span className={styles.bullet}>•</span>
                                    <span className={styles.infoText}>{distanceStr}</span>
                                </div>

                                <div className={styles.infoRow}>
                                    <span style={{ color: '#ED802A', fontWeight: 400, fontSize: '14px' }}>{clinic.specialization || 'Clínica Veterinária'}</span>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    );
}
