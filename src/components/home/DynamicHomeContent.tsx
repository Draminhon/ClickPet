"use client";

import { useState, useEffect } from 'react';
import PartnersCarousel from '@/components/home/PartnersCarousel';
import PromotionsCarousel from '@/components/home/PromotionsCarousel';
import { useLocation } from '@/context/LocationContext';

interface DynamicHomeContentProps {
    defaultPartners: any[];
    defaultClinics: any[];
}

export default function DynamicHomeContent({ defaultPartners, defaultClinics }: DynamicHomeContentProps) {
    const { lat, lng } = useLocation();
    const [nearbyPartners, setNearbyPartners] = useState<any[]>(defaultPartners);
    const [nearbyClinics, setNearbyClinics] = useState<any[]>(defaultClinics);
    const [isFiltering, setIsFiltering] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchNearbyItems = async () => {
            if (!lat || !lng) {
                // If location is cleared or missing, revert to defaults
                setNearbyPartners(defaultPartners);
                setNearbyClinics(defaultClinics);
                return;
            }

            setIsFiltering(true);
            try {
                // Radius in km. In a real app, this might be configurable, but we'll use 15 for now.
                const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=15`);
                if (!res.ok) throw new Error('Falha ao buscar lojas parceiras próximas');
                
                const data = await res.json();
                
                if (isMounted) {
                    const fetchedPartners = data.petshops || [];
                    
                    // Split the results based on their specialization string (simulating database categories)
                    // We assume anything with 'Clínica', 'Hospital', 'Veterinári' goes to clinics.
                    const isClinicRegex = /Veterinári|Hospital|Clínica/i;
                    
                    // Wait, the nearby API returns the partner object, but we need to make sure we parse 
                    // the specialization if it exists, or fetch it.
                    // Because /api/nearby doesn't return specialization right now, we might just have to 
                    // render a unified Partner list if we're localized, or ignore the specialization.
                    // For now, let's just display all nearby shops in the first carousel
                    // and keep the clinics carousel static, or hide it if no clinics nearby.
                    
                    // Because we want symmetry:
                    const shops = fetchedPartners;
                    setNearbyPartners(shops);
                    
                    // If no clinics are returned with distance, we might just leave the second carousel empty 
                    // or populate it explicitly.
                    setNearbyClinics([]); 
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
    }, [lat, lng, defaultPartners, defaultClinics]);

    // Format title dynamically based on location status
    const partnersTitle = lat && lng && !isFiltering ? "Petshops perto de você" : "Lojas parceiras em destaque";

    return (
        <>
            <PartnersCarousel 
                partners={nearbyPartners.length > 0 ? nearbyPartners : defaultPartners} 
                title={partnersTitle}
            />

            <PromotionsCarousel />

            {/* Only show clinics carousel if we have them in the context, or if we reverted to defaults */}
            {(nearbyClinics.length > 0 || (!lat && !lng)) && (
                <PartnersCarousel 
                    partners={nearbyClinics} 
                    title="Clínicas veterinárias parceiras" 
                />
            )}
        </>
    );
}
