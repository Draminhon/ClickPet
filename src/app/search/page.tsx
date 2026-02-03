"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import { Filter, SlidersHorizontal } from 'lucide-react';

function SearchContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('cat') || '';
    const initialSearch = searchParams.get('q') || '';

    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [category, setCategory] = useState(initialCategory);
    const [search, setSearch] = useState(initialSearch);

    // Advanced filters
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [onlyDiscount, setOnlyDiscount] = useState(false);
    const [sortBy, setSortBy] = useState('');

    useEffect(() => {
        let url = '/api/products?';
        if (category) url += `category=${category}&`;
        if (search) url += `search=${search}`;

        fetch(url)
            .then(res => res.json())
            .then(data => setProducts(data));
    }, [category, search]);

    useEffect(() => {
        let filtered = [...products];

        // Price filter
        if (minPrice) {
            filtered = filtered.filter(p => {
                const price = p.discount ? p.price * (1 - p.discount / 100) : p.price;
                return price >= parseFloat(minPrice);
            });
        }
        if (maxPrice) {
            filtered = filtered.filter(p => {
                const price = p.discount ? p.price * (1 - p.discount / 100) : p.price;
                return price <= parseFloat(maxPrice);
            });
        }

        // Discount filter
        if (onlyDiscount) {
            filtered = filtered.filter(p => p.discount && p.discount > 0);
        }

        // Sort
        if (sortBy === 'price_asc') {
            filtered.sort((a, b) => {
                const priceA = a.discount ? a.price * (1 - a.discount / 100) : a.price;
                const priceB = b.discount ? b.price * (1 - b.discount / 100) : b.price;
                return priceA - priceB;
            });
        } else if (sortBy === 'price_desc') {
            filtered.sort((a, b) => {
                const priceA = a.discount ? a.price * (1 - a.discount / 100) : a.price;
                const priceB = b.discount ? b.price * (1 - b.discount / 100) : b.price;
                return priceB - priceA;
            });
        } else if (sortBy === 'discount') {
            filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        }

        setFilteredProducts(filtered);
    }, [products, minPrice, maxPrice, minRating, onlyDiscount, sortBy]);

    const clearFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setMinRating(0);
        setOnlyDiscount(false);
        setSortBy('');
    };

    return (
        <div className="container" style={{ padding: '2rem 0', display: 'flex', gap: '2rem' }}>
            {/* Sidebar Filters */}
            <aside style={{ width: '280px', flexShrink: 0 }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Filter size={20} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Filtros</h3>
                        </div>
                        <button
                            onClick={clearFilters}
                            style={{ fontSize: '0.85rem', color: '#6CC551', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Limpar
                        </button>
                    </div>

                    {/* Category Filter */}
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem' }}>Categoria</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                                { value: '', label: 'Todos' },
                                { value: 'food', label: '🍖 Rações' },
                                { value: 'toys', label: '🎾 Brinquedos' },
                                { value: 'pharma', label: '💊 Farmácia' },
                                { value: 'bath', label: '🛁 Banho & Tosa' },
                            ].map(cat => (
                                <label key={cat.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={category === cat.value}
                                        onChange={() => setCategory(cat.value)}
                                    />
                                    {cat.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Filter */}
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem' }}>Faixa de Preço</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                            />
                            <span>-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>

                    {/* Discount Filter */}
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eee' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={onlyDiscount}
                                onChange={e => setOnlyDiscount(e.target.checked)}
                            />
                            Somente com desconto
                        </label>
                    </div>

                    {/* Sort */}
                    <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.8rem' }}>Ordenar por</h4>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                        >
                            <option value="">Relevância</option>
                            <option value="price_asc">Menor preço</option>
                            <option value="price_desc">Maior preço</option>
                            <option value="discount">Maior desconto</option>
                        </select>
                    </div>
                </div>
            </aside>

            {/* Results Grid */}
            <main style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="section-title" style={{ margin: 0 }}>
                        {search ? `Resultados para "${search}"` : 'Produtos'}
                    </h1>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
                    </span>
                </div>

                {filteredProducts.length === 0 ? (
                    <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <p style={{ color: '#666', marginBottom: '1rem' }}>Nenhum produto encontrado com os filtros selecionados.</p>
                        <button onClick={clearFilters} className="btn btn-primary">
                            Limpar Filtros
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product._id}
                                id={product._id}
                                title={product.title}
                                shopName={product.partnerId?.name || 'Parceiro'}
                                price={product.price}
                                image={product.image}
                                discount={product.discount}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Carregando...</div>}>
            <SearchContent />
        </Suspense>
    );
}
