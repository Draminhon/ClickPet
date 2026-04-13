"use client";

import { useState, useEffect } from 'react';
import TrendingPartnersCarousel from '@/components/home/TrendingPartnersCarousel';
import LoggedInPromotionsCarousel from '@/components/home/LoggedInPromotionsCarousel';
import LoggedInClinicsCarousel from '@/components/home/LoggedInClinicsCarousel';
import StoreGrid from '@/components/home/StoreGrid';
import { useLocation } from '@/context/LocationContext';
import styles from './Home.module.css';

interface LoggedInHomeContentProps {
    defaultPartners: any[];
}

export default function LoggedInHomeContent({ defaultPartners }: LoggedInHomeContentProps) {
    const { lat, lng } = useLocation();
    const [nearbyPartners, setNearbyPartners] = useState<any[]>(defaultPartners);

    useEffect(() => {
        let isMounted = true;

        const fetchNearbyItems = async () => {
            if (!lat || !lng) {
                // If location is cleared, revert to defaults
                setNearbyPartners(defaultPartners);
                return;
            }

            try {
                const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=15`);
                if (!res.ok) throw new Error('Falha ao buscar lojas parceiras próximas');
                
                const data = await res.json();
                
                if (isMounted) {
                    setNearbyPartners(data.petshops || []);
                }
            } catch (error) {
                if (isMounted) setNearbyPartners(defaultPartners);
            }
        };

        fetchNearbyItems();

        return () => {
            isMounted = false;
        };
    }, [lat, lng, defaultPartners]);

    if (nearbyPartners.length === 0) return null;

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
