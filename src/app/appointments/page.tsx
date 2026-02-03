"use client";

import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function AppointmentsPage() {
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleCancel = async (appointmentId: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            });

            if (res.ok) {
                showToast('Agendamento cancelado');
                fetchAppointments();
            } else {
                showToast('Erro ao cancelar', 'error');
            }
        } catch (error) {
            showToast('Erro ao cancelar', 'error');
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

    if (loading) {
        return <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 className="section-title">Meus Agendamentos</h1>

            {appointments.length === 0 ? (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Calendar size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666', marginBottom: '1rem' }}>Você não tem agendamentos</p>
                    <a href="/partner/services" className="btn btn-primary">Ver Serviços Disponíveis</a>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {appointments.map(appointment => {
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

                                    {appointment.status === 'pending' && (
                                        <button
                                            onClick={() => handleCancel(appointment._id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                                        >
                                            <X size={24} />
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
                                        <Calendar size={18} />
                                        <span>{appointmentDate.toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
                                        <Clock size={18} />
                                        <span>{appointment.time}</span>
                                    </div>
                                </div>

                                {appointment.petId && (
                                    <div style={{ padding: '0.8rem', background: '#f9f9f9', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.3rem' }}>Pet:</p>
                                        <p style={{ fontWeight: 600 }}>{appointment.petId.name}</p>
                                    </div>
                                )}

                                {appointment.notes && (
                                    <div style={{ padding: '0.8rem', background: '#e8f5e9', borderRadius: '8px', fontSize: '0.9rem', color: '#666' }}>
                                        <p style={{ fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Observações:</p>
                                        {appointment.notes}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
