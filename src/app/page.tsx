import ProductCard from '@/components/ui/ProductCard';
import { ShoppingBag, Scissors, Calendar, Star } from 'lucide-react';
import styles from './Home.module.css';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Link from 'next/link';

async function getProducts() {
    await dbConnect();
    // Fetch only 8 products, sorted by creation date (newest first)
    const products = await Product.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('partnerId', 'name')
        .lean();

    // Convert _id and partnerId._id to string to avoid serialization issues
    return products.map((product: any) => ({
        ...product,
        _id: product._id.toString(),
        partnerId: product.partnerId ? {
            ...product.partnerId,
            _id: product.partnerId._id.toString()
        } : null
    }));
}

export default async function HomePage() {
    const products = await getProducts();

    return (
        <div>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h1 className={styles.heroTitle}>
                        Tudo para seu Pet em um só lugar! 🐾
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Produtos, serviços e muito mais com entrega rápida
                    </p>
                    <div className={styles.heroButtons}>
                        <Link href="/search" className={`btn ${styles.heroBtnPrimary}`}>
                            Ver Produtos
                        </Link>
                        <Link href="/services" className={`btn ${styles.heroBtnSecondary}`}>
                            Agendar Serviço
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className={`container ${styles.categoriesSection}`}>
                <h2 className="section-title">Categorias</h2>
                <div className={styles.categoriesGrid}>
                    {[
                        { icon: '🍖', name: 'Rações', link: '/search?cat=food', color: '#FF6B6B' },
                        { icon: '🎾', name: 'Brinquedos', link: '/search?cat=toys', color: '#4ECDC4' },
                        { icon: '💊', name: 'Farmácia', link: '/search?cat=pharma', color: '#95E1D3' },
                        { icon: '🛁', name: 'Banho & Tosa', link: '/search?cat=bath', color: '#F38181' },
                        { icon: '🐾', name: 'Pets', link: '/search?cat=pets', color: '#FFB84D' },
                    ].map(cat => (
                        <Link
                            key={cat.name}
                            href={cat.link}
                            className={styles.categoryCard}
                            style={{ borderColor: cat.color }}
                        >
                            <div className={styles.categoryIcon}>{cat.icon}</div>
                            <h3 className={styles.categoryName}>{cat.name}</h3>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Products */}
            <section className={`container ${styles.featuredSection}`}>
                <div className={styles.featuredHeader}>
                    <h2 className="section-title" style={{ margin: 0 }}>Produtos em Destaque</h2>
                    <Link href="/search" className={styles.viewAllLink}>
                        Ver todos →
                    </Link>
                </div>

                <div className={styles.productsGrid}>
                    {products.map((product: any) => (
                        <ProductCard
                            key={product._id}
                            id={product._id}
                            title={product.title}
                            shopName={product.partnerId?.name || 'Parceiro'}
                            partnerId={product.partnerId?._id}
                            price={product.price}
                            image={product.image}
                            discount={product.discount}
                        />
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className={styles.featuresSection}>
                <div className="container">
                    <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        Por que escolher o ClickPet?
                    </h2>
                    <div className={styles.featuresGrid}>
                        {[
                            { icon: <ShoppingBag size={40} color="#6CC551" />, title: 'Entrega Rápida', desc: 'Receba em casa com agilidade' },
                            { icon: <Scissors size={40} color="#6CC551" />, title: 'Serviços de Qualidade', desc: 'Banho, tosa e muito mais' },
                            { icon: <Calendar size={40} color="#6CC551" />, title: 'Agendamento Fácil', desc: 'Agende serviços online' },
                            { icon: <Star size={40} color="#6CC551" />, title: 'Avaliações Reais', desc: 'Veja o que outros clientes dizem' },
                        ].map((feature, i) => (
                            <div key={i} className={styles.featureItem}>
                                <div className={styles.featureIcon}>{feature.icon}</div>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureDesc}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
