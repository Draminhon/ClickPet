'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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

        const firstCard = container.querySelector(`.${styles.itemContainer}`);
        if (!firstCard) return;

        const cardWidth = firstCard.clientWidth;
        const style = window.getComputedStyle(container.querySelector(`.${styles.carouselTrack}`) || container);
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

        const firstCard = container.querySelector(`.${styles.itemContainer}`);
        if (!firstCard) return;

        const cardWidth = firstCard.clientWidth;
        const style = window.getComputedStyle(container.querySelector(`.${styles.carouselTrack}`) || container);
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

    if (!partners || partners.length === 0) {
        return null;
    }

    return (
        <section className={styles.sectionContainer}>
            <h2 className={styles.title}>{title}</h2>
            
            <div className={styles.carouselContainer}>
                {/* Left Arrow */}
                {showArrows && (
                    <button className={`${styles.navBtn} ${styles.navBtnLeft}`} onClick={scrollPrev} aria-label="Anterior">
                        <ChevronLeft size={24} />
                    </button>
                )}

                <div 
                    className={styles.carouselWrapper}
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
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
                                    <span className={styles.specialization} style={partner.specialization ? { color: '#ED802A', fontWeight: 400, fontSize: '14px' } : {}}>
                                        {partner.specialization || 'Petshop'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Arrow */}
                {showArrows && (
                    <button className={`${styles.navBtn} ${styles.navBtnRight}`} onClick={scrollNext} aria-label="Próximo">
                        <ChevronRight size={24} />
                    </button>
                )}
            </div>
        </section>
    );
}
