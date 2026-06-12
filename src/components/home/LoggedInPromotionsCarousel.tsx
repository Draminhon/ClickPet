'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './LoggedInPromotionsCarousel.module.css';

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
        image: '/assets/promo/promo.png',
        link: '/search?category=Ração'
    },
    {
        id: '2',
        title: 'Banho e Tosa Profissional',
        tag: 'Serviços',
        image: '/assets/promo/promo.png',
        link: '/partners'
    },
    {
        id: '3',
        title: 'Acessórios para Gatos',
        tag: 'Novidade',
        image: '/assets/promo/promo.png',
        link: '/search?category=Gatos'
    },
    {
        id: '4',
        title: 'Brinquedos Diversos',
        tag: 'Promo',
        image: '/assets/promo/promo.png',
        link: '/search?category=Brinquedos'
    }
];

export default function LoggedInPromotionsCarousel() {
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

        const firstCard = container.querySelector(`.${styles.promoContainer}`);
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

        const firstCard = container.querySelector(`.${styles.promoContainer}`);
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
        
        // Manual wheel handling
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
    }, []);

    return (
        <section className={styles.sectionContainer}>
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
                        {DEMO_PROMOS.map((promo, index) => (
                            <div 
                                key={`${promo.id}-${index}`}
                                className={styles.promoContainer}
                            >
                                <Image
                                    src={promo.image}
                                    alt={promo.title}
                                    fill
                                    sizes="500px"
                                    className={styles.promoImage}
                                />
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
