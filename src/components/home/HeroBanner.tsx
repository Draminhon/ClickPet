"use client";

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Search } from 'lucide-react';
import styles from './HeroBanner.module.css';

const TABS = [
    { label: 'RAÇÕES', category: 'food', type: 'product' },
    { label: 'UTENSILIOS', category: 'toys', type: 'product' },
    { label: 'FARMACIA', category: 'pharma', type: 'product' },
    { label: 'BANHO & TOSA', category: 'bath', type: 'service' },
];

// Contextual dropdown options per tab
const FILTER_OPTIONS: Record<string, { filter1: { title: string; options: string[] }; filter2: { title: string; options: string[] }; filter3: { title: string; options: string[] } }> = {
    food: {
        filter1: { title: 'Marca', options: ['Royal Canin', 'Hills', 'Guabi Natural', 'Premier', 'GranPlus', 'Pedigree', 'Whiskas'] },
        filter2: { title: 'Tipo', options: ['Seca', 'Úmida', 'Medicinal', 'Natural'] },
        filter3: { title: 'Animal', options: ['Cães', 'Gatos', 'Aves', 'Peixes', 'Roedores'] },
    },
    toys: {
        filter1: { title: 'Material', options: ['Borracha', 'Pelúcia', 'Corda', 'Nylon', 'Plástico'] },
        filter2: { title: 'Porte', options: ['Pequeno', 'Médio', 'Grande'] },
        filter3: { title: 'Animal', options: ['Cães', 'Gatos', 'Aves', 'Roedores'] },
    },
    pharma: {
        filter1: { title: 'Tipo', options: ['Antipulgas', 'Vermífugo', 'Vitaminas', 'Shampoo Medicinal', 'Pomadas'] },
        filter2: { title: 'Porte', options: ['Pequeno', 'Médio', 'Grande'] },
        filter3: { title: 'Animal', options: ['Cães', 'Gatos', 'Aves', 'Peixes'] },
    },
    bath: {
        filter1: { title: 'Serviço', options: ['Banho', 'Tosa', 'Banho & Tosa', 'Hidratação', 'Spa'] },
        filter2: { title: 'Animal', options: ['Cães', 'Gatos', 'Todos'] },
        filter3: { title: 'Porte', options: ['Mini', 'Pequeno', 'Médio', 'Grande', 'Gigante'] },
    },
};

interface DropdownProps {
    title: string;
    subtitle: string;
    options: string[];
    onSelect: (option: string) => void;
}

const Dropdown = ({ title, subtitle, options, onSelect }: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.dropdown} onClick={() => setIsOpen(!isOpen)}>
            <div className={styles.dropdownTitle}>{title}</div>
            <div className={styles.dropdownSubtitle}>{subtitle}</div>
            <ChevronDown className={styles.dropdownArrow} size={24} strokeWidth={1.5} />

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    borderRadius: '12px',
                    zIndex: 1000,
                    marginTop: '10px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {options.map(opt => (
                        <div
                            key={opt}
                            style={{ padding: '10px 20px', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(opt);
                                setIsOpen(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function HeroBanner() {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [filters, setFilters] = useState({
        filter1: 'Selecione',
        filter2: 'Selecione',
        filter3: 'Selecione'
    });

    const handleTabChange = (tab: typeof TABS[0]) => {
        setActiveTab(tab);
        setFilters({ filter1: 'Selecione', filter2: 'Selecione', filter3: 'Selecione' });
    };

    const handleSearch = () => {
        if (activeTab.type === 'service') {
            window.location.href = `/services?category=${activeTab.category}`;
            return;
        }
        const query = `?cat=${activeTab.category}&filter1=${filters.filter1}&filter2=${filters.filter2}&filter3=${filters.filter3}`;
        window.location.href = `/search${query}`;
    };

    const currentFilters = FILTER_OPTIONS[activeTab.category] || FILTER_OPTIONS['food'];

    return (
        <div className={styles.heroBanner}>
            <div className={styles.leftContent}>
                <h1 className={styles.title}>
                    Tudo para o seu pet em um só lugar!
                </h1>
                <p className={styles.subtitle}>
                    Oferecemos o <strong>melhor</strong> para seu animal de estimação, com <strong>qualidade</strong> e entrega rápida
                </p>

                <div className={styles.filterWrapper}>
                    <div className={styles.tabs}>
                        {TABS.map(tab => (
                            <button
                                key={tab.label}
                                className={`${styles.tab} ${activeTab.label === tab.label ? styles.activeTab : ''}`}
                                onClick={() => handleTabChange(tab)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.searchBar}>
                        <Dropdown
                            title={currentFilters.filter1.title}
                            subtitle={filters.filter1}
                            options={currentFilters.filter1.options}
                            onSelect={(val) => setFilters({ ...filters, filter1: val })}
                        />
                        <div className={styles.divider} />
                        <Dropdown
                            title={currentFilters.filter2.title}
                            subtitle={filters.filter2}
                            options={currentFilters.filter2.options}
                            onSelect={(val) => setFilters({ ...filters, filter2: val })}
                        />
                        <div className={styles.divider} />
                        <Dropdown
                            title={currentFilters.filter3.title}
                            subtitle={filters.filter3}
                            options={currentFilters.filter3.options}
                            onSelect={(val) => setFilters({ ...filters, filter3: val })}
                        />

                        <button className={styles.searchConfirm} onClick={handleSearch}>
                            <Search className={styles.searchIcon} size={17.76} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.rightContent}>
                <Image
                    src="/banner/banner_image.png"
                    alt="Banner Image"
                    fill
                    className={styles.bannerImage}
                    priority
                />
            </div>
        </div>
    );
}
