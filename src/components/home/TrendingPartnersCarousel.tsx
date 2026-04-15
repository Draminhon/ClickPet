'use client';

import { useRef, useEffect, useState } from 'react';
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
    // Mock attributes for UI representation since they are not fully developed in DB yet
    averageResponseTime?: string;
    isOpen?: boolean;
}

interface TrendingPartnersCarouselProps {
    partners: Partner[];
}

export default function TrendingPartnersCarousel({ partners }: TrendingPartnersCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let animationFrame: number;
        
        // Auto-scroll logic
        const scroll = () => {
            if (!isPaused && container) {
                container.scrollLeft += 0.6; // Speed adjustment
                
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

    if (!partners || partners.length === 0) return null;

    return (
        <section 
            className={styles.carouselContainer}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className={styles.carouselTrack} ref={scrollRef}>
                {partners.map((partner, index) => {
                    const shopType = partner.specialization || 'Petshop';
                    const distanceStr = partner.distance !== undefined 
                        ? `${partner.distance.toFixed(1)} km` 
                        : 'Calculando...';
                    
                    const responseTime = partner.averageResponseTime || '30-60 min';
                    
                    // Real status check
                    const isOpen = partner.workingHours ? isShopOpen(partner.workingHours) : false;

                    return (
                        <Link href={`/loja/${partner._id}`} key={`${partner._id}-${index}`} className={styles.card}>
                            {/* Fotografia da loja */}
                            <div className={styles.imageWrapper}>
                                <Image 
                                    src={partner.shopLogo || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop'} 
                                    alt={partner.name}
                                    fill
                                    sizes="80px"
                                    className={styles.shopImage}
                                />
                            </div>

                            {/* Detalhes da loja em Coluna */}
                            <div className={styles.detailsColumn}>
                                <div className={styles.nameRow}>
                                    <h3 className={styles.shopName}>{partner.name}</h3>
                                    <BadgeCheck className={styles.badge} size={22} fill="currentColor" color="white" />
                                </div>

                                <div className={styles.infoRow}>
                                    <span className={styles.infoText}>{shopType}</span>
                                    <span className={styles.bullet}>•</span>
                                    <span className={styles.infoText}>{distanceStr}</span>
                                </div>

                                <div className={styles.infoRow}>
                                    <span className={styles.infoText}>{responseTime}</span>
                                    <span className={styles.bullet}>•</span>
                                    <span className={isOpen ? styles.statusOpen : styles.statusClosed}>
                                        {isOpen ? 'Loja aberta' : 'Loja fechada'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    );
}
