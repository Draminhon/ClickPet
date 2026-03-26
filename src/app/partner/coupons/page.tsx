"use client";

import { useEffect, useState, useMemo } from 'react';
import styles from './Coupons.module.css';
import {
    Plus,
    Search,
    MoreHorizontal,
    Ticket,
    Trash2,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Tag,
    X
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

const PIE_COLORS = ['#3BB77E', '#FFC107', '#2196F3', '#FF5722', '#9C27B0', '#00BCD4', '#E91E63', '#8BC34A'];

export default function CouponsPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
    const [deletingCouponCode, setDeletingCouponCode] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        discount: '',
        minPurchase: '',
        maxUses: '',
        expiresAt: '',
        type: 'percentage',
        maxDiscount: '',
    });

    useEffect(() => {
        if (session?.user?.id) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/coupons`);
            const data = await res.json();
            setCoupons(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast('Cupom criado com sucesso!');
                setFormData({ code: '', discount: '', minPurchase: '', maxUses: '', expiresAt: '', type: 'percentage', maxDiscount: '' });
                setShowCreateModal(false);
                fetchData();
            } else {
                const error = await res.json();
                showToast(error.message || 'Erro ao criar cupom', 'error');
            }
        } catch (error) {
            showToast('Erro ao criar cupom', 'error');
        }
    };

    const openDeleteModal = (id: string, code: string) => {
        setDeletingCouponId(id);
        setDeletingCouponCode(code);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCouponId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/coupons?id=${deletingCouponId}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Cupom excluído com sucesso');
                fetchData();
            } else {
                showToast('Erro ao excluir cupom', 'error');
            }
        } catch (error) {
            showToast('Erro ao excluir cupom', 'error');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeletingCouponId(null);
            setDeletingCouponCode('');
        }
    };

    const getCouponStatus = (coupon: any): { label: string; color: string; bg: string } => {
        const now = new Date();
        const expiresAt = new Date(coupon.expiresAt);
        const createdAt = new Date(coupon.createdAt);

        if (expiresAt < now) {
            return { label: 'EXPIRADO', color: '#dc3545', bg: 'rgba(220, 53, 69, 0.1)' };
        }
        if (createdAt > now) {
            return { label: 'PROGRAMADO', color: '#FFC107', bg: 'rgba(255, 193, 7, 0.1)' };
        }
        return { label: 'ATIVO', color: '#3BB77E', bg: 'rgba(59, 183, 126, 0.1)' };
    };

    const sortedCoupons = useMemo(() => {
        const filtered = coupons.filter(c =>
            c._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.code?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return [...filtered].sort((a, b) => {
            const valA = a.discount || 0;
            const valB = b.discount || 0;
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });
    }, [coupons, searchQuery, sortOrder]);

    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * itemsPerPage;
        const lastPageIndex = firstPageIndex + itemsPerPage;
        return sortedCoupons.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, sortedCoupons]);

    const totalPages = Math.ceil(sortedCoupons.length / itemsPerPage);

    // Pie chart data: most used coupons this month
    const pieChartData = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        return coupons
            .filter(c => c.usedCount > 0)
            .sort((a, b) => b.usedCount - a.usedCount)
            .slice(0, 6)
            .map(c => ({
                name: c.code,
                value: c.usedCount
            }));
    }, [coupons]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

    return (
        <div className={styles.servicesContainer}>
            {/* Header */}
            <h1 className={styles.title}>CUPONS DE DESCONTO</h1>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <div className={styles.searchContainer}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="PESQUISAR ID"
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className={styles.actionBtn} onClick={() => setShowCreateModal(true)}>
                    ADICIONAR CUPOM
                </button>
                <button className={styles.optionsBtn}>
                    <MoreHorizontal size={15} color="rgba(124,139,157,1)" />
                </button>
            </div>

            {/* Main Coupons Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            <th className={styles.tableHeaderCell} style={{ paddingLeft: '1.5rem' }}>AÇÕES</th>
                            <th className={styles.tableHeaderCell}>ID</th>
                            <th className={styles.tableHeaderCell}>CUPOM</th>
                            <th className={styles.tableHeaderCell}>
                                <div className={styles.sortableHeader} onClick={() => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                                    DESCONTO <ArrowUpDown size={14} />
                                </div>
                            </th>
                            <th className={styles.tableHeaderCell}>MÍNIMO</th>
                            <th className={styles.tableHeaderCell}>DATA DE VALIDADE</th>
                            <th className={styles.tableHeaderCell}>USO MÁXIMO</th>
                            <th className={styles.tableHeaderCell} style={{ paddingRight: '1.5rem' }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTableData.map((c, idx) => {
                            const isLast = idx === currentTableData.length - 1;
                            const showDivider = !(currentTableData.length === 1 && isLast) && !isLast;
                            const status = getCouponStatus(c);

                            return (
                                <tr key={c._id} className={styles.tableRow} style={{ borderBottom: showDivider ? '1px solid rgba(209, 217, 226, 1)' : 'none' }}>
                                    <td className={styles.tableCell}>
                                        <button
                                            onClick={() => openDeleteModal(c._id, c.code)}
                                            className={styles.deleteIconBtn}
                                            title="Excluir cupom"
                                            style={{ margin: '0 auto' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.couponIdText}>
                                            {c._id?.slice(-6).toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className={styles.serviceNameText}>{c.code}</span>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault}>
                                            {c.type === 'percentage' ? `${c.discount}%` : `R$ ${c.discount?.toFixed(2)}`}
                                        </span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault}>R$ {c.minPurchase?.toFixed(2) || '0.00'}</span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault}>
                                            {new Date(c.expiresAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        </span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault}>{c.usedCount || 0} / {c.maxUses || '∞'}</span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.statusBadge} style={{ backgroundColor: status.bg, color: status.color }}>
                                            {status.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
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

            <h2 className={styles.chartsSectionTitle}>ANÁLISE DE CUPONS</h2>

            {/* Pie Chart Section */}
            <div className={styles.bottomRow}>
                <div className={styles.chartContainer}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>CUPONS MAIS USADOS NO MÊS</h3>
                        <div className={styles.optionsBtn} style={{ background: 'transparent', width: 40, height: 40 }}>
                            <MoreHorizontal size={15} color="rgba(95,109,126,1)" />
                        </div>
                    </div>
                    <div className={styles.graphDivider} />

                    <div className={styles.chartContent}>
                        {pieChartData.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', minHeight: 280, color: '#999' }}>
                                <Ticket size={48} color="#ccc" />
                                <p style={{ marginTop: '1rem' }}>Nenhum cupom utilizado ainda.</p>
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, value }) => `${name} (${value})`}
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: any) => [`${val} usos`, 'Total']} />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            formatter={(value) => <span style={{ color: '#253D4E', fontSize: 12 }}>{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className={styles.graphDivider} />
                    <div className={styles.chartFooter}>
                        <span className={styles.totalSemana}>TOTAL DE CUPONS ATIVOS: {coupons.filter(c => getCouponStatus(c).label === 'ATIVO').length}</span>
                        <div className={styles.optionsBtn} style={{ background: 'transparent', width: 40, height: 40 }}>
                            <MoreHorizontal size={15} color="rgba(95,109,126,1)" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ======== CREATE COUPON MODAL ======== */}
            {showCreateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>NOVO CUPOM</h2>
                            <button className={styles.modalCloseBtn} onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.graphDivider} />
                        <form onSubmit={handleCreateSubmit} className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Código do Cupom</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="PRIMEIRACOMPRA"
                                        className={styles.formInput}
                                        style={{ textTransform: 'uppercase' }}
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tipo de Desconto</label>
                                    <select
                                        className={styles.formInput}
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="percentage">Porcentagem (%)</option>
                                        <option value="fixed">Valor Fixo (R$)</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        {formData.type === 'percentage' ? 'Desconto (%)' : 'Valor do Desconto (R$)'}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={formData.type === 'percentage' ? '100' : undefined}
                                        step={formData.type === 'fixed' ? '0.01' : '1'}
                                        className={styles.formInput}
                                        value={formData.discount}
                                        onChange={e => setFormData({ ...formData, discount: e.target.value })}
                                    />
                                </div>
                                {formData.type === 'percentage' && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Desconto Máximo (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Sem limite"
                                            className={styles.formInput}
                                            value={formData.maxDiscount}
                                            onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.formRow} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Compra Mínima (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                        className={styles.formInput}
                                        value={formData.minPurchase}
                                        onChange={e => setFormData({ ...formData, minPurchase: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Usos Máximos</label>
                                    <input
                                        type="number"
                                        placeholder="Ilimitado"
                                        className={styles.formInput}
                                        value={formData.maxUses}
                                        onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Data de Expiração</label>
                                    <input
                                        type="date"
                                        required
                                        className={styles.formInput}
                                        value={formData.expiresAt}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className={styles.formSubmitBtn}>
                                CRIAR CUPOM
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ======== DELETE CONFIRMATION MODAL ======== */}
            {showDeleteModal && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modalContent} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>EXCLUIR CUPOM</h2>
                            <button className={styles.modalCloseBtn} onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.graphDivider} />
                        <div className={styles.modalBody} style={{ textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(220, 53, 69, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Trash2 size={28} color="#dc3545" />
                            </div>
                            <p style={{ fontSize: 14, color: '#253D4E', marginBottom: '0.5rem' }}>
                                Tem certeza que deseja excluir o cupom
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: '#3BB77E', marginBottom: '1.5rem' }}>
                                {deletingCouponCode}
                            </p>
                            <p style={{ fontSize: 12, color: '#999', marginBottom: '2rem' }}>
                                Esta ação não poderá ser desfeita.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className={styles.formSubmitBtn}
                                    style={{ backgroundColor: '#e6e9ec', color: '#253D4E', flex: 1 }}
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className={styles.formSubmitBtn}
                                    style={{ backgroundColor: '#dc3545', flex: 1 }}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'EXCLUINDO...' : 'EXCLUIR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
