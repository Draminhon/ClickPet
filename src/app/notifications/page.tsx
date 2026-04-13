"use client";

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

import styles from './Notifications.module.css';

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
        setNotifications(prev => prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch(`/api/notifications?id=${notificationId}`, { method: 'PUT' });
            fetchNotifications();
        } catch (error) {
            fetchNotifications();
        }
    };

    const handleMarkAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await fetch('/api/notifications', { method: 'PUT' });
            fetchNotifications();
        } catch (error) {
            fetchNotifications();
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

    const getTypeIcon = (type: string) => {
        const typeMap: Record<string, string> = {
            order: '📦',
            message: '💬',
            appointment: '📅',
            promotion: '🎉',
            system: '🔔',
        };
        return typeMap[type] || '🔔';
    };

    const getTypeClass = (type: string) => {
        if (['order', 'appointment'].includes(type)) return styles.order;
        if (['message', 'promotion'].includes(type)) return styles.promo;
        return styles.system;
    };

    if (loading) {
        return <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>Carregando...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Bell color="#272727" size={32} strokeWidth={2.5} />
                    <h1 className={styles.pageTitle}>Notificações</h1>
                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                </div>

                {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className={styles.markAllBtn}>
                        <CheckCheck size={20} />
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Bell size={40} strokeWidth={2} />
                    </div>
                    <h2 className={styles.emptyTitle}>Nenhuma notificação</h2>
                    <p className={styles.emptyText}>Você não tem novas notificações no momento. Avisaremos quando houver novidades!</p>
                </div>
            ) : (
                <div className={styles.notificationsList}>
                    {notifications.map(notification => (
                        <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`${styles.notificationCard} ${notification.link ? styles.clickable : ''} ${!notification.read ? styles.unread : ''}`}
                        >
                            {!notification.read && <div className={styles.unreadDot} />}
                            
                            <div className={`${styles.iconWrapper} ${getTypeClass(notification.type)}`}>
                                {getTypeIcon(notification.type)}
                            </div>

                            <div className={styles.contentWrapper}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.title}>{notification.title}</h3>
                                    <span className={styles.time}>
                                        {new Date(notification.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className={styles.message}>{notification.message}</p>
                                
                                {!notification.read && !notification.link && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkAsRead(notification._id);
                                        }}
                                        className={styles.markReadBtn}
                                        title="Marcar como lida"
                                    >
                                        <Check size={18} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
