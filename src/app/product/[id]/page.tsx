```javascript
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Store } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useSession } from 'next-auth/react';
import StarRating from '@/components/ui/StarRating';
import ReviewForm from '@/components/ui/ReviewForm';

export default function ProductDetails({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { data: session } = useSession();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);

    useEffect(() => {
        if (params.id) {
            // Fetch product
            fetch(`/ api / products / ${ params.id } `)
                .then(res => res.json())
                .then(data => {
                    setProduct(data);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                    router.push('/');
                });

            // Fetch reviews
            fetchReviews();
        }
    }, [params.id, router]);

    const fetchReviews = () => {
        fetch(`/ api / reviews ? productId = ${ params.id } `)
            .then(res => res.json())
            .then(data => {
                setReviews(data.reviews);
                setAvgRating(data.avgRating);
                setTotalReviews(data.totalReviews);
            });
    };

    const handleAddToCart = () => {
        if (!product) return;

        const finalPrice = product.discount
            ? product.price * (1 - product.discount / 100)
            : product.price;

        addToCart({
            id: product._id,
            title: product.title,
            shopName: product.partnerId?.name || 'Petshop',
            price: finalPrice,
        });
        showToast(`${ product.title } adicionado ao carrinho!`);
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
                <p>Carregando...</p>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const finalPrice = product.discount
        ? product.price * (1 - product.discount / 100)
        : product.price;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#666', marginBottom: '2rem', textDecoration: 'none' }}>
                <ArrowLeft size={20} />
                <span>Voltar</span>
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                {/* Product Image */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', borderRadius: '12px', padding: '2rem', minHeight: '400px' }}>
                    {product.image ? (
                        <img src={product.image} alt={product.title} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                    ) : (
                        <span style={{ fontSize: '8rem' }}>📦</span>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    {product.discount > 0 && (
                        <span style={{ display: 'inline-block', background: '#FFC107', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
                            -{product.discount}% OFF
                        </span>
                    )}

                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: '#333' }}>
                        {product.title}
                    </h1>

                    {/* Rating Display */}
                    {totalReviews > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <StarRating rating={Math.round(avgRating)} readonly size={20} />
                            <span style={{ fontSize: '0.95rem', color: '#666' }}>
                                {avgRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#666' }}>
                        <Store size={18} />
                        <span>{product.partnerId?.name || 'Petshop Parceiro'}</span>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        {product.discount > 0 ? (
                            <>
                                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#6CC551', marginBottom: '0.5rem' }}>
                                    R$ {finalPrice.toFixed(2).replace('.', ',')}
                                </p>
                                <p style={{ fontSize: '1.2rem', color: '#999', textDecoration: 'line-through' }}>
                                    R$ {product.price.toFixed(2).replace('.', ',')}
                                </p>
                            </>
                        ) : (
                            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: '#6CC551' }}>
                                R$ {product.price.toFixed(2).replace('.', ',')}
                            </p>
                        )}
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#333' }}>Descrição</h3>
                        <p style={{ color: '#666', lineHeight: '1.6' }}>{product.description}</p>
                    </div>

                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #6CC551' }}>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.3rem' }}>Categoria</p>
                        <p style={{ fontWeight: 600, color: '#333' }}>
                            {product.category === 'food' && '🍖 Rações'}
                            {product.category === 'toys' && '🎾 Brinquedos'}
                            {product.category === 'pharma' && '💊 Farmácia'}
                            {product.category === 'bath' && '🛁 Banho & Tosa'}
                            {product.category === 'vet' && '🏥 Veterinário'}
                        </p>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <ShoppingCart size={20} />
                        Adicionar ao Carrinho
                    </button>
                </div>
            </div>

            {/* Reviews Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Avaliações</h2>

                {/* Review Form */}
                {session && session.user.role === 'customer' && (
                    <div style={{ marginBottom: '2rem' }}>
                        {!showReviewForm ? (
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="btn btn-primary"
                            >
                                Escrever Avaliação
                            </button>
                        ) : (
                            <div>
                                <ReviewForm
                                    productId={product._id}
                                    onSuccess={() => {
                                        setShowReviewForm(false);
                                        fetchReviews();
                                    }}
                                />
                                <button
                                    onClick={() => setShowReviewForm(false)}
                                    style={{ marginTop: '1rem', padding: '0.6rem 1rem', background: '#ddd', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                        Seja o primeiro a avaliar este produto!
                    </p>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {reviews.map((review: any) => (
                            <div key={review._id} style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{review.userId?.name || 'Usuário'}</p>
                                        <StarRating rating={review.rating} readonly size={18} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: '#999' }}>
                                        {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                {review.comment && (
                                    <p style={{ color: '#666', marginTop: '0.8rem', lineHeight: '1.5' }}>{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
