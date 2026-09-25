"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import ServiceModal from '@/components/modals/ServiceModal';
import styles from './VetDashboard.module.css';

const CATEGORY_LABELS: Record<string, string> = {
    bath: 'Banho',
    grooming: 'Tosa',
    veterinary: 'Veterinário',
    training: 'Adestramento',
    aquarismo: 'Aquarismo',
    daycare: 'Daycare/Creche',
    hotel: 'Hospedagem',
    other: 'Outro',
};

function priceRangeLabel(prices: any[]): string {
    if (!prices || prices.length === 0) return 'A combinar';
    const values = prices.map((p) => p.price).filter((v: any) => typeof v === 'number');
    if (values.length === 0) return 'A combinar';
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `R$ ${min.toFixed(2)}` : `R$ ${min.toFixed(2)} - R$ ${max.toFixed(2)}`;
}

export default function VetServicesTab() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchServices();
        }
    }, [session]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/services?partnerId=${session?.user?.id}`);
            const data = await res.json();
            setServices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showToast('Erro ao carregar serviços', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/services/${deleteTarget._id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Serviço removido com sucesso!');
                setDeleteTarget(null);
                fetchServices();
            } else {
                showToast('Erro ao remover serviço', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao remover serviço', 'error');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>Carregando serviços...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <button
                    className={styles.saveButton}
                    style={{ width: 'auto', margin: 0, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => { setEditingService(null); setShowModal(true); }}
                >
                    <Plus size={18} /> NOVO SERVIÇO
                </button>
            </div>

            {services.length === 0 ? (
                <div className={styles.card} style={{ textAlign: 'center', color: '#7E7E7E' }}>
                    Você ainda não cadastrou nenhum serviço. Cadastre consultas, exames ou outros atendimentos
                    para que os clientes possam agendar diretamente pelo app.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {services.map((s) => (
                        <div
                            key={s._id}
                            className={styles.card}
                            style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', marginBottom: 0, flexWrap: 'wrap' }}
                        >
                            <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', background: '#F8F9FA', flexShrink: 0, position: 'relative' }}>
                                <Image src={s.image || '/assets/animals/chihuaha.png'} alt={s.name} fill style={{ objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <h4 style={{ margin: 0, color: '#253D4E', fontSize: '16px', fontWeight: 700 }}>{s.name}</h4>
                                <p style={{ margin: '4px 0 0', color: '#7E7E7E', fontSize: '13px' }}>
                                    {CATEGORY_LABELS[s.category] || s.category}
                                    {s.duration ? ` · ${s.duration} min` : ''}
                                    {!s.isActive ? ' · Inativo' : ''}
                                </p>
                            </div>
                            <div style={{ fontWeight: 700, color: '#3BB77E', fontSize: '15px', whiteSpace: 'nowrap' }}>
                                {priceRangeLabel(s.prices)}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => { setEditingService(s); setShowModal(true); }}
                                    style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #ECECEC', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#253D4E' }}
                                    title="Editar"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(s)}
                                    style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #FFEDEA', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF4A33' }}
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ServiceModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingService(null); }}
                partnerId={session?.user?.id || ''}
                onSuccess={fetchServices}
                service={editingService}
                defaultCategory="veterinary"
            />

            {deleteTarget && (
                <div className={styles.modalOverlay}>
                    <div className={styles.welcomeModal} style={{ maxWidth: 420 }}>
                        <h2>Excluir serviço?</h2>
                        <p>
                            Tem certeza que deseja excluir <strong>{deleteTarget.name}</strong>? Essa ação não pode ser desfeita.
                        </p>
                        <button
                            className={styles.welcomeBtn}
                            style={{ background: '#FF4A33' }}
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                        >
                            {deleting ? 'EXCLUINDO...' : 'SIM, EXCLUIR'}
                        </button>
                        <button className={styles.welcomeSecondaryBtn} onClick={() => setDeleteTarget(null)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
