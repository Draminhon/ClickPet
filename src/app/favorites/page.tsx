"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Package, Scissors, Store, X } from 'lucide-react';
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
                setFavorites(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleRemove = async (favorite: any) => {
        const params = new URLSearchParams();
        if (favorite.partnerId) params.append('partnerId', favorite.partnerId._id);
        else if (favorite.serviceId) params.append('serviceId', favorite.serviceId._id);

        await fetch(`/api/favorites?${params}`, { method: 'DELETE' });
        setFavorites(prev => prev.filter(f => f._id !== favorite._id));
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
                <p>Carregando...</p>
            </div>
        );
    }

    const productFavorites = favorites.filter(f => f.productId);
    const serviceFavorites = favorites.filter(f => f.serviceId);
    const partnerFavorites = favorites.filter(f => f.partnerId);
    const isEmpty = productFavorites.length === 0 && serviceFavorites.length === 0 && partnerFavorites.length === 0;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <Heart size={32} color="#ff4757" fill="#ff4757" />
                <h1 className="section-title" style={{ margin: 0 }}>Meus Favoritos</h1>
            </div>

            {isEmpty ? (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Package size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666', marginBottom: '1rem' }}>Você ainda não tem favoritos</p>
                    <a href="/" className="btn btn-primary">Explorar Produtos</a>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '2.5rem' }}>
                    {productFavorites.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: '1.3rem', color: '#253D4E', marginBottom: '1rem' }}>
                                <Package size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                Produtos ({productFavorites.length})
                            </h2>
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
                        </section>
                    )}

                    {serviceFavorites.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: '1.3rem', color: '#253D4E', marginBottom: '1rem' }}>
                                <Scissors size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                Serviços ({serviceFavorites.length})
                            </h2>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {serviceFavorites.map(favorite => {
                                    const service = favorite.serviceId;
                                    if (!service) return null;

                                    return (
                                        <div
                                            key={favorite._id}
                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                        >
                                            <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', background: '#F8F9FA', flexShrink: 0, position: 'relative' }}>
                                                <Image
                                                    src={service.image || '/placeholder-service.png'}
                                                    alt={service.name}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                            <Link href={`/services/${service._id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                                                <div style={{ fontWeight: 700, color: '#253D4E' }}>{service.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    Oferecido por {service.partnerId?.name || 'Parceiro'}
                                                </div>
                                            </Link>
                                            <button
                                                onClick={() => handleRemove(favorite)}
                                                title="Remover dos favoritos"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '8px' }}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {partnerFavorites.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: '1.3rem', color: '#253D4E', marginBottom: '1rem' }}>
                                <Store size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                Lojas e Veterinários ({partnerFavorites.length})
                            </h2>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {partnerFavorites.map(favorite => {
                                    const partner = favorite.partnerId;
                                    if (!partner) return null;
                                    const isVet = partner.role === 'veterinarian';

                                    return (
                                        <div
                                            key={favorite._id}
                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                        >
                                            <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: '#F8F9FA', flexShrink: 0, position: 'relative' }}>
                                                <Image
                                                    src={partner.shopLogo || partner.image || '/placeholder-product.png'}
                                                    alt={partner.name}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                            <Link href={isVet ? `/clinica/${partner._id}` : `/loja/${partner._id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                                                <div style={{ fontWeight: 700, color: '#253D4E' }}>{partner.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    {isVet ? 'Veterinário(a)' : (partner.specialization || 'Petshop')}
                                                </div>
                                            </Link>
                                            <button
                                                onClick={() => handleRemove(favorite)}
                                                title="Remover dos favoritos"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '8px' }}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
