interface OrderStatusBadgeProps {
    status: string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
        pending: { label: 'Pendente', color: '#856404', bg: '#fff3cd' },
        accepted: { label: 'Aceito', color: '#004085', bg: '#cce5ff' },
        preparing: { label: 'Em Preparo', color: '#856404', bg: '#fff3cd' },
        out_for_delivery: { label: 'Saiu para Entrega', color: '#0c5460', bg: '#d1ecf1' },
        delivered: { label: 'Entregue', color: '#155724', bg: '#d4edda' },
        cancelled: { label: 'Cancelado', color: '#721c24', bg: '#f8d7da' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span
            style={{
                display: 'inline-block',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: config.color,
                background: config.bg,
            }}
        >
            {config.label}
        </span>
    );
}
