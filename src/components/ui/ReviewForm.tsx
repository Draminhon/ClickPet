"use client";

import { useState } from 'react';
import StarRating from './StarRating';
import { useToast } from '@/context/ToastContext';

interface ReviewFormProps {
    productId?: string;
    partnerId?: string;
    orderId?: string;
    onSuccess?: () => void;
}

export default function ReviewForm({ productId, partnerId, orderId, onSuccess }: ReviewFormProps) {
    const { showToast } = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            showToast('Selecione uma avaliação', 'error');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    partnerId,
                    orderId,
                    rating,
                    comment,
                }),
            });

            if (res.ok) {
                showToast('Avaliação enviada com sucesso!');
                setRating(0);
                setComment('');
                onSuccess?.();
            } else {
                const error = await res.json();
                showToast(error.message || 'Erro ao enviar avaliação', 'error');
            }
        } catch (error) {
            showToast('Erro ao enviar avaliação', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Deixe sua avaliação</h3>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Sua nota:</label>
                <StarRating rating={rating} onRate={setRating} size={32} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Comentário (opcional):</label>
                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    maxLength={500}
                    placeholder="Conte sua experiência..."
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', fontFamily: 'inherit' }}
                />
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.3rem' }}>{comment.length}/500</p>
            </div>

            <button
                type="submit"
                disabled={submitting || rating === 0}
                className="btn btn-primary"
                style={{ opacity: rating === 0 ? 0.5 : 1 }}
            >
                {submitting ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
        </form>
    );
}
