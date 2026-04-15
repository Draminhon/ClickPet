"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocation } from '@/context/LocationContext';
import { MapPin, Star, Search } from 'lucide-react';
import styles from './Veterinarios.module.css';

interface Veterinarian {
    _id: string;
    name: string;
    shopLogo: string;
    bannerImage: string;
    specialization: string;
    bio: string;
    whatsapp: string;
    crmv: string;
    distance: number;
}

const SPECIALTIES = ['Todos', 'Clínica Geral', 'Dermatologia', 'Cirurgia', 'Exóticos', 'Felinos', 'Ortopedia'];

export default function VeterinariosPage() {
    const { lat, lng, city } = useLocation();
    const [vets, setVets] = useState<Veterinarian[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Todos');

    useEffect(() => {
        fetchVets();
    }, [lat, lng, filter]);

    const fetchVets = async () => {
        setLoading(true);
        try {
            const url = (lat && lng) 
                ? `/api/nearby?lat=${lat}&lng=${lng}&role=veterinarian&radius=30`
                : `/api/nearby?role=veterinarian`;
            
            const res = await fetch(url);
            const data = await res.json();
            setVets(data.petshops || []);
        } catch (error) {
            console.error('Error fetching vets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVets = filter === 'Todos' 
        ? vets 
        : vets.filter(v => v.specialization?.toLowerCase().includes(filter.toLowerCase()));

    return (
        <main style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
            
            <div className={styles.container}>
                <section className={styles.hero}>
                    <h1>Encontre o Veterinário ideal</h1>
                    <p>Profissionais qualificados próximos a {city || 'você'} prontos para cuidar do seu melhor amigo.</p>
                </section>

                <div className={styles.filters}>
                    {SPECIALTIES.map(s => (
                        <button 
                            key={s} 
                            className={`${styles.filterBtn} ${filter === s ? styles.active : ''}`}
                            onClick={() => setFilter(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#3BB77E', fontWeight: 600 }}>
                        Buscando especialistas na sua região...
                    </div>
                ) : filteredVets.length > 0 ? (
                    <div className={styles.grid}>
                        {filteredVets.map(vet => (
                            <Link href={`/clinica/${vet._id}`} key={vet._id} className={styles.card} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className={styles.cardBanner}>
                                    {vet.bannerImage ? (
                                        <Image src={vet.bannerImage} alt="Clinic Banner" fill />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', backgroundColor: '#eef7f2' }} />
                                    )}
                                    <div className={styles.avatarWrapper}>
                                        <Image 
                                            src={vet.shopLogo || '/assets/placeholder-petshop.png'} 
                                            alt={vet.name} 
                                            fill 
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                </div>
                                
                                <div className={styles.cardContent}>
                                    <h2 className={styles.vetName}>{vet.name}</h2>
                                    <div className={styles.specialization}>{vet.specialization || 'Médico Veterinário'}</div>
                                    <div className={styles.crmv}>CRMV: {vet.crmv || 'Não informado'}</div>
                                    
                                    <p className={styles.bio}>{vet.bio || 'Este profissional ainda não preencheu sua biografia.'}</p>
                                    
                                    {vet.distance !== null && (
                                        <div className={styles.distance}>
                                            <MapPin size={14} />
                                            Está a {vet.distance.toFixed(1)} km de você
                                        </div>
                                    )}

                                    <div className={styles.whatsappBtn} style={{ textAlign: 'center', marginTop: '12px' }}>
                                        Ver perfil completo →
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <Search size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
                        <h3>Nenhum veterinário encontrado nesta região.</h3>
                        <p>Tente aumentar o raio de busca ou selecionar outra especialidade.</p>
                    </div>
                )}
            </div>

        </main>
    );
}
