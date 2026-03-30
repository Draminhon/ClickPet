"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export interface CartItem {
    id: string;
    title: string;
    price: number;
    quantity: number;
    shopName: string;
    image: string;
    productType: string;
    subCategory: string;
    selectedWeight?: string;
    partnerId?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    count: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [items, setItems] = useState<CartItem[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Update current userId from session
    useEffect(() => {
        if (session?.user?.id) {
            setUserId(session.user.id);
        } else {
            setUserId(null);
            setItems([]); // Clear in-memory items when logged out
        }
    }, [session]);

    // Load from localStorage when userId is available
    useEffect(() => {
        if (userId) {
            const saved = localStorage.getItem(`clickpet_cart_${userId}`);
            if (saved) {
                try {
                    setItems(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse cart', e);
                    setItems([]);
                }
            } else {
                setItems([]);
            }
        }
    }, [userId]);

    // Save to localStorage whenever items OR userId change
    useEffect(() => {
        if (userId) {
            localStorage.setItem(`clickpet_cart_${userId}`, JSON.stringify(items));
        }
    }, [items, userId]);

    const addToCart = (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
        setItems(current => {
            const existing = current.find(item => item.id === newItem.id);
            if (existing) {
                return current.map(item =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...current, { ...newItem, quantity }];
        });
    };

    const removeFromCart = (id: string) => {
        setItems(current => current.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        setItems(current => current.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
        ));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, count }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
