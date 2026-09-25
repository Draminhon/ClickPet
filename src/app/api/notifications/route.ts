import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const notifications = await Notification.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: session.user.id,
            read: false,
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

/**
 * Nenhum cliente (mobile ou web) chama esta rota — notificações do app são
 * criadas internamente via `src/lib/notification-service.ts`, importado
 * direto pelo código do servidor. Esta rota HTTP pública não tinha
 * verificação de sessão nenhuma e aceitava o corpo inteiro sem whitelist:
 * qualquer requisição anônima podia criar uma notificação em nome de
 * qualquer `userId` (phishing in-app). Restrita a admin como defesa em
 * profundidade, já que não há caso de uso legítimo de cliente para isto.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const notification = await Notification.create({
            userId: body.userId,
            type: body.type,
            title: body.title,
            message: body.message,
            link: body.link,
            actionData: body.actionData,
        });

        return NextResponse.json(notification, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const notificationId = searchParams.get('id');

        await dbConnect();

        if (notificationId) {
            // Escopado ao dono: sem o filtro por userId, qualquer usuário logado
            // podia marcar como lida a notificação de outro só adivinhando o ID.
            await Notification.findOneAndUpdate(
                { _id: notificationId, userId: session.user.id },
                { read: true }
            );
        } else {
            // Mark all as read
            await Notification.updateMany(
                { userId: session.user.id, read: false },
                { read: true }
            );
        }

        return NextResponse.json({ message: 'Notifications marked as read' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const notificationId = searchParams.get('id');

        await dbConnect();

        if (notificationId) {
            // Delete specific notification
            await Notification.deleteOne({ _id: notificationId, userId: session.user.id });
        } else {
            // Delete all notifications
            await Notification.deleteMany({ userId: session.user.id });
        }

        return NextResponse.json({ message: 'Notifications deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
