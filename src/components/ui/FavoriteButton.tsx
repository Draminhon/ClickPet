"use client";

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
    productId?: string;
    partnerId?: string;
    size?: number;
}

export default function FavoriteButton({ productId, partnerId, size = 24 }: FavoriteButtonProps) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const router = useRouter();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session) {
            checkFavorite();
        }
    }, [session, productId, partnerId]);

    const checkFavorite = async () => {
        try {
            const res = await fetch('/api/favorites');
            const favorites = await res.json();

            const exists = favorites.some((fav: any) =>
                (productId && fav.productId?._id === productId) ||
                (partnerId && fav.partnerId?._id === partnerId)
            );

            setIsFavorite(exists);
        } catch (error) {
            // Silently fail
        }
    };

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session) {
            showToast('Faça login para favoritar', 'error');
            router.push('/login');
            return;
        }

        setLoading(true);

        try {
            if (isFavorite) {
                // Remove favorite
                const params = new URLSearchParams();
                if (productId) params.append('productId', productId);
                if (partnerId) params.append('partnerId', partnerId);

                const res = await fetch(`/api/favorites?${params}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    setIsFavorite(false);
                    showToast('Removido dos favoritos');
                }
            } else {
                // Add favorite
                const res = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId, partnerId }),
                });

                if (res.ok) {
                    setIsFavorite(true);
                    showToast('Adicionado aos favoritos!');
                } else {
                    const error = await res.json();
                    showToast(error.message, 'error');
                }
            }
        } catch (error) {
            showToast('Erro ao atualizar favoritos', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={loading}
            style={{
                background: 'white',
                border: '2px solid #ddd',
                borderRadius: '50%',
                width: size + 16,
                height: size + 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.borderColor = '#ff4757';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = '#ddd';
            }}
        >
            <Heart
                size={size}
                fill={isFavorite ? '#ff4757' : 'none'}
                color={isFavorite ? '#ff4757' : '#999'}
            />
        </button>
    );
}
