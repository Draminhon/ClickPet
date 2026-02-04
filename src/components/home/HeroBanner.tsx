"use client";

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Search } from 'lucide-react';
import styles from './HeroBanner.module.css';

const TABS = ['RAÇÕES', 'UTENSILIOS', 'FARMACIA', 'BANHO & TOSA'];

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
    const [activeTab, setActiveTab] = useState('RAÇÕES');
    const [filters, setFilters] = useState({
        marca: 'Selecione',
        qualidade: 'Selecione',
        animal: 'Selecione'
    });

    const handleSearch = () => {
        const query = `?cat=${activeTab.toLowerCase()}&marca=${filters.marca}&qualidade=${filters.qualidade}&animal=${filters.animal}`;
        window.location.href = `/search${query}`;
    };

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
                                key={tab}
                                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className={styles.searchBar}>
                        <Dropdown
                            title="Marca"
                            subtitle={filters.marca}
                            options={['Royal Canin', 'Hills', 'Guabi Natural', 'Premier']}
                            onSelect={(val) => setFilters({ ...filters, marca: val })}
                        />
                        <div className={styles.divider} />
                        <Dropdown
                            title="Qualidade"
                            subtitle={filters.qualidade}
                            options={['Premium', 'Super Premium', 'Standard']}
                            onSelect={(val) => setFilters({ ...filters, qualidade: val })}
                        />
                        <div className={styles.divider} />
                        <Dropdown
                            title="Animal"
                            subtitle={filters.animal}
                            options={['Cães', 'Gatos', 'Aves', 'Peixes']}
                            onSelect={(val) => setFilters({ ...filters, animal: val })}
                        />

                        <button className={styles.searchConfirm} onClick={handleSearch}>
                            <Search className={styles.searchIcon} size={17.76} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.rightContent}>
                <Image
                    src="/assets/banner/banner_image.png"
                    alt="Banner Image"
                    fill
                    className={styles.bannerImage}
                    priority
                />
            </div>
        </div>
    );
}
