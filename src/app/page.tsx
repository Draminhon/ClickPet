import HeroBanner from '@/components/home/HeroBanner';
import Image from 'next/image';
import Link from 'next/link';
import DynamicHomeContent from '@/components/home/DynamicHomeContent';
import LoggedInHomeContent from '@/components/home/LoggedInHomeContent';
import BottomBanner from '@/components/home/BottomBanner';
import styles from './Home.module.css';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

import { MOCK_PARTNERS, MOCK_CLINICS } from '@/mock/partners';

async function getFeaturedPartners(isClinic = false) {
    await dbConnect();
    
    // Professionals/Partners with logos
    const query: any = {
        shopLogo: { $exists: true, $nin: [null, ''] }
    };

    if (isClinic) {
        // Now clinics should primarily have the veterinarian role
        query.role = { $in: ['veterinarian', 'partner'] };
        query.specialization = { $regex: /Veterinária|Hospital|Clínica/i };
    } else {
        query.role = 'partner';
        query.specialization = { $not: { $regex: /Veterinária|Hospital|Clínica/i } };
    }

    const partners = await User.find(query)
        .select('name shopLogo specialization workingHours role rating reviewCount')
        .limit(30)
        .lean();

    return JSON.parse(JSON.stringify(partners));
}

export default async function HomePage() {
    const session = await getServerSession(authOptions);

    if (session?.user?.role === 'admin') {
        redirect('/admin');
    }

    if (session?.user?.role === 'partner') {
        redirect('/partner/dashboard');
    }

    const [dbPartners, dbClinics] = await Promise.all([
        getFeaturedPartners(false),
        getFeaturedPartners(true)
    ]);

    // Show mocks for logged-in users if data is scarce to prevent empty carousels
    const featuredPartners = (session && dbPartners.length >= 4) ? dbPartners : [...dbPartners, ...MOCK_PARTNERS];
    const veterinaryClinics = (session && dbClinics.length >= 4) ? dbClinics : [...dbClinics, ...MOCK_CLINICS];

    return (
        <div className={styles.homeContainer}>
            {/* Hero Section */}
            <HeroBanner />

            {/* Logged in users get specialized content */}
            {session && (
                <LoggedInHomeContent defaultPartners={featuredPartners} />
            )}

            {/* Everything below is strictly for non-logged-in users */}
            {!session && (
                <>
                    <DynamicHomeContent 
                        defaultPartners={featuredPartners} 
                        defaultClinics={veterinaryClinics} 
                    />

                    {/* CTA Row and Divider */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Link href="/login" style={{ textDecoration: 'none' }}>
                            <div className={styles.ctaRow}>
                                <div className={styles.ctaIconContainer}>
                                    <span className={styles.ctaChevron}>&gt;</span>
                                </div>
                                <span className={styles.ctaText}>Faça sua compra agora mesmo!</span>
                            </div>
                        </Link>
                        
                        <div className={styles.dividerWrapper}>
                            <hr className={styles.pageDivider} />
                        </div>
                    </div>

                    {/* Juntos Branding Section */}
                    <section className={styles.juntosSection}>
                        <div className={styles.juntosLeft}>
                            <div className={styles.juntosTextContainer}>
                                <span className={styles.juntosPart1}>Juntos<span className={styles.juntosComma}>,</span></span>
                                <span className={styles.juntosPart2}>somos a ClickPet.</span>
                            </div>
                            
                            <Link href="/login" style={{ textDecoration: 'none' }}>
                                <div className={styles.ctaRow} style={{ justifyContent: 'flex-start', margin: '0' }}>
                                    <div className={styles.ctaIconContainer}>
                                        <span className={styles.ctaChevron}>&gt;</span>
                                    </div>
                                    <span className={styles.ctaText}>Quero empreender com a ClickPet</span>
                                </div>
                            </Link>
                        </div>

                        <div className={styles.juntosRight}>
                            <Link href="/login" className={styles.imageButton}>
                                <Image 
                                    src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=300&fit=crop" 
                                    alt="Quero comprar" 
                                    fill
                                    sizes="200px"
                                    className={styles.imageButtonFill}
                                />
                                <div className={styles.imageOverlay} />
                                <span className={styles.imageButtonLabel}>Quero comprar</span>
                            </Link>
                            <Link href="/login" className={styles.imageButton}>
                                <Image 
                                    src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=300&fit=crop" 
                                    alt="Quero vender" 
                                    fill
                                    sizes="200px"
                                    className={styles.imageButtonFill}
                                />
                                <div className={styles.imageOverlay} />
                                <span className={styles.imageButtonLabel}>Quero Empreender</span>
                            </Link>
                            <Link href="/about" className={styles.imageButton}>
                                <Image 
                                    src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&h=300&fit=crop" 
                                    alt="Saiba mais" 
                                    fill
                                    sizes="200px"
                                    className={styles.imageButtonFill}
                                />
                                <div className={styles.imageOverlay} />
                                <span className={styles.imageButtonLabel}>Saiba mais</span>
                            </Link>
                        </div>
                    </section>

                    {/* Bottom Banner Section */}
                    <BottomBanner />
                </>
            )}
        </div>
    );
}
