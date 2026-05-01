"use client";

import { useState, useEffect } from 'react';
import TrendingPartnersCarousel from '@/components/home/TrendingPartnersCarousel';
import LoggedInPromotionsCarousel from '@/components/home/LoggedInPromotionsCarousel';
import LoggedInClinicsCarousel from '@/components/home/LoggedInClinicsCarousel';
import StoreGrid from '@/components/home/StoreGrid';
import MissingAddressModal from '@/components/modals/MissingAddressModal';
import { useLocation } from '@/context/LocationContext';
import styles from '@/app/Home.module.css';

interface LoggedInHomeContentProps {
    defaultPartners: any[];
}

export default function LoggedInHomeContent({ defaultPartners }: LoggedInHomeContentProps) {
    const { lat, lng, address, isLoading, setLocationFromGPS } = useLocation();
    const [nearbyPartners, setNearbyPartners] = useState<any[]>(defaultPartners);
    const [showMissingAddressModal, setShowMissingAddressModal] = useState(false);

    useEffect(() => {
        // Don't show the modal if user already has an address OR has set location via header/GPS
        const hasAddress = (address && address.length > 0) || (lat && lng);
        const dismissed = sessionStorage.getItem('clickpet_address_modal_shown');

        if (!hasAddress && !isLoading && !dismissed) {
            const timer = setTimeout(() => {
                setShowMissingAddressModal(true);
                sessionStorage.setItem('clickpet_address_modal_shown', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }

        // If user just set their location (e.g. via header), dismiss the modal if it's showing
        if (hasAddress && showMissingAddressModal) {
            setShowMissingAddressModal(false);
        }
    }, [address, isLoading, lat, lng]);

    useEffect(() => {
        let isMounted = true;

        const fetchNearbyItems = async () => {
            try {
                const url = (lat && lng)
                    ? `/api/nearby?lat=${lat}&lng=${lng}&radius=15`
                    : `/api/nearby`;
                
                const res = await fetch(url);
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

    const clinicsOnly = nearbyPartners.filter(p => 
        p.role === 'veterinarian' || 
        p.specialization?.match(/Veterinária|Hospital|Clínica/i)
    );

    const petshopsOnly = nearbyPartners.filter(p => 
        p.role !== 'veterinarian' && 
        !p.specialization?.match(/Veterinária|Hospital|Clínica/i)
    );

    const hasLocation = lat && lng;

    const NoLocationMessage = () => (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '60px 20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px dashed #3BB77E',
            margin: '20px 0',
            textAlign: 'center'
        }}>
            <div style={{ 
                width: '64px', 
                height: '64px', 
                backgroundColor: '#eef7f2', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '20px'
            }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3BB77E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            </div>
            <p style={{ 
                fontFamily: "'Baloo 2', sans-serif", 
                fontSize: '18px', 
                fontWeight: 600, 
                color: '#253D4E',
                maxWidth: '400px',
                lineHeight: '1.4'
            }}>
                Informe seu endereço para ter a experiência completa ClickPet
            </p>
            <button 
                onClick={() => setLocationFromGPS()}
                style={{
                    marginTop: '20px',
                    padding: '10px 24px',
                    backgroundColor: '#3BB77E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2d9063'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3BB77E'}
            >
                Usar minha localização atual
            </button>
        </div>
    );

    return (
        <div className={styles.fullWidthCarousel}>
            
            {/* Trending Partners Carousel */}
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 600, fontSize: '24px', color: '#272727', margin: '0' }}>
                Lojas em alta na sua região
            </h2>
            {!hasLocation ? <NoLocationMessage /> : petshopsOnly.length > 0 ? (
                <TrendingPartnersCarousel partners={petshopsOnly} />
            ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#fff', borderRadius: '12px', margin: '20px 0', color: '#7E7E7E' }}>
                    <p style={{ fontSize: '16px', fontWeight: 500 }}>Nenhuma loja encontrada na sua região no momento.</p>
                </div>
            )}

            <div style={{ marginTop: '48px' }}>
                <LoggedInPromotionsCarousel />
            </div>

            {/* Clinics Carousel */}
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 600, fontSize: '24px', color: '#272727', margin: '48px 0 0 0' }}>
                Clínicas próximas a você
            </h2>
            {!hasLocation ? <NoLocationMessage /> : clinicsOnly.length > 0 ? (
                <LoggedInClinicsCarousel clinics={clinicsOnly} />
            ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#fff', borderRadius: '12px', margin: '20px 0', color: '#7E7E7E' }}>
                    <p style={{ fontSize: '16px', fontWeight: 500 }}>Nenhuma clínica veterinária encontrada na sua região no momento.</p>
                </div>
            )}

            {/* Store Grid */}
            <div style={{ marginTop: '48px' }}>
                <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 600, fontSize: '24px', color: '#272727', marginBottom: '20px' }}>
                    Todas as lojas
                </h2>
                {!hasLocation ? <NoLocationMessage /> : petshopsOnly.length > 0 ? (
                    <StoreGrid partners={petshopsOnly} allPartners={nearbyPartners} />
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#fff', borderRadius: '12px', margin: '20px 0', color: '#7E7E7E' }}>
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>Nenhuma loja encontrada na sua região no momento.</p>
                    </div>
                )}
            </div>

            {showMissingAddressModal && (
                <MissingAddressModal onClose={() => setShowMissingAddressModal(false)} />
            )}
        </div>
    );
}
