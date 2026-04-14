'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '@/app/loja/[id]/profile.module.css';

interface Product {
    id: string;
    name: string;
    img: string;
    tags: string[];
    desc: string;
    price: string;
    oldPrice?: string | null;
}

interface StoreCatalogProps {
    racoes: Product[];
    utensilios: Product[];
    servicos: Product[];
}

export default function StoreCatalog({ racoes, utensilios, servicos }: StoreCatalogProps) {
    const PAGE_SIZE = 5;
    const [currentPages, setCurrentPages] = useState<Record<string, number>>({
        racoes: 0,
        utensilios: 0,
        servicos: 0,
    });

    const handlePageChange = (category: string, direction: 'next' | 'prev') => {
        setCurrentPages(prev => ({
            ...prev,
            [category]: direction === 'next' ? prev[category] + 1 : prev[category] - 1,
        }));
    };

    const tagDividerStyle = { width: '2px', height: '14px', backgroundColor: '#DDE1E6', display: 'inline-block' };

    const renderSection = (title: string, items: Product[], categoryId: string) => {
        if (items.length === 0) return null;
        
        const currentPage = currentPages[categoryId];
        const startIndex = currentPage * PAGE_SIZE;
        const visibleItems = items.slice(startIndex, startIndex + PAGE_SIZE);
        
        const totalPages = Math.ceil(items.length / PAGE_SIZE);
        const hasNext = (currentPage + 1) * PAGE_SIZE < items.length;
        const hasPrev = currentPage > 0;

        return (
            <div className={styles.catalogSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{title}</h2>
                    {totalPages > 1 && (
                        <div className={styles.paginationControls}>
                            <button 
                                className={styles.navBtn} 
                                onClick={() => handlePageChange(categoryId, 'prev')}
                                disabled={!hasPrev}
                                title="Página anterior"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className={styles.pageIndicator}>
                                {currentPage + 1} de {totalPages}
                            </span>
                            <button 
                                className={styles.navBtn} 
                                onClick={() => handlePageChange(categoryId, 'next')}
                                disabled={!hasNext}
                                title="Próxima página"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.productGrid}>
                    {visibleItems.map((item, index) => (
                        <div key={`${categoryId}-${item.id}`}>
                            <Link href={`/product/${item.id}`} className={styles.catalogItemRow} style={{ textDecoration: 'none' }}>
                                <div className={styles.productImageFrame}>
                                    <Image src={item.img} alt={item.name} fill sizes="110px" className={styles.productImage} />
                                </div>

                                <div className={styles.productDetailsCol}>
                                    <h3 className={styles.productName}>{item.name}</h3>
                                    <div className={styles.productTags}>
                                        {item.tags.map((tag, tIdx) => (
                                            <span key={tIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {tag}
                                                {tIdx !== item.tags.length - 1 && <span style={tagDividerStyle}></span>}
                                            </span>
                                        ))}
                                    </div>
                                    <p className={styles.productDesc}>{item.desc}</p>
                                </div>

                                <div className={styles.priceCol}>
                                    <div className={styles.oldPriceBlock}>
                                        {item.oldPrice && (
                                            <>
                                                <span>A partir de</span>
                                                <span className={styles.strikedPrice}>R$ {item.oldPrice}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className={styles.mainPriceBlock}>
                                        <span className={styles.pricePrefix}>A partir de</span>
                                        <span className={styles.currentPrice}>R$ {item.price}</span>
                                    </div>
                                    <button className={styles.buyBtn}>Comprar</button>
                                </div>
                            </Link>
                            {index !== visibleItems.length - 1 && <hr className={styles.rowDivider} />}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ marginTop: '24px', paddingBottom: '100px' }}>
            {renderSection('Rações', racoes, 'racoes')}
            {renderSection('Acessórios e Utensílios', utensilios, 'utensilios')}
            {renderSection('Serviços', servicos, 'servicos')}
        </div>
    );
}
