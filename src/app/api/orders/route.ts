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

        // Prevent mass assignment and force correct ownership/initial status
        const allowedItems = (body.items || []).map((item: any) => ({
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            shopName: item.shopName
        }));

        const orderData: any = {
            userId: session.user.id,
            items: allowedItems,
            total: body.total,
            deliveryFee: body.deliveryFee || 0,
            distance: body.distance,
            isPickup: !!body.isPickup,
            status: 'pending', // Always start as pending
            address: body.address ? {
                street: body.address.street,
                number: body.address.number,
                complement: body.address.complement,
                city: body.address.city,
                zip: body.address.zip,
                coordinates: body.address.coordinates
            } : undefined,
            coupon: body.coupon,
            pointsRedeemed: body.pointsRedeemed || 0,
            paymentMethod: body.paymentMethod || 'cartao',
            paymentStatus: body.paymentStatus || 'approved'
        };

        // Get partnerId from first product securely
        let partnerId = body.partnerId;
        if (!partnerId && allowedItems.length > 0) {
            const product = await Product.findById(allowedItems[0].productId);
            partnerId = product?.partnerId;
        }

        if (!partnerId && allowedItems.length > 0 && allowedItems[0].shopName) {
            const partner = await User.findOne({ name: allowedItems[0].shopName, role: 'partner' });
            if (partner) partnerId = partner._id;
        }

        const order = await Order.create({
            ...orderData,
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
        return NextResponse.json({ message: 'Error creating order' }, { status: 500 });
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
