import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import notificationService from '@/lib/notification-service';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();
        const body = await req.json();

        // Retrieve order first to check permissions and status
        const existingOrder = await Order.findById(id);
        if (!existingOrder) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // Authorization check
        let isAuthorized = false;

        console.log(`[Order Update] User: ${session.user.id}, Role: ${session.user.role}, Order: ${id}, Order Owner: ${existingOrder.userId}, Status: ${body.status}, Order Status: ${existingOrder.status}`);

        // Partner check: must be the partner of the order
        if (session.user.role === 'partner') {
            if (existingOrder.partnerId.toString() === session.user.id) {
                isAuthorized = true;
            }
        }
        // Client/User check: must be the owner, cancelling, and order must be pending
        // We relax the role check to allow 'user' or 'client' as long as they are NOT 'partner' and own the order
        else {
            if (existingOrder.userId.toString() === session.user.id &&
                body.status === 'cancelled' &&
                existingOrder.status === 'pending'
            ) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            console.log('[Order Update] Unauthorized access attempt');
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const updateData: any = { status: body.status };

        // Update timestamps based on status
        if (body.status === 'accepted') {
            updateData.acceptedAt = new Date();
        } else if (body.status === 'delivered') {
            updateData.deliveredAt = new Date();
        } else if (body.status === 'cancelled') {
            updateData.cancelledAt = new Date();
            updateData.cancelReason = body.cancelReason;
        }

        // Update delivery person if provided
        if (body.deliveryPersonId) {
            updateData.deliveryPersonId = body.deliveryPersonId;
        }

        const order = await Order.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('deliveryPersonId');

        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // Send notification about order status change
        if (order.userId) {
            // Notify customer
            await notificationService.notifyOrderStatus(
                order.userId,
                id,
                body.status
            );
        }

        // If customer cancelled, notify partner
        if (body.status === 'cancelled' && session.user.role === 'customer' && order.partnerId) {
            await notificationService.notifyPartnerOrderCancelled(
                order.partnerId,
                id
            );
        }

        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const order = await Order.findById(id).populate('deliveryPersonId');

        if (!order) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }

        // Check if user has access to this order
        const hasAccess =
            order.userId.toString() === session.user.id ||
            order.partnerId?.toString() === session.user.id;

        if (!hasAccess) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
