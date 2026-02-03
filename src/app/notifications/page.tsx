"use client";

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = () => {
        fetch(`/api/notifications?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
                setLoading(false);
            });
    };

    const handleMarkAsRead = async (notificationId: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch(`/api/notifications?id=${notificationId}`, {
                method: 'PUT',
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            fetchNotifications(); // Revert/Sync on error
        }
    };

    const handleMarkAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await fetch('/api/notifications', {
                method: 'PUT',
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
            fetchNotifications(); // Revert/Sync on error
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            handleMarkAsRead(notification._id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            order: '#6CC551',
            message: '#007bff',
            appointment: '#FFC107',
            system: '#6c757d',
        };
        return colors[type] || '#6c757d';
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            order: '📦',
            message: '💬',
            appointment: '📅',
            system: '🔔',
        };
        return icons[type] || '🔔';
    };

    if (loading) {
        return <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={28} />
                    <h1 className="section-title" style={{ margin: 0 }}>Notificações</h1>
                    {unreadCount > 0 && (
                        <span style={{
                            background: '#dc3545',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        style={{
                            padding: '0.6rem 1rem',
                            background: '#6CC551',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <CheckCheck size={18} />
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Bell size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666' }}>Você não tem notificações</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {notifications.map(notification => (
                        <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            style={{
                                background: notification.read ? 'white' : '#f0f8ff',
                                padding: '1rem',
                                borderRadius: '8px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                cursor: notification.link ? 'pointer' : 'default',
                                borderLeft: `4px solid ${getTypeColor(notification.type)}`,
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'start',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                if (notification.link) {
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(notification.type)}</span>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.3rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                                        {notification.title}
                                    </h3>
                                    {!notification.read && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification._id);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#6CC551',
                                            }}
                                        >
                                            <Check size={20} />
                                        </button>
                                    )}
                                </div>

                                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    {notification.message}
                                </p>

                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#999' }}>
                                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
