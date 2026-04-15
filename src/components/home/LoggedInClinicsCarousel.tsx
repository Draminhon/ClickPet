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
}

interface LoggedInClinicsCarouselProps {
    clinics: Partner[];
}

export default function LoggedInClinicsCarousel({ clinics }: LoggedInClinicsCarouselProps) {
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
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className={styles.carouselTrack} ref={scrollRef}>
                {clinics.map((clinic, index) => {
                    const shopType = clinic.specialization || 'Clínica Veterinária';
                    const distanceStr = clinic.distance !== undefined 
                        ? `${clinic.distance.toFixed(1)} km` 
                        : 'Calculando...';
                    
                    const isOpen = clinic.workingHours ? isShopOpen(clinic.workingHours) : false;

                    return (
                        <Link href={`/loja/${clinic._id}`} key={`${clinic._id}-${index}`} className={styles.card}>
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
                                    <span className={styles.infoText}>{shopType}</span>
                                    <span className={styles.bullet}>•</span>
                                    <span className={styles.infoText}>{distanceStr}</span>
                                </div>

                                <div className={styles.infoRow}>
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
