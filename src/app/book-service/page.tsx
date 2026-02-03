"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, User as UserIcon } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

function BookServiceContent() {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');
    const { showToast } = useToast();
    const router = useRouter();

    const [service, setService] = useState<any>(null);
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedPet, setSelectedPet] = useState('');
    const [notes, setNotes] = useState('');

    const availableTimes = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    useEffect(() => {
        if (serviceId) {
            // Fetch service details
            fetch(`/api/services?id=${serviceId}`)
                .then(res => res.json())
                .then(data => {
                    const foundService = Array.isArray(data) ? data.find((s: any) => s._id === serviceId) : data;
                    setService(foundService);
                    setLoading(false);
                });

            // Fetch user's pets
            fetch('/api/pets')
                .then(res => res.json())
                .then(data => setPets(data));
        }
    }, [serviceId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDate || !selectedTime) {
            showToast('Selecione data e horário', 'error');
            return;
        }

        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId,
                    partnerId: service.partnerId,
                    petId: selectedPet || undefined,
                    date: selectedDate,
                    time: selectedTime,
                    notes,
                }),
            });

            if (res.ok) {
                showToast('Agendamento realizado com sucesso!');
                router.push('/appointments');
            } else {
                showToast('Erro ao agendar', 'error');
            }
        } catch (error) {
            showToast('Erro ao agendar', 'error');
        }
    };

    if (loading) {
        return <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>Carregando...</div>;
    }

    if (!service) {
        return <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>Serviço não encontrado</div>;
    }

    // Get minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 className="section-title">Agendar Serviço</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Service Info */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{service.name}</h2>
                    <p style={{ color: '#666', marginBottom: '1rem' }}>{service.description}</p>

                    <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px', marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Preços por tamanho:</p>
                        {service.pricingBySize && (
                            <div style={{ display: 'grid', gap: '0.3rem' }}>
                                {service.pricingBySize.small && <p><strong>Pequeno:</strong> R$ {service.pricingBySize.small.toFixed(2)}</p>}
                                {service.pricingBySize.medium && <p><strong>Médio:</strong> R$ {service.pricingBySize.medium.toFixed(2)}</p>}
                                {service.pricingBySize.large && <p><strong>Grande:</strong> R$ {service.pricingBySize.large.toFixed(2)}</p>}
                            </div>
                        )}
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                        <strong>Duração estimada:</strong> 1-2 horas
                    </p>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Dados do Agendamento</h3>

                    {/* Pet Selection */}
                    {pets.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                <UserIcon size={18} />
                                Pet (opcional)
                            </label>
                            <select
                                value={selectedPet}
                                onChange={e => setSelectedPet(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="">Selecione um pet</option>
                                {pets.map(pet => (
                                    <option key={pet._id} value={pet._id}>{pet.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Calendar size={18} />
                            Data *
                        </label>
                        <input
                            type="date"
                            required
                            min={minDate}
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    {/* Time Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <Clock size={18} />
                            Horário *
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            {availableTimes.map(time => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => setSelectedTime(time)}
                                    style={{
                                        padding: '0.6rem',
                                        borderRadius: '6px',
                                        border: selectedTime === time ? '2px solid #6CC551' : '1px solid #ddd',
                                        background: selectedTime === time ? '#e8f5e9' : 'white',
                                        cursor: 'pointer',
                                        fontWeight: selectedTime === time ? 600 : 400,
                                    }}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                            Observações
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            maxLength={500}
                            placeholder="Alguma informação adicional..."
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', fontFamily: 'inherit' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Confirmar Agendamento
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function BookServicePage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>Carregando...</div>}>
            <BookServiceContent />
        </Suspense>
    );
}
