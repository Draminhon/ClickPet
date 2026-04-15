"use client";

import { useState, useEffect } from 'react';
import PartnersCarousel from '@/components/home/PartnersCarousel';
import PromotionsCarousel from '@/components/home/PromotionsCarousel';
import TrendingPartnersCarousel from '@/components/home/TrendingPartnersCarousel';
import LoggedInPromotionsCarousel from '@/components/home/LoggedInPromotionsCarousel';
import LoggedInClinicsCarousel from '@/components/home/LoggedInClinicsCarousel';
import StoreGrid from '@/components/home/StoreGrid';
import { useLocation } from '@/context/LocationContext';
import styles from './Home.module.css';

interface DynamicHomeContentProps {
    defaultPartners: any[];
    defaultClinics: any[];
}

export default function DynamicHomeContent({ defaultPartners, defaultClinics }: DynamicHomeContentProps) {
    const { lat, lng } = useLocation();
    const [nearbyPartners, setNearbyPartners] = useState<any[]>(defaultPartners);
    const [isFiltering, setIsFiltering] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchNearbyItems = async () => {
            if (!lat || !lng) {
                setNearbyPartners(defaultPartners);
                return;
            }

            setIsFiltering(true);
            try {
                const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=15`);
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('[GUEST/HOME] Nearby API error body:', errorData);
                    throw new Error(errorData.message || 'Falha ao buscar lojas parceiras próximas');
                }
                
                const data = await res.json();
                
                if (isMounted) {
                    setNearbyPartners(data.petshops || []);
                    setIsFiltering(false);
                }
            } catch (error) {
                console.error('Error fetching nearby partners:', error);
                if (isMounted) setIsFiltering(false);
            }
        };

        fetchNearbyItems();

        return () => {
            isMounted = false;
        };
    }, [lat, lng, defaultPartners]);

    // Scenario A: No location set - Show simple Landing Page
    if (!lat || !lng) {
        return (
            <>
                <PartnersCarousel 
                    partners={defaultPartners} 
                    title="Conheça alguns de nossos parceiros" 
                />
                <PromotionsCarousel />
                <PartnersCarousel 
                    partners={defaultClinics} 
                    title="Clínicas veterinárias parceiras" 
                />
            </>
        );
    }

    // Scenario B: Location set - Show Zé Delivery / iFood style storefront
    const petshopsOnly = nearbyPartners.filter(p => !p.specialization?.match(/Veterinária|Hospital|Clínica/i));
    const clinicsOnly = nearbyPartners.filter(p => p.specialization?.match(/Veterinária|Hospital|Clínica/i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingLeft: '80px', marginTop: '40px' }}>
            
            {petshopsOnly.length > 0 && (
                <>
                    <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 600, fontSize: '24px', color: '#272727', margin: '0' }}>
                        Lojas em alta na sua região
                    </h2>
                    <TrendingPartnersCarousel partners={petshopsOnly} />
                </>
            )}

            <div style={{ marginTop: petshopsOnly.length > 0 ? '48px' : '0' }}>
                <LoggedInPromotionsCarousel />
            </div>

            {clinicsOnly.length > 0 && (
                <div style={{ marginTop: '48px' }}>
                    <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 600, fontSize: '24px', color: '#272727', margin: '0' }}>
                        Clínicas próximas a você
                    </h2>
                    <LoggedInClinicsCarousel clinics={clinicsOnly} />
                </div>
            )}

            <StoreGrid partners={nearbyPartners} />
        </div>
    );
}
