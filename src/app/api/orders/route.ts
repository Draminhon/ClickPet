import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
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
        const rawItems = (body.items || []).map((item: any) => ({
            productId: item.productId,
            quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
            shopName: item.shopName
        }));

        if (rawItems.length === 0) {
            return NextResponse.json({ message: 'Pedido deve ter pelo menos um item' }, { status: 400 });
        }

        // SECURITY: Recalculate prices from database — never trust client-sent prices
        const productIds = rawItems.map((item: any) => item.productId).filter(Boolean);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

        const verifiedItems = rawItems.map((item: any) => {
            const dbProduct = productMap.get(item.productId);
            if (!dbProduct) {
                throw new Error(`Produto não encontrado: ${item.productId}`);
            }
            return {
                productId: item.productId,
                title: dbProduct.title,
                price: dbProduct.price,
                quantity: item.quantity,
                shopName: item.shopName || dbProduct.partnerId?.name || '',
            };
        });

        // Calculate total from verified prices
        const subtotal = verifiedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const deliveryFee = Number(body.deliveryFee) || 0;
        const discount = Number(body.discount) || 0;
        const calculatedTotal = subtotal - discount + deliveryFee;

        const orderData: any = {
            userId: session.user.id,
            items: verifiedItems,
            total: calculatedTotal,
            deliveryFee,
            distance: body.distance,
            isPickup: !!body.isPickup,
            status: 'pending',
            address: body.address ? {
                street: body.address.street,
                number: body.address.number,
                complement: body.address.complement,
                city: body.address.city,
                zip: body.address.zip,
                coordinates: body.address.coordinates
            } : undefined,
            coupon: body.coupon,
            discount,
            pointsRedeemed: body.pointsRedeemed || 0,
            paymentMethod: body.paymentMethod || 'cartao',
            // SECURITY: Never trust client paymentStatus — always start as pending
            paymentStatus: 'pending',
        };

        // Get partnerId from first product securely
        let partnerId = body.partnerId;
        if (!partnerId && verifiedItems.length > 0) {
            const product = productMap.get(verifiedItems[0].productId);
            partnerId = product?.partnerId;
        }

        if (!partnerId && verifiedItems.length > 0 && verifiedItems[0].shopName) {
            const partner = await User.findOne({ name: verifiedItems[0].shopName, role: 'partner' });
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

        // Increment coupon usage if present
        if (body.coupon) {
            await Coupon.findOneAndUpdate(
                { code: body.coupon.toUpperCase() },
                { $inc: { usedCount: 1 } },
                { new: true }
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
