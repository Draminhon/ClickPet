"use client";

import Image from 'next/image';
import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import styles from './ProductOfferCard.module.css';

interface ProductOfferCardProps {
    id: string;
    title: string;
    price: number;
    image: string;
    discount: number;
    shopName?: string;
    productType?: string;
    subCategory?: string;
    rating?: number;
    salesCount?: number;
}

export default function ProductOfferCard({
    id,
    title,
    price,
    image,
    discount,
    shopName = 'Petshop',
    productType = 'Produto',
    subCategory = 'Geral',
    rating = 5.0,
    salesCount = 0
}: ProductOfferCardProps) {
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const currentPrice = price * (1 - discount / 100);

    // Formatting sales count as per requirements
    const formattedSales = salesCount > 100 ? '+100' : salesCount.toString();

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
            id,
            title,
            price: currentPrice,
            shopName
        });
        showToast('Produto adicionado ao carrinho!');
    };

    return (
        <div className={styles.card}>
            {discount > 0 && (
                <div className={styles.discountBadge}>
                    <span className={styles.discountText}>{discount}%</span>
                </div>
            )}

            <div className={styles.imageContainer}>
                <Image
                    src={image || '/placeholder-product.png'}
                    alt={title}
                    width={200}
                    height={200}
                    className={styles.productImage}
                />
            </div>

            <div className={styles.infoContainer}>
                <span className={styles.productType}>{productType}</span>
                <h3 className={styles.productTitle}>{title}</h3>

                <div className={styles.subCategoryBadge}>
                    {subCategory}
                </div>

                <div className={styles.ratingRow}>
                    <div className={styles.stars}>
                        <Star size={18} fill="#E3A653" stroke="none" />
                    </div>
                    <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
                    <div className={styles.divider} />
                    <span className={styles.salesCount}>{formattedSales}</span>
                </div>

                <div className={styles.priceRow}>
                    <div className={styles.prices}>
                        <span className={styles.currentPrice}>
                            R$ {currentPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className={styles.originalPrice}>
                            R$ {price.toFixed(2).replace('.', ',')}
                        </span>
                    </div>

                    <button className={styles.addBtn} onClick={handleAdd} title="Adicionar ao carrinho">
                        <ShoppingCart size={15} className={styles.cartIcon} />
                    </button>
                </div>
            </div>
        </div>
    );
}
