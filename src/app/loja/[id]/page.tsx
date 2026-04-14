import { notFound } from 'next/navigation';
import Image from 'next/image';
import { BadgeCheck, Star } from 'lucide-react';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import styles from './profile.module.css';

interface StoreProfilePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function StoreProfilePage({ params }: StoreProfilePageProps) {
    const { id } = await params;
    await dbConnect();
    
    // Fallback security against invalid ObjectIds
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
    
    // We will use a default vibrant gradient banner if the user doesn't have an explicit Cover Image yet
    const bannerUrl = partner.bannerImage || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1920&h=400&fit=crop';

    // UI Math Mocks for Ratings tied uniquely to the Store ID
    const sum = partner._id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const mockRating = ((sum % 2) + 3.8).toFixed(1);
    const mockReviews = (sum % 150) + 12; 

    return (
        <div className={styles.container}>
            {/* Header / Cover Banner */}
            <div className={styles.bannerWrapper}>
                <Image 
                    src={bannerUrl}
                    alt={`Capa da loja ${shopName}`}
                    fill
                    priority
                    className={styles.bannerImage}
                />
            </div>

            {/* Main Content Area containing the overlapped Avatar */}
            <div className={styles.contentWrapper}>
                
                {/* 150x150 Overlapping Avatar */}
                <div className={styles.avatarOverlapContainer}>
                    <Image 
                        src={shopLogo}
                        alt={`Logo da loja ${shopName}`}
                        fill
                        className={styles.shopProfileImage}
                        sizes="200px"
                    />
                </div>

                {/* Profile Information Block */}
                <div className={styles.shopInfoSection}>
                    <h1 className={styles.shopName}>
                        {shopName}
                        <BadgeCheck size={28} fill="#EC802B" color="#FFFFFF" className={styles.badgeIcon} />
                    </h1>
                    
                    <div className={styles.metaRow}>
                        <span className={styles.specializationText}>{specialization}</span>
                        <span className={styles.bullet}>•</span>
                        <Star size={18} fill="#FFD700" color="#FFD700" className={styles.starIcon} />
                        <span className={styles.ratingText}>{mockRating} ({mockReviews} avaliações)</span>
                    </div>
                </div>

                {/* The rest of the page (Catalog, Services, Reviews) will be injected here in the future */}
                <div style={{ marginTop: '40px', paddingLeft: '310px', color: '#878787' }}>
                    <p>Mais detalhes e produtos estarão disponíveis aqui em breve...</p>
                </div>

            </div>
        </div>
    );
}
