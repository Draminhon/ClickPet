import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Check subscription limits
        const { canAddProduct } = await import('@/lib/subscriptionCheck');
        const canAdd = await canAddProduct(session.user.id);

        if (!canAdd.allowed) {
            return NextResponse.json({
                message: canAdd.message,
                current: canAdd.current,
                limit: canAdd.limit
            }, { status: 403 });
        }

        const body = await req.json();

        const product = await Product.create({
            ...body,
            partnerId: session.user.id,
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const partnerId = searchParams.get('partnerId');
        const search = searchParams.get('search');

        let query: any = {};
        if (category) query.category = category;
        if (partnerId) query.partnerId = partnerId;
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const products = await Product.find(query).populate('partnerId', 'name');
        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
