import Notification from '@/models/Notification';
import { Types } from 'mongoose';

export type NotificationType = 'order' | 'message' | 'appointment' | 'system' | 'promotion' | 'delivery';

interface NotificationData {
    userId: string | Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    actionData?: any;
}

class NotificationService {
    /**
     * Create and send a notification to a user
     */
    async createNotification(data: NotificationData) {
        try {
            const notification = await Notification.create({
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                actionData: data.actionData,
                deliveryStatus: 'not_applicable', // Will be 'pending' if push token exists
            });

            // TODO: In production, integrate with a push notification service like Firebase Cloud Messaging
            // For now, we just create the in-app notification

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Send order status notification
     */
    async notifyOrderStatus(userId: string | Types.ObjectId, orderId: string, status: string) {
        const statusMessages: Record<string, { title: string; message: string }> = {
            accepted: {
                title: 'Pedido Aceito! 🎉',
                message: 'Seu pedido foi aceito e está sendo preparado.',
            },
            preparing: {
                title: 'Preparando seu Pedido 👨‍🍳',
                message: 'Estamos preparando seu pedido com carinho.',
            },
            out_for_delivery: {
                title: 'Pedido Saiu para Entrega 🚚',
                message: 'Seu pedido está a caminho! Acompanhe em tempo real.',
            },
            delivered: {
                title: 'Pedido Entregue ✅',
                message: 'Seu pedido foi entregue. Aproveite!',
            },
            cancelled: {
                title: 'Pedido Cancelado ❌',
                message: 'Seu pedido foi cancelado.',
            },
        };

        const statusInfo = statusMessages[status];
        if (!statusInfo) return;

        return this.createNotification({
            userId,
            type: 'order',
            title: statusInfo.title,
            message: statusInfo.message,
            link: `/orders/${orderId}`,
            actionData: { orderId, status },
        });
    }

    /**
     * Send appointment reminder (24 hours before)
     */
    async notifyAppointmentReminder(userId: string | Types.ObjectId, appointmentId: string, serviceName: string, date: Date, time: string) {
        return this.createNotification({
            userId,
            type: 'appointment',
            title: 'Lembrete de Agendamento 📅',
            message: `Você tem um agendamento de ${serviceName} amanhã às ${time}.`,
            link: `/appointments/${appointmentId}`,
            actionData: { appointmentId, date, time },
        });
    }

    /**
     * Send promotion notification
     */
    async notifyPromotion(userId: string | Types.ObjectId, title: string, message: string, link?: string) {
        return this.createNotification({
            userId,
            type: 'promotion',
            title,
            message,
            link,
        });
    }

    /**
     * Send new message notification
     */
    async notifyNewMessage(userId: string | Types.ObjectId, senderName: string, orderId: string) {
        return this.createNotification({
            userId,
            type: 'message',
            title: 'Nova Mensagem 💬',
            message: `${senderName} enviou uma mensagem.`,
            link: `/chat?orderId=${orderId}`,
            actionData: { orderId },
        });
    }

    /**
     * Notify partner about a new order
     */
    async notifyPartnerNewOrder(partnerId: string | Types.ObjectId, orderId: string, total: number) {
        return this.createNotification({
            userId: partnerId,
            type: 'order',
            title: 'Novo Pedido Recebido! 🛍️',
            message: `Você recebeu um novo pedido no valor de R$ ${total.toFixed(2)}.`,
            link: `/partner/orders`, // Or specific order link if available
            actionData: { orderId, total },
        });
    }

    /**
     * Notify partner about an order being cancelled by the customer
     */
    async notifyPartnerOrderCancelled(partnerId: string | Types.ObjectId, orderId: string) {
        return this.createNotification({
            userId: partnerId,
            type: 'order',
            title: 'Pedido Cancelado pelo Cliente ⚠️',
            message: `O pedido #${orderId.slice(-6)} foi cancelado pelo cliente.`,
            link: `/partner/orders`,
            actionData: { orderId },
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string) {
        return Notification.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );
    }

    /**
     * Mark all user notifications as read
     */
    async markAllAsRead(userId: string | Types.ObjectId) {
        return Notification.updateMany(
            { userId, read: false },
            { read: true }
        );
    }

    /**
     * Get user notifications with pagination
     */
    async getUserNotifications(userId: string | Types.ObjectId, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ userId }),
        ]);

        return {
            notifications,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string | Types.ObjectId) {
        return Notification.countDocuments({ userId, read: false });
    }

    /**
     * Delete old notifications (older than 30 days)
     */
    async cleanupOldNotifications() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return Notification.deleteMany({
            createdAt: { $lt: thirtyDaysAgo },
            read: true,
        });
    }
}

export default new NotificationService();
