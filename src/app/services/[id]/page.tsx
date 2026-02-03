"use client";

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Calendar, Clock, MapPin, Scissors, Check, Star } from 'lucide-react';

export default function ServiceDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const { data: session } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    const [service, setService] = useState<any>(null);
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Booking State
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedPet, setSelectedPet] = useState('');
    const [notes, setNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Service Details
                const serviceRes = await fetch(`/api/services/${params.id}`);
                const serviceData = await serviceRes.json();

                if (!serviceRes.ok) throw new Error('Service not found');
                setService(serviceData);

                // Fetch User's Pets if logged in
                if (session) {
                    const petsRes = await fetch('/api/pets');
                    const petsData = await petsRes.json();
                    setPets(Array.isArray(petsData) ? petsData : []);
                    if (petsData.length > 0) setSelectedPet(petsData[0]._id);
                }
            } catch (error) {
                console.error(error);
                showToast('Erro ao carregar serviço', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchData();
    }, [params.id, session]);

    const handleBook = async () => {
        if (!session) {
            router.push(`/login?callbackUrl=/services/${params.id}`);
            return;
        }

        if (!selectedDate || !selectedTime || !selectedPet) {
            showToast('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        setBookingLoading(true);

        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: service._id,
                    partnerId: service.partnerId._id,
                    date: selectedDate,
                    time: selectedTime,
                    petId: selectedPet,
                    notes
                }),
            });

            if (res.ok) {
                showToast('Agendamento solicitado com sucesso!');
                router.push('/appointments'); // Or profile
            } else {
                const data = await res.json();
                showToast(data.message || 'Erro ao agendar', 'error');
            }
        } catch (error) {
            showToast('Erro ao agendar serviço', 'error');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Carregando...</div>;
    if (!service) return <div className="container">Serviço não encontrado</div>;

    // Generate time slots (simplified)
    const timeSlots = [
        '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: '2rem' }}>

                {/* Left Column: Details */}
                <div>
                    <div style={{ height: '300px', background: '#f0f0f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem' }}>
                        {service.image ? (
                            <img src={service.image} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Scissors size={64} color="#ccc" />
                            </div>
                        )}
                    </div>

                    <h1 style={{ marginBottom: '0.5rem' }}>{service.name}</h1>
                    <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                        Oferecido por: <strong>{service.partnerId?.name}</strong>
                    </p>

                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Sobre o Serviço</h2>
                        <p style={{ lineHeight: '1.6', color: '#444' }}>{service.description}</p>

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={20} color="#6CC551" />
                                <span>Duração aprox: {service.duration || 60} min</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={20} color="#6CC551" />
                                <span>Ver endereço no mapa</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Tabela de Preços</h2>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {service.prices.map((p: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                    <span>{p.size === 'small' ? 'Pequeno' : p.size === 'medium' ? 'Médio' : p.size === 'large' ? 'Grande' : 'Gigante'}</span>
                                    <span style={{ fontWeight: 700 }}>R$ {p.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking */}
                <div>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'sticky', top: '2rem' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={24} color="#6CC551" />
                            Agendar Horário
                        </h2>

                        {!session ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <p style={{ marginBottom: '1rem' }}>Faça login para agendar</p>
                                <button onClick={() => router.push(`/login?callbackUrl=/services/${params.id}`)} className="btn btn-primary" style={{ width: '100%' }}>
                                    Entrar
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Data</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Horário</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                        {timeSlots.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: selectedTime === time ? '2px solid #6CC551' : '1px solid #ddd',
                                                    background: selectedTime === time ? '#e8f5e9' : 'white',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    color: selectedTime === time ? '#6CC551' : '#333'
                                                }}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pet</label>
                                    {pets.length > 0 ? (
                                        <select
                                            value={selectedPet}
                                            onChange={e => setSelectedPet(e.target.value)}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                        >
                                            {pets.map(pet => (
                                                <option key={pet._id} value={pet._id}>{pet.name} ({pet.species})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{ fontSize: '0.9rem', color: '#dc3545' }}>
                                            Você precisa cadastrar um pet primeiro. <a href="/profile" style={{ textDecoration: 'underline' }}>Ir para perfil</a>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Observações</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Alguma restrição ou pedido especial?"
                                        rows={3}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>

                                <button
                                    onClick={handleBook}
                                    disabled={bookingLoading || pets.length === 0}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                >
                                    {bookingLoading ? 'Agendando...' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
