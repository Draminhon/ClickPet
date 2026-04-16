import { notFound } from 'next/navigation';
export const dynamic = "force-dynamic";
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Star, Search, Truck, ChevronDown } from 'lucide-react';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import Service from '@/models/Service';
import styles from './profile.module.css';
import { isShopOpen } from '@/utils/shopUtils';
import StoreSearchHeader from '@/components/store/StoreSearchHeader';
import StoreCatalog from '@/components/store/StoreCatalog';

interface StoreProfilePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function StoreProfilePage({ params }: StoreProfilePageProps) {
    const { id } = await params;
    await dbConnect();

    if (!id || id.length !== 24) {
        notFound();
    }

    const partner = await User.findById(id);

    if (!partner || partner.role !== 'partner') {
        notFound();
    }

    const shopName = partner.name || 'Loja Parceira';
    const specialization = partner.specialization || 'Petshop';
    const shopLogo = partner.shopLogo || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=400&fit=crop';
    const bannerUrl = partner.bannerImage || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1920&h=400&fit=crop';

    // Real Status Logic
    const isOpen = isShopOpen(partner.workingHours);

    // Real Data Fetch
    const products = await Product.find({ partnerId: id, isActive: true }).lean();
    const services = await Service.find({ partnerId: id, isActive: true }).lean();

    const mappedProducts = products.map((p: any) => ({
        id: p._id.toString(),
        name: p.title,
        tags: [p.productType, p.subCategory].filter(Boolean),
        desc: p.description,
        oldPrice: p.discount > 0 ? p.price.toFixed(2).replace('.', ',') : null,
        price: (p.price * (1 - (p.discount || 0) / 100)).toFixed(2).replace('.', ','),
        img: p.image || '/placeholder-product.png'
    }));

    const mappedServices = services.map((s: any) => ({
        id: s._id.toString(), // Note: Service page might not exist, but let's keep link structure for now or adjust
        name: s.name,
        tags: [s.category, s.species, s.duration ? `${s.duration} min` : null].filter(Boolean),
        desc: s.description,
        oldPrice: null,
        price: s.prices?.[0]?.price?.toFixed(2).replace('.', ',') || '0,00',
        img: s.image || '/placeholder-service.png'
    }));

    const racoes = mappedProducts.filter((p: any) => products.find(orig => (orig as any)._id.toString() === p.id)?.category === 'food');
    const utensilios = mappedProducts.filter((p: any) => ['accessories', 'toys'].includes(products.find(orig => (orig as any)._id.toString() === p.id)?.category));
    const servicos = mappedServices;

    const hasContent = racoes.length > 0 || utensilios.length > 0 || servicos.length > 0;

    return (
        <div className={styles.container}>
            {/* ── Cover Banner ────────────────────────────────────── */}
            <div className={styles.bannerWrapper}>
                {partner.bannerImage ? (
                    <Image
                        src={partner.bannerImage}
                        alt={`Capa da loja ${shopName}`}
                        fill
                        priority
                        className={styles.bannerImage}
                    />
                ) : (
                    <div className={styles.emptyBannerPlaceholder}></div>
                )}
            </div>

            {/* ── Content Area ────────────────────────────────────── */}
            <div className={styles.contentWrapper}>

                {/* Overlapping Avatar */}
                <div className={styles.avatarOverlapContainer}>
                    <Image
                        src={shopLogo}
                        alt={`Logo da loja ${shopName}`}
                        fill
                        className={styles.shopProfileImage}
                        sizes="200px"
                    />
                </div>

                {/* Open / Closed pill under avatar */}
                <div className={styles.storeStatusContainer}>
                    <span className={`${styles.statusText} ${isOpen ? styles.openTheme : styles.closedTheme}`}>
                        {isOpen ? 'Loja aberta' : 'Loja fechada'}
                    </span>
                </div>

                {/* ── Profile Information (to the right of the avatar) ── */}
                <div className={styles.shopInfoSection}>
                    <h1 className={styles.shopName}>
                        {shopName}
                        <BadgeCheck size={28} fill="#EC802B" color="#FFFFFF" className={styles.badgeIcon} />
                    </h1>

                    <div className={styles.metaRow}>
                        <div className={styles.metaLeft}>
                            <span className={styles.specializationText}>{specialization}</span>
                            <span className={styles.bullet}>•</span>
                            <Star 
                                size={18} 
                                fill={partner.reviewCount > 0 ? "#FFD700" : "none"} 
                                color={partner.reviewCount > 0 ? "#FFD700" : "#ccc"} 
                                className={styles.starIcon} 
                            />
                            <span className={styles.ratingText}>
                                {partner.reviewCount > 0 
                                    ? `${partner.rating?.toFixed(1)} (${partner.reviewCount} avaliações)`
                                    : 'Nenhuma avaliação'
                                }
                            </span>
                        </div>

                        {/* Response time & minimum order - Pushed to the right */}
                        <div className={styles.metaWaitTime}>
                            <span>60 - 60 minutos</span>
                            <div className={styles.metaDivider}></div>
                            <span>Pedido mínimo: R$ {partner.minimumOrderValue || 0}</span>
                        </div>
                    </div>
                </div>

                {/* ── Search Bar & Delivery Selector ──────────────── */}
                <StoreSearchHeader shopName={shopName} />

                {/* ── Catalog Sections ────────────────────────────── */}
                <div style={{ marginTop: '24px', paddingBottom: '100px' }}>
                    {hasContent ? (
                        <StoreCatalog 
                            racoes={racoes} 
                            utensilios={utensilios} 
                            servicos={servicos} 
                        />
                    ) : (
                        <div className={styles.emptyStateContainer}>
                            <p className={styles.emptyStateText}>Esta loja ainda não cadastrou produtos ou serviços.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
