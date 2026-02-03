"use client";

import { useEffect, useState } from 'react';
import { Plus, Scissors } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ServicesPage() {
    const { data: session } = useSession();
    const [services, setServices] = useState<any[]>([]);

    useEffect(() => {
        if (session?.user?.id) {
            fetch(`/api/services?partnerId=${session.user.id}`)
                .then(res => res.json())
                .then(data => setServices(data));
        }
    }, [session]);

    const getCategoryLabel = (category: string) => {
        const labels: any = {
            bath: 'Banho',
            grooming: 'Tosa',
            veterinary: 'Veterinário',
            training: 'Adestramento',
            aquarismo: 'Aquarismo',
            other: 'Outro'
        };
        return labels[category] || category;
    };

    const getSizeLabel = (size: string) => {
        const labels: any = {
            small: 'Pequeno',
            medium: 'Médio',
            large: 'Grande',
            xlarge: 'Extra Grande'
        };
        return labels[size] || size;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Serviços</h1>
                <Link href="/partner/services/new" className="btn btn-primary">
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Novo Serviço
                </Link>
            </div>

            {services.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <Scissors size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666' }}>
                        Nenhum serviço cadastrado. Comece adicionando seus serviços!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {services.map(service => (
                        <div key={service._id} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', background: '#f0f0f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {service.image ? (
                                        <img src={service.image} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Scissors size={40} color="#ccc" />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{service.name}</h3>
                                        <span style={{ background: '#6CC551', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {getCategoryLabel(service.category)}
                                        </span>
                                    </div>
                                    <p style={{ color: '#666', marginBottom: '1rem' }}>{service.description}</p>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem' }}>
                                        {service.prices.map((priceItem: any, idx: number) => (
                                            <div key={idx} style={{ background: '#f9f9f9', padding: '0.8rem', borderRadius: '8px' }}>
                                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>{getSizeLabel(priceItem.size)}</p>
                                                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6CC551' }}>R$ {priceItem.price.toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
