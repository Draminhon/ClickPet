"use client";

import { useEffect, useState, useMemo } from 'react';
import styles from './Appointments.module.css';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const CHART_COLORS = ['#3BB77E', '#253D4E', '#7C8B9D', '#D1D9E2', '#FFBB28'];

export default function PartnerAppointmentsPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('TODOS');
    const itemsPerPage = 7;

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
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                showToast('Status atualizado!');
                fetchAppointments();
            } else {
                showToast('Erro ao atualizar', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao atualizar', 'error');
        }
    };

    const filteredByTab = useMemo(() => {
        if (activeTab === 'TODOS') return appointments;
        const tabMap: any = {
            'PENDENTES': 'pending',
            'CANCELADOS': 'cancelled',
            'CONFIRMADOS': 'confirmed',
            'CONCLUIDOS': 'completed'
        };
        return appointments.filter(a => a.status === tabMap[activeTab]);
    }, [appointments, activeTab]);

    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * itemsPerPage;
        const lastPageIndex = firstPageIndex + itemsPerPage;
        return filteredByTab.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, filteredByTab]);

    const totalPages = Math.ceil(filteredByTab.length / itemsPerPage);

    const chartData = useMemo(() => {
        const counts: any = { 'PENDENTE': 0, 'CONFIRMADO': 0, 'CONCLUIDO': 0, 'CANCELADO': 0 };
        const statusMap: any = {
            'pending': 'PENDENTE',
            'confirmed': 'CONFIRMADO',
            'completed': 'CONCLUIDO',
            'cancelled': 'CANCELADO',
            'no_show': 'CANCELADO'
        };

        appointments.forEach(a => {
            const label = statusMap[a.status] || 'PENDENTE';
            if (counts[label] !== undefined) counts[label]++;
        });

        const colorMap: any = {
            'PENDENTE': '#757575',
            'CONFIRMADO': '#3BB77E',
            'CONCLUIDO': '#3BB77E',
            'CANCELADO': '#FF4D4F'
        };

        return Object.keys(counts)
            .filter(key => counts[key] > 0)
            .map(key => ({
                name: key,
                value: counts[key],
                color: colorMap[key] || '#757575'
            }));
    }, [appointments]);

    const lastMonthCompleted = useMemo(() => {
        const now = new Date();
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

        return appointments.filter(a => {
            const d = new Date(a.date);
            return a.status === 'completed' && d.getMonth() === lastMonth && d.getFullYear() === year;
        }).length;
    }, [appointments]);

    const upcomingSchedules = useMemo(() => {
        return appointments
            .filter(a => ['pending', 'confirmed'].includes(a.status))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 7);
    }, [appointments]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

    return (
        <div className={styles.appointmentsContainer}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className={styles.title} style={{ margin: 0 }}>AGENDAMENTOS</h1>
            </div>

            {/* Toolbar - Same style as Orders */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Tabs Container */}
                <div style={{
                    display: 'flex',
                    width: '600px', // Adjusted to fit 5 tabs
                    height: '40px',
                    borderRadius: '5px',
                    border: '1px solid #D1D9E2',
                    overflow: 'hidden'
                }}>
                    {['TODOS', 'PENDENTES', 'CANCELADOS', 'CONFIRMADOS', 'CONCLUIDOS'].map((tab, idx) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                            style={{
                                flex: 1,
                                border: 'none',
                                borderRight: idx < 4 ? '1px solid #D1D9E2' : 'none',
                                background: activeTab === tab ? '#3BB77E' : 'transparent',
                                color: activeTab === tab ? '#FEFEFE' : '#757575',
                                fontWeight: activeTab === tab ? 'bold' : 600,
                                fontSize: '11px', // Slightly smaller font to fit
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Appointments Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            <th className={styles.tableHeaderCell} style={{ paddingLeft: '1.5rem' }}>AGENDAMENTO</th>
                            <th className={styles.tableHeaderCell}>HORÁRIO</th>
                            <th className={styles.tableHeaderCell}>DATA</th>
                            <th className={styles.tableHeaderCell}>CLIENTE</th>
                            <th className={styles.tableHeaderCell}>STATUS</th>
                            <th className={styles.tableHeaderCell} style={{ paddingRight: '1.5rem' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTableData.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Nenhum agendamento encontrado</td>
                            </tr>
                        ) : (
                            currentTableData.map((a) => (
                                <tr key={a._id} className={styles.tableRow} style={{ borderBottom: '1px solid rgba(209, 217, 226, 1)' }}>
                                    <td className={styles.tableCell}>
                                        <div className={styles.productCell}>
                                            <Image
                                                src={a.serviceId?.image || '/assets/animals/chihuaha.png'}
                                                alt={a.serviceId?.name || ''}
                                                width={32}
                                                height={32}
                                                className={styles.productPhoto}
                                            />
                                            <span>{a.serviceId?.name}</span>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>{a.time}</td>
                                    <td className={styles.tableCell}>{new Date(a.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td className={styles.tableCell}>{a.userId?.name || 'Cliente'}</td>
                                    <td className={styles.tableCell}>{a.status.toUpperCase()}</td>
                                    <td className={styles.tableCell}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            {a.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(a._id, 'confirmed')} style={{ padding: '4px 8px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirmar</button>
                                                    <button onClick={() => handleStatusUpdate(a._id, 'cancelled')} style={{ padding: '4px 8px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                                </>
                                            )}
                                            {a.status === 'confirmed' && (
                                                <button onClick={() => handleStatusUpdate(a._id, 'completed')} style={{ padding: '4px 8px', fontSize: '12px', background: '#3BB77E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Concluir</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            className={styles.paginationBtn}
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <ChevronLeft size={16} /> Anterior
                        </button>
                        <div className={styles.pageNumbers}>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <span
                                    key={i}
                                    className={currentPage === i + 1 ? styles.activePage : ''}
                                    onClick={() => setCurrentPage(i + 1)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {i + 1}
                                </span>
                            ))}
                        </div>
                        <button
                            className={styles.paginationBtn}
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            Próximo <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.sectionSubtitle} style={{ marginBottom: '2rem' }}>ADMINISTRAÇÃO DE AGENDAMENTOS</div>

            {/* Bottom Section: Charts and Upcoming */}
            <div className={styles.chartsRow}>
                {/* Pie Chart */}
                <div className={styles.graphContainer}>
                    <div className={styles.graphHeader}>
                        <div className={styles.graphHeaderText}>
                            <span className={styles.graphMainTitle}>STATUS DE AGENDAMENTOS</span>
                        </div>
                    </div>
                    <div className={styles.graphDivider} />
                    <div className={styles.chartBody}>
                        <div className={styles.chartWithLegend}>
                            <ResponsiveContainer width="60%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className={styles.customLegend}>
                                {chartData.map((entry, index) => (
                                    <div key={`legend-${index}`} className={styles.legendItem}>
                                        <div
                                            className={styles.legendColor}
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <span>{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={styles.graphDivider} />
                    <div className={styles.graphFooter}>
                        AGENDAMENTO CONCLUIDOS DO MÊS PASSADO: {lastMonthCompleted}
                    </div>
                </div>

                {/* Upcoming Schedules */}
                <div className={styles.upcomingContainer}>
                    <div className={styles.upcomingHeader}>PRÓXIMOS HORÁRIOS</div>
                    <div className={styles.graphDivider} />
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {upcomingSchedules.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Sem agendamentos próximos</div>
                        ) : (
                            upcomingSchedules.map((a, i) => (
                                <div key={a._id}>
                                    <div className={styles.upcomingItem}>
                                        <div className={styles.upcomingRow}>
                                            <span className={styles.text01}>{a.serviceId?.name}</span>
                                            <span className={styles.boldValue}>{a.time}</span>
                                        </div>
                                        <div className={styles.upcomingRow} style={{ marginTop: '4px' }}>
                                            <span className={styles.text02}>{a.petId?.name || a.userId?.name}</span>
                                            <span className={styles.text02}>{new Date(a.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                        </div>
                                    </div>
                                    {i < upcomingSchedules.length - 1 && <div className={styles.graphDivider} />}
                                </div>
                            ))
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div style={{ padding: '12px', borderTop: '1px solid #D1D9E2', textAlign: 'center' }}>
                            <Link href="/partner/appointments" style={{ fontSize: '12px', color: '#3BB77E', fontWeight: 600, textDecoration: 'none' }}>
                                VER TODOS OS HORÁRIOS
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
