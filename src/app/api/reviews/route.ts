import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
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

        // Check if user already reviewed this product/partner
        const existingReview = await Review.findOne({
            userId: session.user.id,
            ...(body.productId && { productId: body.productId }),
            ...(body.partnerId && { partnerId: body.partnerId }),
        });

        if (existingReview) {
            return NextResponse.json({ message: 'Você já avaliou este item' }, { status: 400 });
        }

        const review = await Review.create({
            ...body,
            userId: session.user.id,
        });

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
            .populate('userId', 'name')
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
