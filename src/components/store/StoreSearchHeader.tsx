'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Truck, ChevronDown, ShoppingBag } from 'lucide-react';
import styles from '@/app/loja/[id]/profile.module.css';

interface StoreSearchHeaderProps {
    shopName: string;
}

export default function StoreSearchHeader({ shopName }: StoreSearchHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const handleSelectOption = (mode: 'delivery' | 'pickup') => {
        setDeliveryMode(mode);
        setIsDropdownOpen(false);
    };

    return (
        <div className={styles.searchWrapper}>
            <div className={styles.searchContainer}>
                <Search className={styles.searchIcon} size={24} />
                <div className={styles.searchDivider}></div>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="E aí, está precisando de quê?"
                    readOnly
                />
            </div>

            <div className={styles.deliveryDropdownWrapper} ref={dropdownRef}>
                <div 
                    className={styles.deliverySelector} 
                    onClick={toggleDropdown}
                >
                    {deliveryMode === 'delivery' ? (
                        <Truck className={styles.deliveryIcon} size={22} style={{ height: '15.13px' }} />
                    ) : (
                        <ShoppingBag className={styles.deliveryIcon} size={22} style={{ height: '15.13px' }} />
                    )}
                    
                    <span className={styles.deliveryText}>
                        {deliveryMode === 'delivery' ? 'Entrega' : 'ir Receber'}
                    </span>
                    
                    <ChevronDown 
                        className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.dropdownArrowOpen : ''}`} 
                        size={12} 
                        strokeWidth={2} 
                    />
                </div>

                {isDropdownOpen && (
                    <div className={styles.deliveryDropdownMenu}>
                        <div 
                            className={`${styles.deliveryOption} ${deliveryMode === 'delivery' ? styles.selectedOption : ''}`}
                            onClick={() => handleSelectOption('delivery')}
                        >
                            <div className={styles.optionIconWrapper}>
                                <Truck size={18} />
                            </div>
                            <div className={styles.optionInfo}>
                                <span className={styles.optionTitle}>Entrega</span>
                                <span className={styles.optionDesc}>Receba em casa</span>
                            </div>
                        </div>

                        <div 
                            className={`${styles.deliveryOption} ${deliveryMode === 'pickup' ? styles.selectedOption : ''}`}
                            onClick={() => handleSelectOption('pickup')}
                        >
                            <div className={styles.optionIconWrapper}>
                                <ShoppingBag size={18} />
                            </div>
                            <div className={styles.optionInfo}>
                                <span className={styles.optionTitle}>Ir Receber</span>
                                <span className={styles.optionDesc}>Retire na loja</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
