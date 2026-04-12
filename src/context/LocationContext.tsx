"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "./ToastContext";

interface LocationState {
    lat: number | null;
    lng: number | null;
    address: string;
    city: string;
    isLoading: boolean;
    source: "gps" | "manual" | "profile" | null;
}

interface LocationContextType extends LocationState {
    setLocationFromGPS: () => void;
    setLocationManual: (lat: number, lng: number, address: string, city: string) => void;
    clearLocation: () => void;
}

const defaultState: LocationState = {
    lat: null,
    lng: null,
    address: "",
    city: "",
    isLoading: false,
    source: null,
};

const LocationContext = createContext<LocationContextType>({
    ...defaultState,
    setLocationFromGPS: () => {},
    setLocationManual: () => {},
    clearLocation: () => {},
});

export function LocationProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [location, setLocation] = useState<LocationState>(defaultState);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("clickpet_location");
            if (saved) {
                const parsed = JSON.parse(saved);
                setLocation((prev) => ({
                    ...prev,
                    ...parsed,
                    isLoading: false,
                }));
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Load from profile if logged in and no location set
    useEffect(() => {
        if (session && !location.source) {
            fetch("/api/profile")
                .then((res) => res.json())
                .then((data) => {
                    if (data.address?.street) {
                        const coords = data.address.coordinates?.coordinates;
                        const newLoc: LocationState = {
                            lat: coords?.[1] || null,
                            lng: coords?.[0] || null,
                            address: `${data.address.street}${data.address.number ? `, ${data.address.number}` : ""}`,
                            city: data.address.city || "",
                            isLoading: false,
                            source: "profile",
                        };
                        setLocation(newLoc);
                        persistLocation(newLoc);
                    }
                })
                .catch(() => {});
        }
    }, [session]);

    const persistLocation = (loc: LocationState) => {
        try {
            localStorage.setItem(
                "clickpet_location",
                JSON.stringify({
                    lat: loc.lat,
                    lng: loc.lng,
                    address: loc.address,
                    city: loc.city,
                    source: loc.source,
                })
            );
        } catch {
            // Ignore storage errors
        }
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`,
                {
                    headers: {
                        'User-Agent': 'ClickPet-App'
                    }
                }
            );
            const data = await res.json();
            if (data.address) {
                // Priority components for a readable address
                const street = data.address.road || data.address.pedestrian || data.address.path || data.address.suburb || data.address.neighbourhood || data.address.city_district || "";
                const number = data.address.house_number || "";
                const city = data.address.city || data.address.town || data.address.village || data.address.municipality || "";
                
                if (street) {
                    return {
                        address: `${street}${number ? `, ${number}` : ""}`,
                        city,
                    };
                }

                // Fallback: use the most specific part of the display_name
                const parts = data.display_name.split(',');
                return {
                    address: parts[0].trim(),
                    city,
                };
            }
        } catch (err) {
            console.error("Reverse Geocoding error:", err);
        }
        return { address: "", city: "" };
    };

    const setLocationFromGPS = useCallback(() => {
        if (!navigator.geolocation) {
            showToast("Seu navegador não suporta geolocalização.", "error");
            return;
        }

        setLocation((prev) => ({ ...prev, isLoading: true }));

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Add a small delay for better UX (feedback that it's working)
                try {
                    const { address, city } = await reverseGeocode(latitude, longitude);
                    const newLoc: LocationState = {
                        lat: latitude,
                        lng: longitude,
                        address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                        city,
                        isLoading: false,
                        source: "gps",
                    };
                    setLocation(newLoc);
                    persistLocation(newLoc);
                    showToast("Localização atualizada com sucesso!", "success");
                } catch (err) {
                    setLocation((prev) => ({ ...prev, isLoading: false }));
                    showToast("Erro ao processar endereço via GPS.", "error");
                }
            },
            (error) => {
                let errorMsg = "Erro ao obter localização.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = "Permissão de localização negada pelo navegador.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = "Sinal de GPS indisponível no momento.";
                } else if (error.code === error.TIMEOUT) {
                    errorMsg = "Tempo limite atingido ao buscar GPS.";
                }
                
                setLocation((prev) => ({ ...prev, isLoading: false }));
                showToast(errorMsg, "error");
                console.error("GPS Error:", error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }, [showToast]);

    const setLocationManual = useCallback(
        (lat: number, lng: number, address: string, city: string) => {
            const newLoc: LocationState = {
                lat,
                lng,
                address,
                city,
                isLoading: false,
                source: "manual",
            };
            setLocation(newLoc);
            persistLocation(newLoc);
        },
        []
    );

    const clearLocation = useCallback(() => {
        setLocation(defaultState);
        try {
            localStorage.removeItem("clickpet_location");
        } catch {
            // Ignore
        }
    }, []);

    return (
        <LocationContext.Provider
            value={{
                ...location,
                setLocationFromGPS,
                setLocationManual,
                clearLocation,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    return useContext(LocationContext);
}
