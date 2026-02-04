"use client";

import ProductOfferCard from './ProductOfferCard';
import styles from './OffersCarousel.module.css';

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
}

export default function OffersCarousel({ products }: OffersCarouselProps) {
    if (!products || products.length === 0) {
        return (
            <section className={styles.section}>
                <h2 className={styles.title}>Últimas ofertas</h2>
                <div className={styles.noOffers}>
                    Nenhuma oferta disponível no momento.
                </div>
            </section>
        );
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>Últimas ofertas</h2>
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
