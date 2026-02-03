"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface MapPickerProps {
    lat: number;
    lng: number;
    onLocationChange: (lat: number, lng: number) => void;
    height?: string;
}

// Dynamically import the actual map component with SSR disabled
const DynamicMap = dynamic(() => import('./MapPickerClient'), {
    ssr: false,
    loading: () => (
        <div style={{
            height: '400px',
            background: '#f0f0f0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
        }}>
            Carregando mapa...
        </div>
    ),
});

export default function MapPicker({ lat, lng, onLocationChange, height = '400px' }: MapPickerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div style={{
                height,
                background: '#f0f0f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
            }}>
                Carregando mapa...
            </div>
        );
    }

    return <DynamicMap lat={lat} lng={lng} onLocationChange={onLocationChange} height={height} />;
}
