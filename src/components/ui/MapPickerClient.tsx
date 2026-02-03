"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

interface MapPickerClientProps {
    lat: number;
    lng: number;
    onLocationChange: (lat: number, lng: number) => void;
    height?: string;
}

export default function MapPickerClient({ lat, lng, onLocationChange, height = '400px' }: MapPickerClientProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [geoLoading, setGeoLoading] = useState(false);

    // Default to São Paulo if no coordinates provided
    const initialLat = lat !== undefined && lat !== null ? lat : -23.550520;
    const initialLng = lng !== undefined && lng !== null ? lng : -46.633308;

    const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

    // Handle incoming prop changes
    useEffect(() => {
        if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
            setPosition([lat, lng]);

            // Update marker and map view if they exist
            if (mapInstanceRef.current && markerRef.current) {
                const newPos = new L.LatLng(lat, lng);
                markerRef.current.setLatLng(newPos);
                mapInstanceRef.current.setView(newPos, mapInstanceRef.current.getZoom());
            }
        }
    }, [lat, lng]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Cleanup existing map if somehow present
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        // Fix icons (only needs to run once)
        if (!(L.Icon.Default.prototype as any)._merged) {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
            (L.Icon.Default.prototype as any)._merged = true;
        }

        // Create Map
        const map = L.map(mapContainerRef.current).setView(position, 13);
        mapInstanceRef.current = map;

        // Add Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add Marker
        const marker = L.marker(position, { draggable: true }).addTo(map);
        markerRef.current = marker;

        // Handle Map Clicks
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng(e.latlng);
            setPosition([lat, lng]);
            onLocationChange(lat, lng);
        });

        // Handle Marker Drag
        marker.on('dragend', () => {
            const { lat, lng } = marker.getLatLng();
            setPosition([lat, lng]);
            onLocationChange(lat, lng);
        });

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    const handleCenterOnUser = () => {
        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada pelo seu navegador');
            return;
        }

        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos: [number, number] = [latitude, longitude];

                setPosition(newPos);

                if (mapInstanceRef.current && markerRef.current) {
                    const leafletPos = new L.LatLng(latitude, longitude);
                    markerRef.current.setLatLng(leafletPos);
                    mapInstanceRef.current.setView(leafletPos, 16); // Zoom in closer
                }

                onLocationChange(latitude, longitude);
                setGeoLoading(false);
            },
            (err) => {
                console.error('Error getting location:', err);
                alert('Não foi possível obter sua localização. Verifique as permissões do seu navegador.');
                setGeoLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
            <div style={{ position: 'relative' }}>
                <div
                    ref={mapContainerRef}
                    style={{ height, width: '100%', zIndex: 0 }}
                />
                <button
                    type="button"
                    onClick={handleCenterOnUser}
                    disabled={geoLoading}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 1000,
                        background: 'white',
                        border: '2px solid rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
                        color: '#333'
                    }}
                    title="Minha Localização"
                >
                    <Navigation size={16} fill={geoLoading ? "#999" : "currentColor"} />
                    {geoLoading ? 'Obtendo...' : 'Minha Localização'}
                </button>
            </div>
            <div style={{
                padding: '0.8rem',
                background: '#f9f9f9',
                fontSize: '0.85rem',
                color: '#666',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>📍 Clique no mapa ou arraste o marcador para selecionar a localização</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </span>
            </div>
        </div>
    );
}
