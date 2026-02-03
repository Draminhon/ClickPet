"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Scissors } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ServicesPage() {
    const { data: session } = useSession();
    const [services, setServices] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Fetch all services
                // In a real app, you might want to paginate or filter by location
                const res = await fetch('/api/services');
                const data = await res.json();
                setServices(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch services", error);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    const filteredServices = services.filter(service => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (service.name?.toLowerCase().includes(query)) ||
            (service.description?.toLowerCase().includes(query)) ||
            (service.partnerId?.name?.toLowerCase().includes(query));

        const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 className="section-title">Agendar Serviços</h1>

            {/* Filters */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar serviço, pet shop ou veterinário..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '12px', border: '1px solid #ddd' }}
                    />
                </div>

                <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', background: 'white', minWidth: '200px' }}
                >
                    <option value="all">Todas as Categorias</option>
                    <option value="bath">Banho</option>
                    <option value="grooming">Tosa</option>
                    <option value="veterinary">Veterinário</option>
                    <option value="training">Adestramento</option>
                    <option value="aquarismo">Aquarismo</option>
                    <option value="other">Outro</option>
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando serviços...</div>
            ) : filteredServices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>
                    <Scissors size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666' }}>Nenhum serviço encontrado.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredServices.map(service => (
                        <Link href={`/services/${service._id}`} key={service._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '200px', background: '#f0f0f0', position: 'relative' }}>
                                    {service.image ? (
                                        <img src={service.image} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <Scissors size={48} color="#ccc" />
                                        </div>
                                    )}
                                    <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {getCategoryLabel(service.category)}
                                    </span>
                                </div>

                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem' }}>{service.name}</h3>
                                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        {service.partnerId?.name || 'Parceiro'}
                                    </p>

                                    <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {service.description}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: '#999', display: 'block' }}>A partir de</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6CC551' }}>
                                                R$ {Math.min(...service.prices.map((p: any) => p.price)).toFixed(2)}
                                            </span>
                                        </div>
                                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                            Ver Detalhes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
