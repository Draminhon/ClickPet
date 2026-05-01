"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Star, ChevronUp, ChevronDown, Info, Truck, User, X, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useSession } from 'next-auth/react';
import OffersCarousel from '@/components/home/OffersCarousel';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import styles from './ProductDetail.module.css';
interface Product {
    _id: string;
    title: string;
    description: string;
    price: number;
    discount: number;
    image: string;
    images: string[];
    productType: string;
    subCategory: string;
    category?: string;
    rating: number;
    salesCount: number;
    weights: string[];
    partnerId?: any;
}

interface Review {
    _id: string;
    userId: {
        _id: string;
        name: string;
        image?: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

export default function ProductDetailPage() {
    const { id } = useParams();
    const { data: session } = useSession();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState('');
    const [selectedWeight, setSelectedWeight] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('info');
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0 });

    const { addToCart } = useCart();
    const { showToast } = useToast();

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/reviews?productId=${id}`);
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews);
                setStats({
                    avgRating: data.avgRating,
                    totalReviews: data.totalReviews
                });
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products/${id}`);
                const data = await response.json();
                setProduct(data);
                setCurrentImage(data.image);
                if (data.weights && data.weights.length > 0) {
                    setSelectedWeight(data.weights[0]);
                }

                // Fetch related products
                const categoryParam = data.category ? `?category=${data.category}` : '';
                const relatedRes = await fetch(`/api/products${categoryParam}`);
                const relatedData = await relatedRes.json();
                setRelatedProducts(relatedData.filter((p: Product) => p._id !== data._id).slice(0, 10));

                // Fetch real reviews
                fetchReviews();
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const handleApplyReview = async (e: React.FormEvent) => {
        e.preventDefault();
        const p = product;
        if (!p) return;
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: id,
                    partnerId: typeof p.partnerId === 'object'
                        ? p.partnerId?._id?.toString()
                        : p.partnerId?.toString(),
                    rating: newReview.rating,
                    comment: newReview.comment
                })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Avaliação enviada com sucesso!');
                setShowReviewForm(false);
                setNewReview({ rating: 5, comment: '' });
                fetchReviews(); // Refresh review list
            } else {
                showToast(data.message || 'Erro ao enviar avaliação');
            }
        } catch (error) {
            showToast('Erro de conexão ao enviar avaliação');
        }
    };

    if (loading) return <div className={styles.container}>Carregando...</div>;
    if (!product) return <div className={styles.container}>Produto não encontrado.</div>;

    const currentPrice = product.price * (1 - product.discount / 100);
    const allImages = [product.image, ...(product.images || [])].filter(img => img);
    const safeRating = product.rating ?? 0;
    const safeSalesCount = product.salesCount ?? 0;

    const handleAddToCart = () => {
        const p = product;
        if (!p) return;

        // AUTH CHECK FOR GUESTS
        if (!session) {
            setShowAuthModal(true);
            return;
        }

        // partnerId may be populated (object) or a raw string
        const pid = typeof p.partnerId === 'object' 
            ? p.partnerId?._id?.toString() || p.partnerId?.toString()
            : p.partnerId?.toString();
        const shopName = typeof p.partnerId === 'object' 
            ? p.partnerId?.name || 'Petshop'
            : 'Petshop';
        addToCart({
            id: p._id,
            title: p.title,
            price: currentPrice,
            shopName,
            image: p.image,
            productType: p.productType || 'Produto',
            subCategory: p.subCategory || 'Geral',
            selectedWeight: selectedWeight,
            partnerId: pid,
        }, quantity);
        showToast('Produto adicionado ao carrinho!');
    };

    return (
        <div className={styles.container}>
            <div className={styles.productRow}>
                {/* Left Column - Images */}
                <div className={styles.leftColumn}>
                    <div className={styles.mainImageContainer}>
                        <Image
                            src={currentImage || '/placeholder-product.png'}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                            className={styles.mainImage}
                        />
                    </div>

                    <div className={styles.thumbnailsRow}>
                        {allImages.map((img, idx) => (
                            <div
                                key={idx}
                                className={`${styles.thumbnailContainer} ${currentImage === img ? styles.active : ''}`}
                                onClick={() => setCurrentImage(img)}
                            >
                                <Image
                                    src={img}
                                    alt={`${product.title} ${idx + 1}`}
                                    width={100}
                                    height={100}
                                    className={styles.thumbnailImage}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column - Info */}
                <div className={styles.rightColumn}>
                    <h1 className={styles.title}>{product.title}</h1>

                    <div className={styles.ratingRow}>
                        <div className={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={17.04}
                                    fill={stats.totalReviews > 0 && i < Math.floor(stats.avgRating) ? "#E3A653" : "none"}
                                    stroke="#E3A653"
                                />
                            ))}
                        </div>
                        <span className={styles.ratingValue}>
                            {stats.totalReviews > 0 ? stats.avgRating.toFixed(1) : "0.0"}
                        </span>
                        <span className={styles.bullet}>•</span>
                        <span className={styles.reviewsCount}>
                            {stats.totalReviews > 0 ? `${stats.totalReviews} Avaliações` : "Nenhuma avaliação"}
                        </span>
                    </div>

                    <div className={styles.price}>
                        R$ {currentPrice.toFixed(2).replace('.', ',')}
                    </div>

                    <div className={styles.divider} />

                    <p className={styles.description}>{product.description}</p>

                    <div className={styles.divider} />

                    <div className={styles.weightsRow}>
                        <span className={styles.weightLabel}>Peso:</span>
                        {product.weights && product.weights.length > 0 ? (
                            product.weights.map((w) => (
                                <div
                                    key={w}
                                    className={selectedWeight === w ? styles.weightItemActive : styles.weightItem}
                                    onClick={() => setSelectedWeight(w)}
                                >
                                    {w}
                                </div>
                            ))
                        ) : (
                            <span className={styles.weightItem}>Não informado</span>
                        )}
                    </div>
                    <div className={styles.divider} />

                    <div className={styles.actionsContainer}>
                        <div className={styles.quantityAndPriceRow}>
                            <div className={styles.quantitySelector}>
                                <span className={styles.quantityValue}>{quantity}</span>
                                <div className={styles.quantityControls}>
                                    <button
                                        className={styles.quantityBtn}
                                        onClick={() => setQuantity(q => q + 1)}
                                    >
                                        <ChevronUp size={16} />
                                    </button>
                                    <button
                                        className={styles.quantityBtn}
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            </div>

                            <span className={styles.totalPrice}>
                                R$ {(currentPrice * quantity).toFixed(2).replace('.', ',')}
                            </span>
                        </div>

                        <button className={styles.addToCartBtn} onClick={handleAddToCart}>
                            ADICIONAR AO CARRINHO
                        </button>
                    </div>
                </div>
            </div>

            {/* Auth Modal Overlay */}
            {showAuthModal && (
                <div className={styles.authModalOverlay} onClick={() => setShowAuthModal(false)}>
                    <div className={styles.authModalCard} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setShowAuthModal(false)}>
                            <X size={24} />
                        </button>

                        <div className={styles.authModalIcon}>
                            <AlertCircle size={64} strokeWidth={1.5} />
                        </div>

                        <h2 className={styles.authModalTitle}>Atenção!</h2>
                        <p className={styles.authModalText}>
                            Você precisa ter uma conta ativa e estar logado para adicionar itens ao carrinho e continuar com sua compra.
                        </p>

                        <div className={styles.authModalButtons}>
                            <Link href={`/login?callbackUrl=/product/${id}`} className={styles.loginBtn}>
                                Entrar Agora
                            </Link>
                            <Link href={`/register?callbackUrl=/product/${id}`} className={styles.registerBtn}>
                                Não tem uma conta ainda? Cadastre-se
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.tabsRow}>
                <button
                    className={`${styles.tab} ${activeTab === 'info' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    <Info className={styles.tabIcon} />
                    Info do produto
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'shipping' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('shipping')}
                >
                    <Truck className={styles.tabIcon} />
                    Envio do produto
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    <Star className={styles.tabIcon} />
                    Avaliações
                </button>
            </div>

            <div className={styles.tabContentBox}>
                {activeTab === 'info' && (
                    <div>
                        <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>Detalhes do Produto</h3>
                        <p>{product.description}</p>
                    </div>
                )}
                {activeTab === 'shipping' && (
                    <div>
                        <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>Informações de Envio</h3>
                        <p>O envio é realizado pelo petshop parceiro. O prazo de entrega varia de acordo com a sua localização e o método de envio selecionado no checkout.</p>
                        <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
                            <li>Entrega Expressa: 1-2 dias úteis</li>
                            <li>Entrega Padrão: 3-5 dias úteis</li>
                        </ul>
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div className={styles.reviewsSection}>
                        <div className={styles.reviewHeader}>
                            <div>
                                <h3 style={{ marginBottom: '5px', fontSize: '24px', fontWeight: 700 }}>Comentários Recentes</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ fontSize: '32px', fontWeight: 700 }}>{stats.avgRating.toFixed(1)}</div>
                                    <div>
                                        <div style={{ display: 'flex' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={18} fill={i < Math.floor(stats.avgRating) ? "#E3A653" : "none"} stroke="#E3A653" />
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#666' }}>Baseado em {stats.totalReviews} avaliações</div>
                                    </div>
                                </div>
                            </div>
                            {session && (
                                <button className={styles.evaluateBtn} onClick={() => setShowReviewForm(!showReviewForm)}>
                                    {showReviewForm ? 'Fechar Avaliação' : 'Avaliar Produto'}
                                </button>
                            )}
                        </div>

                        {showReviewForm && (
                            <div className={styles.reviewForm}>
                                <h4 className={styles.formTitle}>Deixe sua avaliação</h4>
                                <form onSubmit={handleApplyReview}>
                                    <div className={styles.formGroup}>
                                        <label>Sua nota:</label>
                                        <div className={styles.ratingInput}>
                                            {[...Array(5)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={styles.starBtn}
                                                    onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                                                >
                                                    <Star
                                                        size={24}
                                                        fill={i < newReview.rating ? "#E3A653" : "none"}
                                                        stroke="#E3A653"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Seu comentário:</label>
                                        <textarea
                                            className={styles.formTextarea}
                                            placeholder="Conte-nos o que achou do produto..."
                                            value={newReview.comment}
                                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className={styles.submitReviewBtn}>
                                        Enviar Avaliação
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className={styles.reviewsList} style={{ marginTop: '20px' }}>
                            {reviews.map((review, index) => (
                                <div key={review._id}>
                                    <div className={styles.reviewItem}>
                                        <div className={styles.avatarWrapper}>
                                            {review.userId?.image ? (
                                                <Image
                                                    src={review.userId.image}
                                                    alt={review.userId.name || 'Usuário'}
                                                    width={100}
                                                    height={100}
                                                    className={styles.reviewerAvatar}
                                                />
                                            ) : (
                                                <div className={styles.avatarIconFallback}>
                                                    <User size={50} color="#3BB77E" />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.reviewContent}>
                                            <div className={styles.reviewNameRow}>
                                                <span className={styles.reviewerName}>{review.userId?.name || 'Anônimo'}</span>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            fill={i < review.rating ? "#E3A653" : "none"}
                                                            stroke="#E3A653"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className={styles.reviewDate}>
                                                {new Date(review.createdAt).toLocaleDateString('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <p className={styles.reviewText}>{review.comment}</p>
                                        </div>
                                    </div>
                                    {index < reviews.length - 1 && <div className={styles.reviewDivider} />}
                                </div>
                            ))}
                            {reviews.length === 0 && (
                                <p style={{ textAlign: 'center', color: '#7E7E7E', padding: '20px' }}>
                                    Nenhuma avaliação encontrada para este produto.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={relatedSectionClass}>
                <OffersCarousel products={relatedProducts} title="Produtos Relacionados" hideViewAll />
            </div>
            <Footer />
        </div>
    );
}

const relatedSectionClass = styles.relatedSection;
