"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductOfferCard from '@/components/home/ProductOfferCard';
import { Filter, ChevronDown, Scissors } from 'lucide-react';
import styles from './Search.module.css';

function SearchContent() {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get('cat') || '';
    const initialSearch = searchParams.get('q') || '';

    const [products, setProducts] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [filteredServices, setFilteredServices] = useState<any[]>([]);
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
        let productUrl = '/api/products?';
        if (category && category !== 'bath') productUrl += `category=${category}&`;
        if (search) productUrl += `search=${search}`;

        let serviceUrl = '/api/services?';
        if (category === 'bath') serviceUrl += `category=bath&`;

        Promise.all([
            fetch(productUrl).then(res => res.json()),
            fetch(serviceUrl).then(res => res.json())
        ]).then(([prodData, servData]) => {
            setProducts(Array.isArray(prodData) ? prodData : []);
            setServices(Array.isArray(servData) ? servData : []);
        });
    }, [category, search]);

    useEffect(() => {
        // Filter Products
        let fProducts = [...products];
        if (minPrice) {
            fProducts = fProducts.filter(p => {
                const price = p.discount ? p.price * (1 - p.discount / 100) : p.price;
                return price >= parseFloat(minPrice);
            });
        }
        if (maxPrice) {
            fProducts = fProducts.filter(p => {
                const price = p.discount ? p.price * (1 - p.discount / 100) : p.price;
                return price <= parseFloat(maxPrice);
            });
        }
        if (onlyDiscount) fProducts = fProducts.filter(p => p.discount && p.discount > 0);
        if (age) fProducts = fProducts.filter(p => p.subCategory?.toLowerCase().includes(age.toLowerCase()));
        if (foodType) fProducts = fProducts.filter(p => p.productType?.toLowerCase().includes(foodType.toLowerCase()));
        if (breedType) fProducts = fProducts.filter(p => p.subCategory?.toLowerCase().includes(breedType.toLowerCase()));

        // Filter Services (Simple search match)
        let fServices = [...services];
        if (search) {
            fServices = fServices.filter(s =>
                s.name?.toLowerCase().includes(search.toLowerCase()) ||
                s.description?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (minPrice) {
            fServices = fServices.filter(s => {
                const minSPrice = Math.min(...(s.prices?.map((p: any) => p.price) || [0]));
                return minSPrice >= parseFloat(minPrice);
            });
        }
        if (maxPrice) {
            fServices = fServices.filter(s => {
                const minSPrice = Math.min(...(s.prices?.map((p: any) => p.price) || [0]));
                return minSPrice <= parseFloat(maxPrice);
            });
        }

        // Sorting
        const sortFn = (a: any, b: any) => {
            const getPrice = (item: any) => {
                if (item.prices) return Math.min(...item.prices.map((p: any) => p.price));
                return item.discount ? item.price * (1 - item.discount / 100) : item.price;
            };
            const priceA = getPrice(a);
            const priceB = getPrice(b);

            if (sortBy === 'price_asc') return priceA - priceB;
            if (sortBy === 'price_desc') return priceB - priceA;
            if (sortBy === 'discount') return (b.discount || 0) - (a.discount || 0);
            return 0;
        };

        setFilteredProducts(fProducts.sort(sortFn));
        setFilteredServices(fServices.sort(sortFn));
    }, [products, services, minPrice, maxPrice, onlyDiscount, sortBy, age, foodType, breedType, search]);

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
                {filteredProducts.length === 0 && filteredServices.length === 0 ? (
                    <div className={styles.noResults}>
                        <p>Nenhum produto ou serviço encontrado com os filtros selecionados.</p>
                        <button onClick={clearFilters} className="btn btn-primary">
                            Limpar Filtros
                        </button>
                    </div>
                ) : (
                    <div className={styles.resultsWrapper}>
                        {filteredServices.length > 0 && (
                            <section className={styles.servicesSection}>
                                <h2 className={styles.resultTitle}>Serviços Disponíveis</h2>
                                <div className={styles.grid}>
                                    {filteredServices.map(service => (
                                        <Link href={`/services/${service._id}`} key={service._id} className={styles.serviceSearchCard}>
                                            <div className={styles.serviceImageWrapper}>
                                                {service.image ? (
                                                    <img src={service.image} alt={service.name} className={styles.serviceImage} />
                                                ) : (
                                                    <div className={styles.servicePlaceholder}>
                                                        <Scissors size={32} color="#ccc" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.serviceInfo}>
                                                <h4 className={styles.serviceName}>{service.name}</h4>
                                                <p className={styles.serviceShop}>{service.partnerId?.name}</p>
                                                <div className={styles.serviceFooter}>
                                                    <span className={styles.servicePrice}>
                                                        R$ {Math.min(...(service.prices?.map((p: any) => p.price) || [0])).toFixed(2)}
                                                    </span>
                                                    <button className={styles.viewServiceBtn}>Agendar</button>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredProducts.length > 0 && (
                            <section className={styles.productsSection}>
                                <h2 className={styles.resultTitle}>Produtos Encontrados</h2>
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
                            </section>
                        )}
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
