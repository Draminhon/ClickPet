'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, Star, ChevronDown } from 'lucide-react';
import styles from './StoreGrid.module.css';
import { isShopOpen } from '@/utils/shopUtils';

interface Partner {
    _id: string;
    name: string;
    shopLogo: string;
    specialization?: string;
    distance?: number;
    workingHours?: any[];
    isOpen?: boolean;
    rating?: number;
    reviewCount?: number;
    role?: string;
}

interface StoreGridProps {
    partners: Partner[];
    allPartners?: Partner[];
    limit?: number;
    title?: string;
    hideViewMore?: boolean;
}

export default function StoreGrid({ partners, allPartners, limit, title = "Lojas", hideViewMore = false }: StoreGridProps) {
    const displayLimit = limit || 15;
    
    // States for filter chips
    const [isAll, setIsAll] = useState(true);
    const [isVet, setIsVet] = useState(false);
    const [isPetshop, setIsPetshop] = useState(false);
    
    // Dropdown visibility states
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Helper to detect if a partner is a vet/clinic
    const isClinicOrVet = (p: Partner) => 
        p.role === 'veterinarian' || !!p.specialization?.match(/Veterinária|Hospital|Clínica/i);

    // Filter Logic
    // "Todos" = show everything from allPartners
    // "Veterinário" = show only vets from allPartners
    // "Petshop" = show only petshops from partners
    // No filter = show only petshops from partners (default)
    const sourceList = (isAll || isVet) ? (allPartners || partners) : partners;
    const filteredPartners = sourceList.filter(p => {
        if (isAll) return true; // Show everything
        if (isVet && !isClinicOrVet(p)) return false;
        if (isPetshop && isClinicOrVet(p)) return false;
        return true;
    });

    const displayedPartners = filteredPartners.slice(0, displayLimit);

    const toggleFilter = (type: string) => {
        if (type === 'all') {
            setIsAll(true);
            setIsVet(false);
            setIsPetshop(false);
        }
        if (type === 'vet') {
            setIsVet(!isVet);
            setIsAll(false);
            if (!isVet) setIsPetshop(false);
        }
        if (type === 'petshop') {
            setIsPetshop(!isPetshop);
            setIsAll(false);
            if (!isPetshop) setIsVet(false);
        }
    };




    const toggleDropdown = (name: string) => {
        if (openDropdown === name) setOpenDropdown(null);
        else setOpenDropdown(name);
    };

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>{title}</h2>
            
            {/* Filters Row */}
            <div className={styles.filtersRow}>
                
                {/* Ordenar Dropdown */}
                <div className={styles.dropdownWrapper}>
                    <button className={styles.chip} onClick={() => toggleDropdown('ordenar')}>
                        <span className={styles.chipText}>Ordenar</span>
                        <ChevronDown className={styles.icon} />
                    </button>
                    {openDropdown === 'ordenar' && (
                        <div className={styles.dropdownMenu}>
                            <button className={styles.dropdownItem} onClick={() => setOpenDropdown(null)}>Mais populares</button>
                            <button className={styles.dropdownItem} onClick={() => setOpenDropdown(null)}>Melhor avaliados</button>
                            <button className={styles.dropdownItem} onClick={() => setOpenDropdown(null)}>Mais rápidos</button>
                        </div>
                    )}
                </div>

                {/* Toggles */}
                <button className={isAll ? styles.chipActive : styles.chip} onClick={() => toggleFilter('all')}>
                    <span className={isAll ? styles.chipTextActive : styles.chipText}>Todos</span>
                </button>
                
                <button className={isVet ? styles.chipActive : styles.chip} onClick={() => toggleFilter('vet')}>
                    <span className={isVet ? styles.chipTextActive : styles.chipText}>Veterinário</span>
                </button>
                
                <button className={isPetshop ? styles.chipActive : styles.chip} onClick={() => toggleFilter('petshop')}>
                    <span className={isPetshop ? styles.chipTextActive : styles.chipText}>Petshop</span>
                </button>

                {/* Distância Dropdown */}
                <div className={styles.dropdownWrapper}>
                    <button className={styles.chip} onClick={() => toggleDropdown('distancia')}>
                        <span className={styles.chipText}>Distância</span>
                        <ChevronDown className={styles.icon} />
                    </button>
                    {openDropdown === 'distancia' && (
                        <div className={styles.dropdownMenu}>
                            <button className={styles.dropdownItem} onClick={() => setOpenDropdown(null)}>Até 2 km</button>
                            <button className={styles.dropdownItem} onClick={() => setOpenDropdown(null)}>Até 5 km</button>
                            <button className={styles.dropdownItem} onClick={() => setOpenDropdown(null)}>Até 10 km</button>
                        </div>
                    )}
                </div>

                {/* Filtros Dropdown */}
                <div className={styles.dropdownWrapper}>
                    <button className={styles.chip} onClick={() => toggleDropdown('filtros')}>
                        <span className={styles.chipText}>Filtros</span>
                        <ChevronDown className={styles.icon} />
                    </button>
                    {openDropdown === 'filtros' && (
                        <div className={styles.dropdownMenu}>
                            <button className={styles.dropdownItem} onClick={() => setOpenDropdown(null)}>Com desconto</button>
                            <button className={styles.dropdownItem} onClick={() => setOpenDropdown(null)}>Aceita convênio</button>
                        </div>
                    )}
                </div>

            </div>

            {/* Application Grid */}
            <div className={styles.grid}>
                {displayedPartners.map(partner => {
                    const shopType = partner.specialization || 'Petshop';
                    const distanceStr = partner.distance != null 
                        ? `${partner.distance.toFixed(1)} km` 
                        : 'Calculando...';
                    
                    const partnerRating = (partner.rating ?? 0).toFixed(1);
                    const partnerReviewCount = partner.reviewCount ?? 0;
                    const isOpen = partner.workingHours ? isShopOpen(partner.workingHours) : false;
                    const isClinic = isClinicOrVet(partner);
                    const specificInfoString = isClinic ? 'Especializado' : '30-45 min';
                    const linkHref = isClinic ? `/clinica/${partner._id}` : `/loja/${partner._id}`;

                    return (
                        <Link href={linkHref} key={partner._id} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                <Image 
                                    src={partner.shopLogo || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop'} 
                                    alt={partner.name}
                                    fill
                                    sizes="110px"
                                    className={styles.shopImage}
                                />
                            </div>

                            <div className={styles.detailsColumn}>
                                <div className={styles.nameRow}>
                                    <h3 className={styles.shopName}>{partner.name}</h3>
                                    <BadgeCheck className={styles.badge} size={22} fill="currentColor" color="white" />
                                </div>

                                <div className={styles.infoLine}>
                                    <span>{isClinic ? 'Veterinário' : shopType}</span>
                                    <span className={styles.bullet}>•</span>
                                    <span>{distanceStr}</span>
                                </div>

                                <div className={styles.ratingLine}>
                                    <Star className={styles.starIcon} size={17.12} fill="currentColor" />
                                    <span>{partnerRating} ({partnerReviewCount} avaliações)</span>
                                </div>

                                <div className={styles.statusLine}>
                                    {isClinic ? (
                                        <span style={{ color: '#ED802A', fontWeight: 400, fontSize: '14px' }}>{shopType}</span>
                                    ) : (
                                        <>
                                            <span>{specificInfoString}</span>
                                            <span className={styles.bullet}>•</span>
                                            <span className={isOpen ? styles.statusOpen : styles.statusClosed}>
                                                {isOpen ? 'Aberto' : 'Fechado'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Permanent Link Button to Expanded Shop Page */}
            {!hideViewMore && (
                <div className={styles.viewMoreWrapper}>
                    <Link 
                        href="/partners"
                        className={styles.viewMoreButton} 
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        Ver mais
                    </Link>
                </div>
            )}

        </section>
    );
}
