"use client";

import { useEffect, useState, useMemo } from 'react';
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
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

export default function ServicesPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [services, setServices] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        if (session?.user?.id) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        try {
            const [servicesRes, appointmentsRes] = await Promise.all([
                fetch(`/api/services?partnerId=${session?.user?.id}`),
                fetch('/api/appointments')
            ]);

            const servicesData = await servicesRes.json();
            const appointmentsData = await appointmentsRes.json();

            setServices(Array.isArray(servicesData) ? servicesData : []);
            setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
            setLoading(false);
        } catch (err) {
            console.error(err);
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

    // Calculate actual revenue from completed appointments
    const totalSalesRevenue = useMemo(() => {
        return appointments
            .filter(a => a.status === 'completed')
            .reduce((acc, a) => acc + (a.serviceId?.prices?.[0]?.price || 0), 0);
    }, [appointments]);

    const mapValueToRank = (val: number) => {
        if (val <= 0) return 0;
        if (val <= 10) return (val / 10);
        if (val <= 50) return 1 + (val - 10) / (40);
        if (val <= 100) return 2 + (val - 50) / (50);
        if (val <= 1000) return 3 + (val - 100) / (900);
        return 4;
    };

    const weeklyChartData = useMemo(() => {
        const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
        const data = days.map(day => ({ name: day, realValue: 0, value: 0 }));

        appointments.forEach(app => {
            if (app.status === 'completed' || app.status === 'concluido' || app.status === 'CONFIRMADOS' || app.status === 'pending') {
                const date = new Date(app.date);
                const dayIndex = date.getUTCDay();
                const price = app.serviceId?.prices?.[0]?.price || 0;
                data[dayIndex].realValue += price;
            }
        });

        const reordered = [data[1], data[2], data[3], data[4], data[5], data[6], data[0]];
        return reordered.map(d => ({
            ...d,
            value: mapValueToRank(d.realValue)
        }));
    }, [appointments]);

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
                <Link href="/partner/services/new" className={styles.actionBtn}>
                    ADICIONAR SERVIÇO
                </Link>
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
                            <th className={styles.tableHeaderCell} style={{ paddingLeft: '1.5rem' }}>SERVIÇO</th>
                            <th className={styles.tableHeaderCell}>CATEGORIA</th>
                            <th className={styles.tableHeaderCell}>PORTE</th>
                            <th className={styles.tableHeaderCell}>
                                <div className={styles.sortableHeader} onClick={() => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                                    PREÇO <ArrowUpDown size={14} />
                                </div>
                            </th>
                            <th className={styles.tableHeaderCell}>DURAÇÃO (MIN)</th>
                            <th className={styles.tableHeaderCell} style={{ paddingRight: '1.5rem' }}>ESPECIE</th>
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
                                            <Pencil size={12.82} className={styles.pencilIcon} />
                                            <Image
                                                src={s.image || '/assets/animals/chihuaha.png'}
                                                alt={s.name}
                                                width={32}
                                                height={32}
                                                className={styles.productPhoto}
                                            />
                                            <span className={styles.serviceNameText}>{s.name}</span>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>{getCategoryLabel(s.category)}</span></td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>{s.prices?.[0]?.size || '-'}</span></td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>R$ {s.prices?.[0]?.price?.toFixed(2) || '0.00'}</span></td>
                                    <td className={styles.tableCell}><span className={styles.tableCellDefault}>{s.duration || '-'}</span></td>
                                    <td className={styles.tableCell} style={{ paddingRight: '1.5rem' }}><span className={styles.tableCellDefault}>{getSpeciesLabel(s.species)}</span></td>
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
                                    {new Date(a.date).toLocaleDateString('pt-BR')}
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
                                <BarChart data={weeklyChartData} margin={{ left: 20, right: 10, top: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#757575' }}
                                    />
                                    <YAxis
                                        ticks={[1, 2, 3, 4]}
                                        domain={[0, 4]}
                                        width={60}
                                        tickFormatter={(val) => {
                                            if (val === 1) return '10';
                                            if (val === 2) return '50';
                                            if (val === 3) return '100';
                                            if (val === 4) return '1000';
                                            return '';
                                        }}
                                        axisLine={{ stroke: '#eee' }}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#757575' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(val: any, name: any, props: any) => [`R$ ${props.payload.realValue.toFixed(2)}`, 'Total']}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#3BB77E"
                                        radius={[4, 4, 0, 0]}
                                        barSize={30}
                                        minPointSize={5}
                                    >
                                        <LabelList
                                            dataKey="realValue"
                                            position="top"
                                            formatter={(val: number) => val > 0 ? `R$ ${val}` : ''}
                                            style={{ fontSize: 10, fill: '#3BB77E', fontWeight: 'bold' }}
                                        />
                                        {weeklyChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#3BB77E" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.graphDivider} />
                    <div className={styles.chartFooter}>
                        <div className={styles.optionsBtn} style={{ background: 'transparent', width: 40, height: 40, marginLeft: '-1.5rem' }}>
                            <MoreHorizontal size={15} color="rgba(95,109,126,1)" />
                        </div>
                        <span className={styles.totalSemana}>TOTAL DA SEMANA: R$ {totalSalesRevenue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
