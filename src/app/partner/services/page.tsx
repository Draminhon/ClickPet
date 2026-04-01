"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './Services.module.css';
import {
    Plus,
    Search,
    MoreHorizontal,
    Scissors,
    Edit,
    Trash2,
    ArrowUpDown,
    Calendar,
    Pencil,
    ChevronLeft,
    ChevronRight,
    X,
    Upload
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ServiceModal from '@/components/modals/ServiceModal';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

function ServicesContent() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [services, setServices] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Create Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setShowCreateModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [servicesRes, appointmentsRes] = await Promise.all([
                fetch(`/api/services?partnerId=${session?.user?.id}`),
                fetch('/api/appointments')
            ]);

            const servicesData = await servicesRes.json();
            const appointmentsData = await appointmentsRes.json();

            setServices(Array.isArray(servicesData) ? servicesData : []);
            setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const sortedServices = useMemo(() => {
        const filtered = services.filter(s =>
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return [...filtered].sort((a, b) => {
            const priceA = a.prices?.[0]?.price || 0;
            const priceB = b.prices?.[0]?.price || 0;
            return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
        });
    }, [services, searchQuery, sortOrder]);

    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * itemsPerPage;
        const lastPageIndex = firstPageIndex + itemsPerPage;
        return sortedServices.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, sortedServices]);

    const totalPages = Math.ceil(sortedServices.length / itemsPerPage);

    const recentAppointments = useMemo(() => {
        return appointments
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [appointments]);

    // Get current week boundaries (Monday to Sunday)
    const { weekStart, weekEnd, weekLabel } = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return { weekStart: monday, weekEnd: sunday, weekLabel: `${fmt(monday)} - ${fmt(sunday)}` };
    }, []);

    // Filter appointments to current week only
    const currentWeekAppointments = useMemo(() => {
        return appointments.filter(a => {
            const d = new Date(a.date);
            return d >= weekStart && d <= weekEnd;
        });
    }, [appointments, weekStart, weekEnd]);

    // Calculate revenue from current week completed appointments
    const totalSalesRevenue = useMemo(() => {
        return currentWeekAppointments
            .filter(a => a.status === 'completed')
            .reduce((acc, a) => acc + (a.serviceId?.prices?.[0]?.price || 0), 0);
    }, [currentWeekAppointments]);

    const weeklyChartData = useMemo(() => {
        const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
        const data = days.map(day => ({ name: day, value: 0 }));

        currentWeekAppointments.forEach(app => {
            if (app.status === 'completed' || app.status === 'concluido' || app.status === 'CONFIRMADOS' || app.status === 'pending') {
                const date = new Date(app.date);
                const dayIndex = date.getUTCDay();
                const price = app.serviceId?.prices?.[0]?.price || 0;
                data[dayIndex].value += price;
            }
        });

        // Reorder: SEG, TER, QUA, QUI, SEX, SAB, DOM
        return [data[1], data[2], data[3], data[4], data[5], data[6], data[0]];
    }, [currentWeekAppointments]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

    const getSpeciesLabel = (species: string) => {
        const labels: any = {
            all: 'Todas',
            dog: 'Cão',
            cat: 'Gato',
            bird: 'Pássaro',
            fish: 'Peixe',
            other: 'Outro'
        };
        return labels[species] || species;
    };

    const getCategoryLabel = (cat: string) => {
        const labels: any = {
            bath: 'Banho',
            grooming: 'Tosa',
            veterinary: 'Veterinário',
            training: 'Adestramento',
            aquarismo: 'Aquarismo',
            daycare: 'Daycare/Creche',
            hotel: 'Hospedagem',
            other: 'Outro'
        };
        return labels[cat] || cat;
    };

    return (
        <div className={styles.servicesContainer}>
            {/* Header */}
            <h1 className={styles.title}>SERVIÇOS</h1>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <button className={styles.actionBtn} onClick={() => setShowCreateModal(true)}>
                    ADICIONAR SERVIÇO
                </button>
                <div className={styles.searchContainer}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="PESQUISAR SERVIÇO"
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className={styles.optionsBtn}>
                    <MoreHorizontal size={15} color="rgba(124,139,157,1)" />
                </button>
            </div>

            {/* Main Services Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            <th className={styles.tableHeaderCell}>SERVIÇO</th>
                            <th className={styles.tableHeaderCell}>CATEGORIA</th>
                            <th className={styles.tableHeaderCell}>PORTE</th>
                            <th className={styles.tableHeaderCell}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    PREÇO {sortOrder === 'asc' ? <ArrowUpDown size={12} style={{ opacity: 0.3 }} /> : <ArrowUpDown size={12} />}
                                </div>
                            </th>
                            <th className={styles.tableHeaderCell}>DURAÇÃO (MIN)</th>
                            <th className={styles.tableHeaderCell}>ESPECIE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTableData.map((s, idx) => {
                            const isLast = idx === currentTableData.length - 1;
                            const showDivider = !(currentTableData.length === 1 && isLast) && !isLast;

                            return (
                                <tr key={s._id} className={styles.tableRow} style={{ borderBottom: showDivider ? '1px solid rgba(209, 217, 226, 1)' : 'none' }}>
                                    <td className={styles.tableCell}>
                                        <div className={styles.serviceCell}>
                                            <div 
                                                className={styles.editBtn}
                                                onClick={() => {
                                                    setEditingService(s);
                                                    setShowCreateModal(true);
                                                }}
                                            >
                                                <Pencil size={18} className={styles.pencilIcon} />
                                            </div>
                                            <div className={styles.imageWrapper}>
                                                <Image
                                                    src={s.image || '/assets/animals/chihuaha.png'}
                                                    alt={s.name}
                                                    width={32}
                                                    height={32}
                                                    className={styles.productPhoto}
                                                />
                                            </div>
                                            <span className={styles.serviceNameText} style={{ fontSize: '16px' }}>{s.name}</span>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>{getCategoryLabel(s.category)}</span></td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>{s.prices?.[0]?.size || '-'}</span></td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>R$ {s.prices?.[0]?.price?.toFixed(2) || '0.00'}</span></td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>{s.duration || '-'}</span></td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>{getSpeciesLabel(s.species)}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Numeric Pagination */}
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

            <h2 className={styles.chartsSectionTitle}>GRÁFICOS DE SERVIÇO</h2>

            {/* Bottom Row */}
            <div className={styles.bottomRow}>
                {/* Left: Recent Requests table */}
                <div className={styles.recentRequestsContainer}>
                    <h3 className={styles.recentTitle} style={{ padding: '0 1.5rem' }}>ULTIMOS SERVIÇOS SOLICITADOS</h3>
                    <div className={styles.graphDivider} />
                    <div style={{ flex: 1, padding: '0 1.5rem' }}>
                        {recentAppointments.map((a, i) => (
                            <div key={a._id} className={styles.recentItem} style={{ borderBottom: i < recentAppointments.length - 1 ? '1px solid rgba(209, 217, 226, 1)' : 'none' }}>
                                <div className={styles.recentItemLeft}>
                                    <Image
                                        src={a.serviceId?.image || '/assets/animals/chihuaha.png'}
                                        alt=""
                                        width={40}
                                        height={40}
                                        className={styles.recentPhoto}
                                    />
                                    <div className={styles.recentInfo}>
                                        <span className={styles.recentName}>{a.serviceId?.name || 'Serviço'}</span>
                                        <span className={styles.recentCategory}>{getCategoryLabel(a.serviceId?.category)}</span>
                                    </div>
                                </div>
                                <div className={styles.dateBadge}>
                                    {new Date(a.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.graphDivider} />
                    <button className={styles.verTodosBtn}>VER TODOS</button>
                </div>

                {/* Right: Total Vendas Area Chart */}
                <div className={styles.chartContainer}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>TOTAL DE VENDAS</h3>
                        <div className={styles.optionsBtn} style={{ background: 'transparent', width: 40, height: 40 }}>
                            <MoreHorizontal size={15} color="rgba(95,109,126,1)" />
                        </div>
                    </div>
                    <div className={styles.graphDivider} />

                    <div className={styles.chartContent}>
                        <div className={styles.chartStatsCol}>
                            <span className={styles.statsName}>{sortedServices[0]?.name || 'Serviço Principal'}</span>
                            <span className={styles.statsValue}>R$ {totalSalesRevenue.toFixed(2)}</span>
                        </div>
                        <div className={styles.chartBody}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyChartData} margin={{ left: 20, right: 10, top: 20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3BB77E" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3BB77E" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#757575' }}
                                    />
                                    <YAxis
                                        width={60}
                                        axisLine={{ stroke: '#eee' }}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#757575' }}
                                        tickFormatter={(val) => `R$ ${val}`}
                                    />
                                    <Tooltip
                                        formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Total']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3BB77E"
                                        strokeWidth={2}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.graphDivider} />
                    <div className={styles.chartFooter}>
                        <span className={styles.totalSemana}>TOTAL DA SEMANA ({weekLabel}): R$ {totalSalesRevenue.toFixed(2)}</span>
                        <div className={styles.optionsBtn} style={{ background: 'transparent', width: 40, height: 40 }}>
                            <MoreHorizontal size={15} color="rgba(95,109,126,1)" />
                        </div>
                    </div>
                </div>
            </div>

            <ServiceModal 
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingService(null);
                }}
                partnerId={session?.user?.id || ''}
                onSuccess={fetchData}
                service={editingService}
            />
        </div>
    );
}

import { Suspense } from 'react';

export default function ServicesPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>}>
            <ServicesContent />
        </Suspense>
    );
}

