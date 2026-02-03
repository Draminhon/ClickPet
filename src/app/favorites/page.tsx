"use client";

import { useEffect, useState } from 'react';
import { Heart, Package } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = () => {
        fetch('/api/favorites')
            .then(res => res.json())
            .then(data => {
                setFavorites(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
                <p>Carregando...</p>
            </div>
        );
    }

    const productFavorites = favorites.filter(f => f.productId);

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <Heart size={32} color="#ff4757" fill="#ff4757" />
                <h1 className="section-title" style={{ margin: 0 }}>Meus Favoritos</h1>
            </div>

            {productFavorites.length === 0 ? (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Package size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666', marginBottom: '1rem' }}>Você ainda não tem favoritos</p>
                    <a href="/" className="btn btn-primary">Explorar Produtos</a>
                </div>
            ) : (
                <>
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                        {productFavorites.length} {productFavorites.length === 1 ? 'produto favoritado' : 'produtos favoritados'}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                        {productFavorites.map(favorite => {
                            const product = favorite.productId;
                            if (!product) return null;

                            return (
                                <ProductCard
                                    key={favorite._id}
                                    id={product._id}
                                    title={product.title}
                                    shopName={product.partnerId?.name || 'Parceiro'}
                                    price={product.price}
                                    image={product.image}
                                    discount={product.discount}
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
