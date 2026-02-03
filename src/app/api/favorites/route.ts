import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Favorite from '@/models/Favorite';
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

        // Check if already favorited
        const existing = await Favorite.findOne({
            userId: session.user.id,
            ...(body.productId && { productId: body.productId }),
            ...(body.partnerId && { partnerId: body.partnerId }),
        });

        if (existing) {
            return NextResponse.json({ message: 'Já está nos favoritos' }, { status: 400 });
        }

        const favorite = await Favorite.create({
            userId: session.user.id,
            productId: body.productId,
            partnerId: body.partnerId,
        });

        return NextResponse.json(favorite, { status: 201 });
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

        const favorites = await Favorite.find({ userId: session.user.id })
            .populate('productId')
            .populate('partnerId')
            .sort({ createdAt: -1 });

        return NextResponse.json(favorites);
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

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const partnerId = searchParams.get('partnerId');

        const query: any = { userId: session.user.id };
        if (productId) query.productId = productId;
        if (partnerId) query.partnerId = partnerId;

        await Favorite.findOneAndDelete(query);

        return NextResponse.json({ message: 'Removido dos favoritos' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
