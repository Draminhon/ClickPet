import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        href: string;
    };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}>
            {icon && <div style={{ marginBottom: '1rem' }}>{icon}</div>}

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#333' }}>
                {title}
            </h3>

            {description && (
                <p style={{ color: '#666', marginBottom: action ? '1.5rem' : 0 }}>
                    {description}
                </p>
            )}

            {action && (
                <a href={action.href} className="btn btn-primary">
                    {action.label}
                </a>
            )}
        </div>
    );
}
