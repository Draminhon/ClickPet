"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductOfferCard from '@/components/home/ProductOfferCard';
import { Filter, ChevronDown } from 'lucide-react';
import styles from './Search.module.css';

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
    const [onlyDiscount, setOnlyDiscount] = useState(false);
    const [sortBy, setSortBy] = useState('');
    const [age, setAge] = useState('');
    const [foodType, setFoodType] = useState('');
    const [breedType, setBreedType] = useState('');

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

        // Age filter (mocking logic based on subCategory/tags if needed)
        if (age) {
            filtered = filtered.filter(p => p.subCategory?.toLowerCase().includes(age.toLowerCase()));
        }

        // Food Type filter
        if (foodType) {
            filtered = filtered.filter(p => p.productType?.toLowerCase().includes(foodType.toLowerCase()));
        }

        // Breed filter
        if (breedType) {
            filtered = filtered.filter(p => p.subCategory?.toLowerCase().includes(breedType.toLowerCase()));
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
    }, [products, minPrice, maxPrice, onlyDiscount, sortBy, age, foodType, breedType]);

    const clearFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setOnlyDiscount(false);
        setSortBy('');
        setAge('');
        setFoodType('');
        setBreedType('');
        setCategory('');
    };

    return (
        <div className={styles.container}>
            {/* Sidebar Filters */}
            <aside className={styles.sidebar}>
                <Filter className={styles.filterIcon} size={32} />

                {/* Categorias */}
                <div>
                    <h3 className={styles.sectionTitle}>Categorias</h3>
                    <div className={styles.filterGroup}>
                        {[
                            { value: '', label: 'Todos' },
                            { value: 'food', label: 'Rações' },
                            { value: 'toys', label: 'Brinquedos' },
                            { value: 'pharma', label: 'Farmácia' },
                            { value: 'bath', label: 'Banho & Tosa' },
                        ].map(cat => (
                            <label key={cat.value} className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="category"
                                    className={styles.radioInput}
                                    checked={category === cat.value}
                                    onChange={() => setCategory(cat.value)}
                                />
                                {cat.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Idade */}
                <div>
                    <h3 className={styles.sectionTitle}>Idade</h3>
                    <div className={styles.filterGroup}>
                        {[
                            { value: '', label: 'Todas' },
                            { value: 'filhote', label: 'Filhote' },
                            { value: 'adulto', label: 'Adulto' },
                            { value: 'senior', label: 'Sênior' },
                        ].map(item => (
                            <label key={item.value} className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="age"
                                    className={styles.radioInput}
                                    checked={age === item.value}
                                    onChange={() => setAge(item.value)}
                                />
                                {item.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Tipo de ração */}
                <div>
                    <h3 className={styles.sectionTitle}>Tipo de ração</h3>
                    <div className={styles.filterGroup}>
                        {[
                            { value: '', label: 'Todos' },
                            { value: 'seca', label: 'Seca' },
                            { value: 'umida', label: 'Úmida' },
                            { value: 'medicinal', label: 'Medicinal' },
                        ].map(item => (
                            <label key={item.value} className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="foodType"
                                    className={styles.radioInput}
                                    checked={foodType === item.value}
                                    onChange={() => setFoodType(item.value)}
                                />
                                {item.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.divider}></div>

                {/* Faixa de Preço */}
                <div>
                    <h3 className={styles.sectionTitle}>Faixa de Preço</h3>
                    <div className={styles.priceRangeRow}>
                        <div className={styles.priceInputContainer}>
                            <input
                                type="number"
                                placeholder="Min"
                                className={styles.priceInput}
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                            />
                        </div>
                        <span className={styles.priceSeparator}>-</span>
                        <div className={styles.priceInputContainer}>
                            <input
                                type="number"
                                placeholder="Max"
                                className={styles.priceInput}
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Somente com descontos */}
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        className={styles.checkboxInput}
                        checked={onlyDiscount}
                        onChange={e => setOnlyDiscount(e.target.checked)}
                    />
                    Somente com descontos
                </label>

                <div className={styles.divider}></div>

                {/* Ordenar por */}
                <div>
                    <h3 className={styles.sectionTitle}>Ordenar por</h3>
                    <div className={styles.selectorsGroup}>
                        <div className={styles.customSelect}>
                            <span className={styles.selectText}>
                                {sortBy === '' ? 'Relevância' :
                                    sortBy === 'price_asc' ? 'Menor preço' :
                                        sortBy === 'price_desc' ? 'Maior preço' : 'Maior desconto'}
                            </span>
                            <ChevronDown className={styles.selectIcon} size={12} />
                            <select
                                className={styles.nativeSelect}
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="">Relevância</option>
                                <option value="price_asc">Menor preço</option>
                                <option value="price_desc">Maior preço</option>
                                <option value="discount">Maior desconto</option>
                            </select>
                        </div>

                        <div className={styles.customSelect}>
                            <span className={styles.selectText}>
                                {breedType === '' ? 'Raça etc.' : breedType}
                            </span>
                            <ChevronDown className={styles.selectIcon} size={12} />
                            <select
                                className={styles.nativeSelect}
                                value={breedType}
                                onChange={e => setBreedType(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="Shih Tzu">Shih Tzu</option>
                                <option value="Poodle">Poodle</option>
                                <option value="Golden Retriever">Golden Retriever</option>
                                <option value="Bulldog">Bulldog</option>
                            </select>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Results Grid */}
            <main className={styles.mainContent}>
                {filteredProducts.length === 0 ? (
                    <div className={styles.noResults}>
                        <p>Nenhum produto encontrado com os filtros selecionados.</p>
                        <button onClick={clearFilters} className="btn btn-primary">
                            Limpar Filtros
                        </button>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filteredProducts.map(product => (
                            <ProductOfferCard
                                key={product._id}
                                id={product._id}
                                title={product.title}
                                price={product.price}
                                image={product.image}
                                discount={product.discount}
                                shopName={product.partnerId?.name || 'Petshop'}
                                productType={product.productType}
                                subCategory={product.subCategory}
                                rating={product.rating}
                                salesCount={product.salesCount}
                                noBorder
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
