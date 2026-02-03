import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import notificationService from '@/lib/notification-service';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();
        // console.log('[Order Create] Received body:', JSON.stringify(body, null, 2));

        // Get partnerId from first product
        let partnerId = body.partnerId;
        if (!partnerId && body.items && body.items.length > 0) {
            const product = await Product.findById(body.items[0].productId);
            partnerId = product?.partnerId;
        }

        // If still no partnerId, try to find by shopName (common in this codebase)
        if (!partnerId && body.items && body.items.length > 0 && body.items[0].shopName) {
            const partner = await User.findOne({ name: body.items[0].shopName, role: 'partner' });
            if (partner) partnerId = partner._id;
        }

        const order = await Order.create({
            ...body,
            userId: session.user.id,
            partnerId,
        });

        // Notify partner about new order
        if (partnerId) {
            await notificationService.notifyPartnerNewOrder(
                partnerId,
                order._id.toString(),
                order.total
            );
        }

        return NextResponse.json(order, { status: 201 });
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

        await dbConnect();

        const query = session.user.role === 'partner'
            ? { partnerId: session.user.id }
            : { userId: session.user.id };

        const orders = await Order.find(query)
            .populate('deliveryPersonId')
            .sort({ createdAt: -1 });

        return NextResponse.json(orders);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
