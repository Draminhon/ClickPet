"use client";

import ProductOfferCard from './ProductOfferCard';
import styles from './OffersCarousel.module.css';
import Link from 'next/link';

interface Product {
    _id: string;
    title: string;
    price: number;
    image: string;
    discount: number;
    productType?: string;
    subCategory?: string;
    rating?: number;
    salesCount?: number;
}

interface OffersCarouselProps {
    products: Product[];
    title?: string;
    hideViewAll?: boolean;
}

export default function OffersCarousel({
    products,
    title = 'Últimas ofertas',
    hideViewAll = false
}: OffersCarouselProps) {
    if (!products || products.length === 0) {
        return (
            <section className={styles.section}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    {!hideViewAll && (
                        <Link href="/offers" className={styles.viewAll}>
                            Ver tudo
                        </Link>
                    )}
                </div>
                <div className={styles.noOffers}>
                    Nenhum produto disponível no momento.
                </div>
            </section>
        );
    }

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                {!hideViewAll && (
                    <Link href="/offers" className={styles.viewAll}>
                        Ver tudo
                    </Link>
                )}
            </div>
            <div className={styles.carouselContainer}>
                {products.map((product) => (
                    <ProductOfferCard
                        key={product._id}
                        id={product._id}
                        title={product.title}
                        price={product.price}
                        image={product.image}
                        discount={product.discount}
                        productType={product.productType}
                        subCategory={product.subCategory}
                        rating={product.rating}
                        salesCount={product.salesCount}
                    />
                ))}
            </div>
        </section>
    );
}
