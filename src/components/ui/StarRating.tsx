import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    onRate?: (rating: number) => void;
    readonly?: boolean;
    size?: number;
}

export default function StarRating({ rating, onRate, readonly = false, size = 20 }: StarRatingProps) {
    const stars = [1, 2, 3, 4, 5];

    return (
        <div style={{ display: 'flex', gap: '0.2rem' }}>
            {stars.map(star => (
                <Star
                    key={star}
                    size={size}
                    fill={star <= rating ? '#FFC107' : 'none'}
                    color={star <= rating ? '#FFC107' : '#ddd'}
                    style={{ cursor: readonly ? 'default' : 'pointer' }}
                    onClick={() => !readonly && onRate && onRate(star)}
                />
            ))}
        </div>
    );
}
