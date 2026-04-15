"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StoreGrid from '@/components/home/StoreGrid';
import { useLocation } from '@/context/LocationContext';
import styles from './Partners.module.css';

export default function PartnersPage() {
    const { lat, lng, address, isLoading: isLocationLoading } = useLocation();
    const [partners, setPartners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!lat || !lng) {
            if (!isLocationLoading) {
                setIsLoading(false);
            }
            return;
        }

        const fetchNearby = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&radius=20`); // Larger default radius for "Ver Mais"
                if (!res.ok) throw new Error('Falha ao buscar lojas parceiras');
                const data = await res.json();
                setPartners(data.petshops || []);
            } catch (err) {
                console.error('Error fetching nearby partners:', err);
                setError('Ocorreu um erro ao carregar as lojas. Tente novamente mais tarde.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchNearby();
    }, [lat, lng, isLocationLoading]);

    return (
        <main>
            <Header />
            
            <div className={styles.container}>
                {!lat || !lng ? (
                    <div className={styles.empty}>
                        <h2>Encontre lojas na sua região</h2>
                        <p>Informe seu endereço no topo da página para ver todos os parceiros disponíveis para você.</p>
                    </div>
                ) : isLoading ? (
                    <div className={styles.loading}>
                        Carregando lojas próximas a você...
                    </div>
                ) : error ? (
                    <div className={styles.empty}>
                        <p>{error}</p>
                    </div>
                ) : partners.length === 0 ? (
                    <div className={styles.empty}>
                        <h2>Nenhuma loja encontrada</h2>
                        <p>Infelizmente ainda não temos parceiros atendendo na região de {address}.</p>
                    </div>
                ) : (
                    <StoreGrid 
                        partners={partners} 
                        limit={500} 
                        title={`Lojas em ${address.split(',')[0]}`} 
                        hideViewMore={true}
                    />
                )}
            </div>

            <Footer />
        </main>
    );
}
