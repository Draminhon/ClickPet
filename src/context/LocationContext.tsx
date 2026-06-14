"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "./ToastContext";
import { formatAddress } from "@/utils/masks";


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
    const { data: session, status } = useSession();
    const { showToast } = useToast();
    const [location, setLocation] = useState<LocationState>(defaultState);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("clickpet_location");
            if (saved) {
                const parsed = JSON.parse(saved);
                
                const isAddressEmptyOrComma = (addr: string) => {
                    if (!addr) return true;
                    const cleaned = addr.trim().replace(/[\s,]+/g, '');
                    return cleaned === '' || cleaned === 'undefined';
                };

                if (isAddressEmptyOrComma(parsed.address)) {
                    localStorage.removeItem("clickpet_location");
                } else {
                    setLocation((prev) => ({
                        ...prev,
                        ...parsed,
                        isLoading: false,
                    }));
                }
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Clear location if not logged in
    useEffect(() => {
        if (status === "unauthenticated") {
            try {
                localStorage.removeItem("clickpet_location");
                // Reset state to default empty address
                setLocation(defaultState);
            } catch {
                // Ignore storage errors
            }
        }
    }, [status]);

    // Load from profile if logged in and no location set (or if location is empty/corrupted)
    useEffect(() => {
        const isAddressEmptyOrComma = (addr: string) => {
            if (!addr) return true;
            const cleaned = addr.trim().replace(/[\s,]+/g, '');
            return cleaned === '' || cleaned === 'undefined';
        };

        if (session && (!location.source || location.source === "profile" || isAddressEmptyOrComma(location.address))) {
            fetch("/api/profile")
                .then((res) => res.json())
                .then((data) => {
                    // Fallback to the first delivery address if primary is empty
                    const primaryAddr = data.address?.street ? data.address : (data.deliveryAddresses?.[0]?.street ? data.deliveryAddresses[0] : null);

                    if (primaryAddr && primaryAddr.street) {
                        const coords = primaryAddr.coordinates?.coordinates;
                        const formatted = formatAddress(primaryAddr.street, primaryAddr.number);
                        if (formatted && !isAddressEmptyOrComma(formatted)) {
                            const newLoc: LocationState = {
                                lat: coords?.[1] || null,
                                lng: coords?.[0] || null,
                                address: formatted,
                                city: primaryAddr.city || "",
                                isLoading: false,
                                source: "profile",
                            };
                            setLocation(newLoc);
                            persistLocation(newLoc);
                            return;
                        }
                    }

                    // If no valid address in profile, clear the location state if it is currently empty/comma or profile-sourced
                    if (isAddressEmptyOrComma(location.address) || location.source === "profile") {
                        setLocation(defaultState);
                        try {
                            localStorage.removeItem("clickpet_location");
                        } catch {}
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
