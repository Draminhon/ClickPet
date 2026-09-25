"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';
import styles from './VetDashboard.module.css';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#7E7E7E',
    confirmed: '#3BB77E',
    completed: '#253D4E',
    cancelled: '#FF4A33',
    no_show: '#FF4A33',
};

const TABS = ['TODOS', 'PENDENTES', 'CONFIRMADOS', 'CONCLUIDOS', 'CANCELADOS'];
const TAB_STATUS_MAP: Record<string, string> = {
    PENDENTES: 'pending',
    CONFIRMADOS: 'confirmed',
    CONCLUIDOS: 'completed',
    CANCELADOS: 'cancelled',
};

export default function VetAppointmentsTab() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('TODOS');
    const [cancelTarget, setCancelTarget] = useState<any | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchAppointments();
        }
    }, [session]);

    const fetchAppointments = async () => {
        try {
            const res = await fetch('/api/appointments');
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showToast('Erro ao carregar agendamentos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                showToast('Status atualizado!');
                await fetchAppointments();
            } else {
                showToast('Erro ao atualizar', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao atualizar', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancelConfirm = async () => {
        if (!cancelTarget) return;
        await handleStatusUpdate(cancelTarget._id, 'cancelled');
        setCancelTarget(null);
    };

    const filtered = useMemo(() => {
        if (activeSubTab === 'TODOS') return appointments;
        return appointments.filter((a) => a.status === TAB_STATUS_MAP[activeSubTab]);
    }, [appointments, activeSubTab]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filtered]);

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Carregando agendamentos...</div>;

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid #ECECEC',
                            background: activeSubTab === tab ? '#3BB77E' : 'white',
                            color: activeSubTab === tab ? 'white' : '#253D4E',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {sorted.length === 0 ? (
                <div className={styles.card} style={{ textAlign: 'center', color: '#7E7E7E' }}>
                    Nenhum agendamento encontrado.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '14px' }}>
                    {sorted.map((a) => (
                        <div
                            key={a._id}
                            className={styles.card}
                            style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', marginBottom: 0, flexWrap: 'wrap' }}
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#F8F9FA', flexShrink: 0, position: 'relative' }}>
                                <Image src={a.serviceId?.image || '/assets/animals/chihuaha.png'} alt="" fill style={{ objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <h4 style={{ margin: 0, color: '#253D4E', fontSize: '15px', fontWeight: 700 }}>{a.serviceId?.name || 'Serviço'}</h4>
                                <p style={{ margin: '4px 0 0', color: '#7E7E7E', fontSize: '13px' }}>
                                    {a.userId?.name || 'Cliente'}{a.petId?.name ? ` · Pet: ${a.petId.name}` : ''}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: 90 }}>
                                <div style={{ fontWeight: 700, color: '#253D4E', fontSize: '14px' }}>
                                    {new Date(a.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </div>
                                <div style={{ color: '#7E7E7E', fontSize: '13px' }}>{a.time}</div>
                            </div>
                            <div
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    background: `${STATUS_COLORS[a.status] || '#7E7E7E'}1A`,
                                    color: STATUS_COLORS[a.status] || '#7E7E7E',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {(STATUS_LABELS[a.status] || a.status).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {a.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(a._id, 'confirmed')}
                                            disabled={updatingId === a._id}
                                            style={{ padding: '8px 14px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Confirmar
                                        </button>
                                        <button
                                            onClick={() => setCancelTarget(a)}
                                            disabled={updatingId === a._id}
                                            style={{ padding: '8px 14px', fontSize: '12px', background: 'white', color: '#FF4A33', border: '1px solid #FFEDEA', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                )}
                                {a.status === 'confirmed' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(a._id, 'completed')}
                                            disabled={updatingId === a._id}
                                            style={{ padding: '8px 14px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Concluir
                                        </button>
                                        <button
                                            onClick={() => setCancelTarget(a)}
                                            disabled={updatingId === a._id}
                                            style={{ padding: '8px 14px', fontSize: '12px', background: 'white', color: '#FF4A33', border: '1px solid #FFEDEA', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {cancelTarget && (
                <div className={styles.modalOverlay}>
                    <div className={styles.welcomeModal} style={{ maxWidth: 420 }}>
                        <h2>Cancelar agendamento?</h2>
                        <p>
                            Tem certeza que deseja cancelar o agendamento de{' '}
                            <strong>{cancelTarget.serviceId?.name || 'serviço'}</strong> com{' '}
                            {cancelTarget.userId?.name || 'o cliente'}? Essa ação não pode ser desfeita.
                        </p>
                        <button
                            className={styles.welcomeBtn}
                            style={{ background: '#FF4A33' }}
                            onClick={handleCancelConfirm}
                            disabled={updatingId === cancelTarget._id}
                        >
                            {updatingId === cancelTarget._id ? 'CANCELANDO...' : 'SIM, CANCELAR'}
                        </button>
                        <button className={styles.welcomeSecondaryBtn} onClick={() => setCancelTarget(null)}>
                            Voltar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
