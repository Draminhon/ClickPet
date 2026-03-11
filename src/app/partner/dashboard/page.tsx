"use client";

import { useEffect, useState, useMemo } from 'react';
import styles from './Dashboard.module.css';
import {
    DollarSign,
    Truck,
    Package,
    Pencil,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Search,
    BarChart2,
    MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface Product {
    _id: string;
    title: string;
    description: string;
    price: number;
    discount: number;
    category: string;
    productType: string;
    image: string;
}

const COLORS = ['#3BB77E', '#253D4E', '#7C8B9D', '#D1D9E2', '#757575'];

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        activeOrders: 0,
        totalRevenue: 0,
        products: [] as Product[],
        dailySales: [] as { name: string; value: number }[],
        topProducts: [] as { name: string; value: number }[]
    });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const itemsPerPage = 7;

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    // Filter Logic
    const filteredProducts = useMemo(() => {
        if (!searchQuery) return stats.products;
        const query = searchQuery.toLowerCase();
        return stats.products.filter(p =>
            p.title.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
    }, [stats.products, searchQuery]);

    // Sorting Logic
    const sortedProducts = useMemo(() => {
        let sortableProducts = [...filteredProducts];
        if (sortConfig !== null) {
            sortableProducts.sort((a: any, b: any) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle mixed case or specific string sorting
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableProducts;
    }, [filteredProducts, sortConfig]);

    // Pagination Logic
    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * itemsPerPage;
        const lastPageIndex = firstPageIndex + itemsPerPage;
        return sortedProducts.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, sortedProducts]);

    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

    // Reset page when search or sorting changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUp size={12} className={styles.sortIcon} style={{ opacity: 0.3 }} />;
        }
        return sortConfig.direction === 'asc' ?
            <ArrowUp size={12} className={styles.sortIcon} /> :
            <ArrowDown size={12} className={styles.sortIcon} />;
    };

    const renderPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                pages.push(
                    <span
                        key={i}
                        className={`${styles.pageNumber} ${currentPage === i ? styles.activePage : ''}`}
                        onClick={() => setCurrentPage(i)}
                    >
                        {i}
                    </span>
                );
            } else if (
                (i === currentPage - 2 && i > 1) ||
                (i === currentPage + 2 && i < totalPages)
            ) {
                pages.push(<span key={i} className={styles.dots}>...</span>);
            }
        }
        return pages;
    };

    const bestSalesDay = useMemo(() => {
        if (!stats.dailySales || stats.dailySales.length === 0) return 'N/A';
        const sorted = [...stats.dailySales].sort((a, b) => b.value - a.value);
        const dayNames: { [key: string]: string } = {
            'SEG': 'SEGUNDA-FEIRA',
            'TER': 'TERÇA-FEIRA',
            'QUA': 'QUARTA-FEIRA',
            'QUI': 'QUINTA-FEIRA',
            'SEX': 'SEXTA-FEIRA',
            'SAB': 'SÁBADO',
            'DOM': 'DOMINGO'
        };
        const topDay = sorted[0];
        if (!topDay || topDay.value === 0) return 'NENHUMA VENDA';
        return dayNames[topDay.name] || topDay.name;
    }, [stats.dailySales]);

    const topSoldType = useMemo(() => {
        if (!stats.topProducts || stats.topProducts.length === 0) return 'N/A';
        return stats.topProducts[0].name;
    }, [stats.topProducts]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando...</div>;
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* ... title, metrics cards, quick actions ... */}
            <h1 className={styles.title}>DASHBOARD</h1>

            <div className={styles.metricsRow}>
                <div className={styles.metricCard}>
                    <div className={styles.iconWrapper}>
                        <DollarSign className={styles.dollarIcon} />
                    </div>
                    <div className={styles.metricInfo}>
                        <span className={styles.label}>Total de vendas</span>
                        <span className={styles.value}>{formatCurrency(stats.totalRevenue)}</span>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.iconWrapper}>
                        <Truck size={20} color="#D9D9D9" />
                    </div>
                    <div className={styles.metricInfo}>
                        <span className={styles.label}>Pedidos ativos</span>
                        <span className={styles.value}>{stats.activeOrders}</span>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.iconWrapper}>
                        <Package size={20} color="#D9D9D9" />
                    </div>
                    <div className={styles.metricInfo}>
                        <span className={styles.label}>Produtos ativo</span>
                        <span className={styles.value}>{stats.totalProducts}</span>
                    </div>
                </div>
            </div>

            <div className={styles.quickActions}>
                <Link href="/partner/catalog/new" className={`${styles.actionBtn} ${styles.addBtn}`}>
                    ADICIONAR PRODUTOS
                </Link>
                <div className={styles.searchContainer}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="PESQUISAR PRODUTO"
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className={styles.optionsBtn}>
                    <MoreHorizontal size={15} color="rgba(124,139,157,1)" />
                </button>
            </div>

            <div className={styles.productsContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeader}>
                            <th className={`${styles.headerCell} ${styles.sortable}`} onClick={() => requestSort('title')}>
                                PRODUTOS {getSortIcon('title')}
                            </th>
                            <th className={styles.headerCell}>DESCRIÇÃO</th>
                            <th className={styles.headerCell}>TIPO</th>
                            <th className={`${styles.headerCell} ${styles.sortable}`} onClick={() => requestSort('price')}>
                                PREÇO {getSortIcon('price')}
                            </th>
                            <th className={`${styles.headerCell} ${styles.sortable}`} onClick={() => requestSort('discount')}>
                                DESCONTO {getSortIcon('discount')}
                            </th>
                            <th className={styles.headerCell}>CATEGORIAS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTableData.map((product) => (
                            <tr key={product._id} className={styles.tableRow}>
                                <td className={styles.cell}>
                                    <div className={styles.productCell}>
                                        <Link href={`/partner/catalog/edit/${product._id}`}>
                                            <Pencil size={16} className={styles.editIcon} />
                                        </Link>
                                        <Image
                                            src={product.image || '/assets/placeholder-food.png'}
                                            alt={product.title}
                                            width={32}
                                            height={32}
                                            className={styles.productPhoto}
                                        />
                                        <span className={styles.productName}>{product.title}</span>
                                    </div>
                                </td>
                                <td className={styles.cell}>{product.description}</td>
                                <td className={styles.cell}>{product.productType || 'Geral'}</td>
                                <td className={styles.cell}>{formatCurrency(product.price)}</td>
                                <td className={styles.cell}>{product.discount}%</td>
                                <td className={styles.cell}>{product.category}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className={styles.pagination}>
                    <div className={styles.paginationLeft}>
                        {currentPage > 1 && (
                            <button className={styles.paginationBtn} onClick={() => setCurrentPage(currentPage - 1)}>
                                <ChevronLeft size={20} />
                                Anterior
                            </button>
                        )}
                    </div>

                    <div className={styles.pageNumbers}>
                        {renderPageNumbers()}
                    </div>

                    <div className={styles.paginationRight}>
                        {currentPage < totalPages && (
                            <button className={styles.paginationBtn} onClick={() => setCurrentPage(currentPage + 1)}>
                                Próximo
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <h2 className={styles.graphsTitle}>GRÁFICOS</h2>
            <div className={styles.graphsRow}>
                <div className={styles.graphContainer}>
                    <div className={styles.graphHeader}>
                        <BarChart2 className={styles.chartIcon} size={27} />
                        <div className={styles.graphHeaderText}>
                            <span className={styles.graphMainTitle}>GRÁFICO DE VENDAS DIÁRIAS</span>
                            <span className={styles.graphSubTitle}>QTDE DE VENDAS DIÁRIAS DO SEU PETSHOP</span>
                        </div>
                    </div>
                    <div className={styles.graphDivider} />
                    <div className={styles.chartBody}>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats.dailySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f4f6f8' }} />
                                <Bar dataKey="value" fill="#3BB77E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className={styles.graphDivider} />
                    <div className={styles.graphFooter}>
                        DIA DA SEMANA COM MAIS VENDAS: {bestSalesDay}
                    </div>
                </div>

                <div className={styles.graphContainer}>
                    <div className={styles.graphHeader}>
                        <Package className={styles.chartIcon} size={27} />
                        <div className={styles.graphHeaderText}>
                            <span className={styles.graphMainTitle}>PRODUTOS MAIS VENDIDOS</span>
                            <span className={styles.graphSubTitle}>DISTRIBUIÇÃO DE VENDAS POR PRODUTO</span>
                        </div>
                    </div>
                    <div className={styles.graphDivider} />
                    <div className={styles.chartBody}>
                        <div className={styles.chartWithLegend}>
                            <ResponsiveContainer width="60%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={stats.topProducts}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {stats.topProducts.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className={styles.customLegend}>
                                {stats.topProducts.map((entry, index) => (
                                    <div key={`legend-${index}`} className={styles.legendItem}>
                                        <div
                                            className={styles.legendColor}
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className={styles.legendText}>{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={styles.graphDivider} />
                    <div className={styles.graphFooter}>
                        TIPO MAIS VENDIDO: {topSoldType}
                    </div>
                </div>
            </div>
        </div>
    );
}
