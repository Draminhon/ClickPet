import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';
import User from '@/models/User';
import Order from '@/models/Order';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { sanitizeObject } from '@/lib/sanitize';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        // Check if user already reviewed this product/partner
        const existingReview = await Review.findOne({
            userId: session.user.id,
            ...(body.productId && { productId: body.productId }),
            ...(body.partnerId && { partnerId: body.partnerId }),
        });

        if (existingReview) {
            return NextResponse.json({ message: 'Você já avaliou este item' }, { status: 400 });
        }

        // SECURITY: Verify that the user actually purchased the item/from the partner
        let verifiedOrder = null;
        if (body.productId) {
            verifiedOrder = await Order.findOne({
                userId: session.user.id,
                status: 'delivered',
                'items.productId': body.productId
            });
        } else if (body.partnerId) {
            verifiedOrder = await Order.findOne({
                userId: session.user.id,
                status: 'delivered',
                partnerId: body.partnerId
            });
        }

        if (!verifiedOrder) {
            return NextResponse.json({ 
                message: 'Você só pode avaliar produtos ou lojas após receber um pedido finalizado.' 
            }, { status: 403 });
        }

        const sanitizedBody = sanitizeObject(body);
        
        // SECURITY: Force verify status and associate with the real order
        const review = await Review.create({
            comment: sanitizedBody.comment,
            rating: Math.min(5, Math.max(1, Number(sanitizedBody.rating) || 5)),
            productId: body.productId,
            partnerId: body.partnerId,
            orderId: verifiedOrder._id,
            verified: true,
            userId: session.user.id,
            photos: Array.isArray(sanitizedBody.photos) ? sanitizedBody.photos : [],
        });

        // Recalculate and persist rating on Product
        if (body.productId) {
            const productReviews = await Review.find({ productId: body.productId });
            const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
            await Product.findByIdAndUpdate(body.productId, {
                rating: Math.round(avg * 10) / 10,
                reviewCount: productReviews.length,
            });
        }

        // Recalculate and persist rating on Partner (User)
        if (body.partnerId) {
            const partnerReviews = await Review.find({ partnerId: body.partnerId });
            const avg = partnerReviews.reduce((sum, r) => sum + r.rating, 0) / partnerReviews.length;
            await User.findByIdAndUpdate(body.partnerId, {
                rating: Math.round(avg * 10) / 10,
                reviewCount: partnerReviews.length,
            });
        }

        return NextResponse.json(review, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const partnerId = searchParams.get('partnerId');

        const query: any = {};
        if (productId) query.productId = productId;
        if (partnerId) query.partnerId = partnerId;

        const reviews = await Review.find(query)
            .populate('userId', 'name image')
            .sort({ createdAt: -1 });

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return NextResponse.json({
            reviews,
            avgRating: Math.round(avgRating * 10) / 10,
            totalReviews: reviews.length,
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
