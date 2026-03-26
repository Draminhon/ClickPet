"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './Catalog.module.css';
import {
    Plus,
    Search,
    MoreHorizontal,
    Package,
    Pencil,
    Trash2,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    X,
    Upload
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ProductModal from '@/components/modals/ProductModal';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';

export default function CatalogPage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Create Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
    const [deletingProductName, setDeletingProductName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('create') === 'true') {
            setShowCreateModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchProducts();
        }
    }, [session]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/products?partnerId=${session?.user?.id}`);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };



    const openDeleteModal = (id: string, name: string) => {
        setDeletingProductId(id);
        setDeletingProductName(name);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingProductId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/products?id=${deletingProductId}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Produto excluído com sucesso');
                fetchProducts();
            } else {
                showToast('Erro ao excluir produto', 'error');
            }
        } catch (error) {
            showToast('Erro ao excluir produto', 'error');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeletingProductId(null);
            setDeletingProductName('');
        }
    };

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    const sortedProducts = useMemo(() => {
        const filtered = products.filter(p =>
            p._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        let result = [...filtered];
        if (sortConfig) {
            result.sort((a: any, b: any) => {
                const aVal = a[sortConfig.key] ?? '';
                const bVal = b[sortConfig.key] ?? '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [products, searchQuery, sortConfig]);

    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * itemsPerPage;
        const lastPageIndex = firstPageIndex + itemsPerPage;
        return sortedProducts.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, sortedProducts]);

    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

    return (
        <div className={styles.servicesContainer}>
            <h1 className={styles.title}>CATÁLOGO DE PRODUTOS</h1>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
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
                <button 
                    type="button"
                    className={styles.actionBtn} 
                    onClick={() => {
                        console.log('Opening Create Modal');
                        setShowCreateModal(true);
                    }}
                >
                    ADICIONAR PRODUTO
                </button>
                <button className={styles.optionsBtn}>
                    <MoreHorizontal size={15} color="rgba(124,139,157,1)" />
                </button>
            </div>

            {/* Products Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            <th className={styles.tableHeaderCell}>AÇÕES</th>
                            <th className={styles.tableHeaderCell}>ID</th>
                            <th className={styles.tableHeaderCell}>
                                <div className={styles.sortableHeader} onClick={() => requestSort('title')}>
                                    PRODUTO <ArrowUpDown size={14} />
                                </div>
                            </th>
                            <th className={styles.tableHeaderCell}>TIPO</th>
                            <th className={styles.tableHeaderCell}>
                                <div className={styles.sortableHeader} onClick={() => requestSort('price')}>
                                    PREÇO <ArrowUpDown size={14} />
                                </div>
                            </th>
                            <th className={styles.tableHeaderCell}>DESCONTO</th>
                            <th className={styles.tableHeaderCell}>ESTOQUE</th>
                            <th className={styles.tableHeaderCell}>CATEGORIA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTableData.map((p, idx) => {
                            const isLast = idx === currentTableData.length - 1;
                            const showDivider = !(currentTableData.length === 1 && isLast) && !isLast;

                            return (
                                <tr key={p._id} className={styles.tableRow} style={{ borderBottom: showDivider ? '1px solid rgba(209, 217, 226, 1)' : 'none' }}>
                                    <td className={styles.tableCell}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                            <Link href={`/partner/catalog/edit/${p._id}`} title="Editar produto" style={{ color: '#3BB77E' }}>
                                                <Pencil size={18} />
                                            </Link>
                                            <button
                                                onClick={() => openDeleteModal(p._id, p.title)}
                                                className={styles.deleteIconBtn}
                                                title="Excluir produto"
                                                style={{ border: 'none', background: 'none' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.productIdText}>
                                            {p._id?.slice(-6).toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            {p.image ? (
                                                <div style={{ position: 'relative', width: 32, height: 32, borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                                    <Image src={p.image} alt={p.title} fill style={{ objectFit: 'cover' }} />
                                                </div>
                                            ) : (
                                                <div style={{ width: 32, height: 32, borderRadius: '4px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Package size={16} color="#ccc" />
                                                </div>
                                            )}
                                            <span className={styles.productNameText}>{p.title}</span>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault}>{p.productType || 'Geral'}</span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault} style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault} style={{ color: p.discount > 0 ? '#3BB77E' : '#999' }}>
                                            {p.discount > 0 ? `${p.discount}%` : '-'}
                                        </span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault}>{p.stock || 0}</span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <span className={styles.tableCellDefault} style={{ textTransform: 'capitalize' }}>{p.category}</span>
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

            <ProductModal 
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                partnerId={session?.user?.id || ''}
                onSuccess={fetchProducts}
            />

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modalContent} style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>EXCLUIR PRODUTO</h2>
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
                                Tem certeza que deseja excluir o produto
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: '#3BB77E', marginBottom: '1.5rem' }}>
                                {deletingProductName}
                            </p>
                            <p style={{ fontSize: 12, color: '#999', marginBottom: '2rem' }}>
                                Esta ação removerá o produto do catálogo permanentemente.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className={styles.formSubmitBtn}
                                    style={{ backgroundColor: '#e6e9ec', color: '#253D4E', flex: 1, marginTop: 0 }}
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className={styles.formSubmitBtn}
                                    style={{ backgroundColor: '#dc3545', flex: 1, marginTop: 0 }}
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
