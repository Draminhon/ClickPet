'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './TrendingPartnersCarousel.module.css';
import { isShopOpen } from '@/utils/shopUtils';

interface Partner {
    _id: string;
    name: string;
    shopLogo: string;
    specialization?: string;
    distance?: number;
    workingHours?: any[];
    averageResponseTime?: string;
    isOpen?: boolean;
}

interface TrendingPartnersCarouselProps {
    partners: Partner[];
}

export default function TrendingPartnersCarousel({ partners }: TrendingPartnersCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);
    const isMouseDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const [showArrows, setShowArrows] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        isMouseDown.current = true;
        setHasMoved(false);
        startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
        scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    };

    const handleMouseLeave = () => {
        isMouseDown.current = false;
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        isMouseDown.current = false;
        setTimeout(() => {
            setIsDragging(false);
            setHasMoved(false);
        }, 10);
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

    const scrollNext = () => {
        const container = scrollRef.current;
        if (!container) return;

        const firstCard = container.querySelector(`.${styles.card}`);
        if (!firstCard) return;

        const cardWidth = firstCard.clientWidth;
        const style = window.getComputedStyle(container);
        const gap = parseInt(style.columnGap || style.gap || '32', 10) || 32;
        const scrollAmount = cardWidth + gap;
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScroll - 15) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const scrollPrev = () => {
        const container = scrollRef.current;
        if (!container) return;

        const firstCard = container.querySelector(`.${styles.card}`);
        if (!firstCard) return;

        const cardWidth = firstCard.clientWidth;
        const style = window.getComputedStyle(container);
        const gap = parseInt(style.columnGap || style.gap || '32', 10) || 32;
        const scrollAmount = cardWidth + gap;
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft <= 15) {
            container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        
        // Manual wheel handling (translate vertical to horizontal)
        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            setShowArrows(container.scrollWidth > container.clientWidth);
        });
        resizeObserver.observe(container);

        setShowArrows(container.scrollWidth > container.clientWidth);

        return () => {
            resizeObserver.disconnect();
        };
    }, [partners]);

    if (!partners || partners.length === 0) return null;

    return (
        <section className={styles.carouselContainer} style={{ position: 'relative' }}>
            {/* Left Arrow */}
            {showArrows && (
                <button className={`${styles.navBtn} ${styles.navBtnLeft}`} onClick={scrollPrev} aria-label="Anterior">
                    <ChevronLeft size={24} />
                </button>
            )}

            <div 
                className={styles.carouselTrack} 
                ref={scrollRef} 
                style={{ 
                    pointerEvents: isDragging ? 'none' : 'auto',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {partners.map((partner, index) => {
                    const shopType = partner.specialization || 'Petshop';
                    const distanceStr = partner.distance != null 
                        ? `${partner.distance.toFixed(1)} km` 
                        : 'Calculando...';
                    
                    const responseTime = partner.averageResponseTime || '30-60 min';
                    const isOpen = partner.workingHours ? isShopOpen(partner.workingHours) : false;

                    return (
                        <Link 
                            href={`/loja/${partner._id}`} 
                            key={`${partner._id}-${index}`} 
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
                                    <BadgeCheck className={styles.badge} size={28} fill="currentColor" color="white" />
                                </div>

                                <div className={styles.infoRow}>
                                    <span className={styles.infoText}>{shopType}</span>
                                    <span className={styles.bullet}>•</span>
                                    <span className={styles.infoText}>{distanceStr}</span>
                                </div>

                                <div className={styles.infoRow}>
                                    {partner.specialization && !partner.specialization.includes('Petshop') ? (
                                        <span style={{ color: '#ED802A', fontWeight: 400, fontSize: '14px' }}>{partner.specialization}</span>
                                    ) : (
                                        <>
                                            <span className={styles.infoText}>{responseTime}</span>
                                            <span className={styles.bullet}>•</span>
                                            <span className={isOpen ? styles.statusOpen : styles.statusClosed}>
                                                {isOpen ? 'Loja aberta' : 'Loja fechada'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Right Arrow */}
            {showArrows && (
                <button className={`${styles.navBtn} ${styles.navBtnRight}`} onClick={scrollNext} aria-label="Próximo">
                    <ChevronRight size={24} />
                </button>
            )}
        </section>
    );
}
