"use client";

import { useEffect, useState } from 'react';
import { Calendar, Clock, User, Check, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function PartnerAppointmentsPage() {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = () => {
        fetch('/api/appointments')
            .then(res => res.json())
            .then(data => {
                setAppointments(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                showToast('Status atualizado!');
                fetchAppointments();
            } else {
                showToast('Erro ao atualizar', 'error');
            }
        } catch (error) {
            showToast('Erro ao atualizar', 'error');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            pending: { bg: '#fff3cd', text: '#856404' },
            confirmed: { bg: '#cce5ff', text: '#004085' },
            completed: { bg: '#d4edda', text: '#155724' },
            cancelled: { bg: '#f8d7da', text: '#721c24' },
        };
        return colors[status] || colors.pending;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pendente',
            confirmed: 'Confirmado',
            completed: 'Concluído',
            cancelled: 'Cancelado',
        };
        return labels[status] || status;
    };

    const filteredAppointments = filter === 'all'
        ? appointments
        : appointments.filter(a => a.status === filter);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div>
            <h1 className="section-title">Agendamentos</h1>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: filter === status ? '2px solid #6CC551' : '1px solid #ddd',
                            background: filter === status ? '#e8f5e9' : 'white',
                            cursor: 'pointer',
                            fontWeight: filter === status ? 600 : 400,
                        }}
                    >
                        {status === 'all' ? 'Todos' : getStatusLabel(status)}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center' }}>
                    <Calendar size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666' }}>Nenhum agendamento encontrado</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {filteredAppointments.map(appointment => {
                        const statusColor = getStatusColor(appointment.status);
                        const appointmentDate = new Date(appointment.date);

                        return (
                            <div key={appointment._id} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                            {appointment.serviceId?.name || 'Serviço'}
                                        </h3>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                color: statusColor.text,
                                                background: statusColor.bg,
                                            }}
                                        >
                                            {getStatusLabel(appointment.status)}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.3rem' }}>Data</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={16} />
                                            <span style={{ fontWeight: 600 }}>{appointmentDate.toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.3rem' }}>Horário</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={16} />
                                            <span style={{ fontWeight: 600 }}>{appointment.time}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.3rem' }}>Cliente</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={16} />
                                            <span style={{ fontWeight: 600 }}>{appointment.userId?.name || 'Cliente'}</span>
                                        </div>
                                    </div>
                                </div>

                                {appointment.petId && (
                                    <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                                            {appointment.petId.photo && (
                                                <img src={appointment.petId.photo} alt={appointment.petId.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            )}
                                            <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Pet: {appointment.petId.name}</p>
                                        </div>

                                        <div style={{ fontSize: '0.85rem', color: '#444', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                {appointment.petId.species === 'dog' && '🐕'}
                                                {appointment.petId.species === 'cat' && '🐈'}
                                                {appointment.petId.species === 'bird' && '🦜'}
                                                {appointment.petId.species === 'other' && '🐾'}
                                                {appointment.petId.breed || 'Sem raça'}
                                            </span>
                                            {appointment.petId.gender && <span><strong>Gênero:</strong> {appointment.petId.gender === 'male' ? 'Macho' : 'Fêmea'}</span>}
                                            {appointment.petId.size && <span><strong>Porte:</strong> {
                                                appointment.petId.size === 'mini' ? 'Mini' :
                                                    appointment.petId.size === 'small' ? 'Pequeno' :
                                                        appointment.petId.size === 'medium' ? 'Médio' :
                                                            appointment.petId.size === 'large' ? 'Grande' : 'Gigante'
                                            }</span>}
                                            {appointment.petId.age && <span><strong>Idade:</strong> {appointment.petId.age} anos</span>}
                                            {appointment.petId.isVaccinated !== undefined && (
                                                <span style={{ color: appointment.petId.isVaccinated ? '#2e7d32' : '#c62828', fontWeight: 600 }}>
                                                    Vacinação: {appointment.petId.isVaccinated ? '✓ Em dia' : '✗ Pendente'}
                                                </span>
                                            )}
                                        </div>

                                        {appointment.petId.temperament && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                                                <p style={{ fontSize: '0.85rem', margin: 0 }}><strong>Temperamento:</strong> {appointment.petId.temperament}</p>
                                            </div>
                                        )}

                                        {appointment.petId.medicalNotes && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px', border: '1px solid #ffcdd2' }}>
                                                <p style={{ fontSize: '0.85rem', color: '#c62828', margin: 0 }}><strong>Notas Médicas:</strong> {appointment.petId.medicalNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {appointment.notes && (
                                    <div style={{ padding: '0.8rem', background: '#fff3cd', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Observações:</p>
                                        {appointment.notes}
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {appointment.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                                                style={{ padding: '0.6rem 1rem', background: '#6CC551', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <Check size={18} />
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                                                style={{ padding: '0.6rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <X size={18} />
                                                Recusar
                                            </button>
                                        </>
                                    )}

                                    {appointment.status === 'confirmed' && (
                                        <button
                                            onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                                            style={{ padding: '0.6rem 1rem', background: '#6CC551', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Marcar como Concluído
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
