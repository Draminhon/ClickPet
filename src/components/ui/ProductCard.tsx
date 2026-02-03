"use client";
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import StarRating from './StarRating';
import FavoriteButton from './FavoriteButton';
import styles from './ProductCard.module.css';

interface ProductCardProps {
    id: string;
    title: string;
    shopName: string;
    price: number;
    oldPrice?: number;
    image?: string;
    tag?: string;
    discount?: number;
    partnerId?: string;
}

export default function ProductCard({ id, title, shopName, price, oldPrice, image, tag, discount, partnerId }: ProductCardProps) {
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    useEffect(() => {
        // Fetch rating for this product
        fetch(`/api/reviews?productId=${id}`)
            .then(res => res.json())
            .then(data => {
                setAvgRating(data.avgRating);
                setTotalReviews(data.totalReviews);
            })
            .catch(() => { });
    }, [id]);

    const finalPrice = discount ? price * (1 - discount / 100) : price;

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({ id, title, shopName, price: finalPrice, partnerId });
        showToast(`${title} adicionado ao carrinho!`);
    };

    return (
        <Link href={`/product/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={styles.card}>
                <div className={styles.imageContainer}>
                    {image ? (
                        <img src={image} alt={title} className={styles.image} />
                    ) : (
                        <span style={{ fontSize: '2rem' }}>📦</span>
                    )}
                </div>
                {tag ? <span className={styles.tag}>{tag}</span> : null}
                {discount && discount > 0 ? (
                    <span className={styles.discountTag}>
                        -{discount}%
                    </span>
                ) : null}

                {/* Favorite Button */}
                <div className={styles.favoriteContainer}>
                    <FavoriteButton productId={id} size={20} />
                </div>

                <h3 className={styles.title}>{title}</h3>
                <p className={styles.shopName}>{shopName}</p>

                {/* Rating Display */}
                {totalReviews > 0 && avgRating > 0 && (
                    <div className={styles.ratingContainer}>
                        <StarRating rating={Math.round(avgRating)} readonly size={14} />
                        <span className={styles.reviewCount}>
                            ({totalReviews})
                        </span>
                    </div>
                )}

                <div className={styles.priceRow}>
                    <div>
                        <span className={styles.price}>R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
                        {discount && discount > 0 && (
                            <span className={styles.oldPrice}>R$ {price.toFixed(2).replace('.', ',')}</span>
                        )}
                    </div>
                    <button onClick={handleAdd} className={styles.addButton}>Adicionar</button>
                </div>
            </div>
        </Link>
    );
}
