"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import styles from './HeroBanner.module.css';

export default function HeroBanner() {
    const {
        address,
        isLoading,
        setLocationFromGPS,
        setLocationManual,
        lat,
        lng,
        clearLocation
    } = useLocation();

    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);
    const prevAddressRef = useRef(address);

    // Keep local input in sync with context address when it changes (e.g. via GPS)
    useEffect(() => {
        if (address !== prevAddressRef.current) {
            setInputValue(address || '');
            prevAddressRef.current = address;
        }
    }, [address]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
                if (!inputValue.trim()) {
                    setIsEditing(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [inputValue]);

    const handleInputChange = (value: string) => {
        setInputValue(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.trim().length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=br&limit=5&accept-language=pt-BR`
                );
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 400);
    };

    const handleSelectSuggestion = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        const displayName = suggestion.display_name.split(',').slice(0, 3).join(',');

        // Extract city from the result
        const parts = suggestion.display_name.split(',').map((s: string) => s.trim());
        const city = parts.length > 2 ? parts[2] : parts[1] || '';

        setLocationManual(lat, lng, displayName, city);
        setInputValue(displayName);
        setShowSuggestions(false);
        setIsEditing(false);
    };

    const handleGPSClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLocationFromGPS();
        setIsEditing(false);
        setShowSuggestions(false);
    };

    const handleClearClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        clearLocation();
        setInputValue('');
        setSuggestions([]);
        setShowSuggestions(false);
        setIsEditing(true);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleBarClick = () => {
        if (!isEditing) {
            setIsEditing(true);
            setInputValue(address || '');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsEditing(false);
            setShowSuggestions(false);
        }
    };

    return (
        <div className={styles.heroBanner}>
            {/* Background Image */}
            <div className={styles.imageWrapper}>
                <Image
                    src="/banner/hero_pets.png"
                    alt="ClickPet Banner"
                    fill
                    sizes="100vw"
                    className={styles.bannerImage}
                    priority
                />
                <div className={styles.imageOverlay} />
            </div>

            {/* Location Search Bar */}
            <div className={styles.searchBarContainer}>
                <div
                    ref={searchBarRef}
                    className={styles.searchBar}
                    onClick={handleBarClick}
                >
                    {/* GPS Icon */}
                    <div className={styles.gpsIcon}>
                        <MapPin size={18} strokeWidth={2} color="#272727" />
                    </div>

                    {/* Divider */}
                    <div className={styles.divider} />

                    {/* Input / Placeholder */}
                    <div className={styles.inputArea}>
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                className={styles.locationInput}
                                value={inputValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Insira sua localização e número"
                            />
                        ) : (
                            <span className={address ? styles.locationText : styles.placeholderText}>
                                {address || 'Insira sua localização e número'}
                            </span>
                        )}
                    </div>

                    {/* Clear Button */}
                    {(inputValue || address) && (
                        <button
                            className={styles.clearButton}
                            onClick={handleClearClick}
                            title="Limpar localização"
                        >
                            <X size={16} color="#878787" />
                        </button>
                    )}

                    {/* GPS Button */}
                    <button
                        className={styles.gpsButton}
                        onClick={handleGPSClick}
                        title="Usar minha localização atual"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 size={18} className={styles.spinner} />
                        ) : (
                            <Navigation size={18} strokeWidth={2} />
                        )}
                    </button>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                        <div className={styles.suggestionsDropdown}>
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    className={styles.suggestionItem}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectSuggestion(s);
                                    }}
                                >
                                    <MapPin size={14} color="#878787" />
                                    <span>{s.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
