"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Star, ChevronUp, ChevronDown, Info, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import OffersCarousel from '@/components/home/OffersCarousel';
import Footer from '@/components/layout/Footer';
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
    rating: number;
    salesCount: number;
    weights: string[];
}

export default function ProductDetailPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState('');
    const [selectedWeight, setSelectedWeight] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('info');
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

    const { addToCart } = useCart();
    const { showToast } = useToast();

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
                const relatedRes = await fetch(`/api/products?category=${data.category}`);
                const relatedData = await relatedRes.json();
                setRelatedProducts(relatedData.filter((p: Product) => p._id !== data._id).slice(0, 10));
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

    if (loading) return <div className={styles.container}>Carregando...</div>;
    if (!product) return <div className={styles.container}>Produto não encontrado.</div>;

    const currentPrice = product.price * (1 - product.discount / 100);
    const allImages = [product.image, ...(product.images || [])].filter(img => img);

    const handleAddToCart = () => {
        addToCart({
            id: product._id,
            title: product.title,
            price: currentPrice,
            shopName: 'Petshop', // Normally this would come from the product
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
                                    fill={i < Math.floor(product.rating) ? "#E3A653" : "none"}
                                    stroke={i < Math.floor(product.rating) ? "none" : "#E3A653"}
                                />
                            ))}
                        </div>
                        <span className={styles.ratingValue}>{product.rating.toFixed(1)}</span>
                        <span className={styles.bullet}>•</span>
                        <span className={styles.reviewsCount}>{product.salesCount} Avaliações</span>
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
                    <div>
                        <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>Avaliações dos Clientes</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '32px', fontWeight: 700 }}>{product.rating.toFixed(1)}</div>
                            <div>
                                <div style={{ display: 'flex' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} fill={i < Math.floor(product.rating) ? "#E3A653" : "none"} stroke="#E3A653" />
                                    ))}
                                </div>
                                <div style={{ fontSize: '14px', color: '#666' }}>Baseado em {product.salesCount} avaliações</div>
                            </div>
                        </div>
                        <p>Ainda não há avaliações detalhadas para este produto.</p>
                    </div>
                )}
            </div>

            <div className={styles.relatedSection}>
                <OffersCarousel products={relatedProducts} title="Produtos Relacionados" hideViewAll />
            </div>
        </div>
    );
}
