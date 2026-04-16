import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Order from '@/models/Order';
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
        const { orderId, receiverId, content } = body;
        
        if (!content || !receiverId) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const message = await Message.create({
            content,
            receiverId,
            orderId,
            senderId: session.user.id,
            read: false, // Ensure new messages start as unread
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

        let query: any = {
            $or: [
                { senderId: session.user.id },
                { receiverId: session.user.id },
            ],
        };

        if (orderId) {
            // SECURITY: If orderId is provided, verify ownership of the order first
            const order = await Order.findById(orderId);
            if (!order) {
                return NextResponse.json({ message: 'Order not found' }, { status: 404 });
            }

            const isParticipant = 
                order.userId.toString() === session.user.id || 
                order.partnerId.toString() === session.user.id;

            if (!isParticipant) {
                return NextResponse.json({ message: 'Forbidden: You are not a participant in this order' }, { status: 403 });
            }

            query = { orderId };
        }

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
