import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const message = await Message.create({
            ...body,
            senderId: session.user.id,
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        await dbConnect();

        const query = orderId
            ? { orderId }
            : {
                $or: [
                    { senderId: session.user.id },
                    { receiverId: session.user.id },
                ],
            };

        const messages = await Message.find(query)
            .populate('senderId', 'name')
            .populate('receiverId', 'name')
            .sort({ createdAt: 1 });

        return NextResponse.json(messages);
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
        const orderId = searchParams.get('orderId');

        await dbConnect();

        // Mark all messages in this order as read for the current user
        await Message.updateMany(
            {
                orderId,
                receiverId: session.user.id,
                read: false,
            },
            { read: true }
        );

        return NextResponse.json({ message: 'Messages marked as read' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
