import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sanitizeObject } from '@/lib/sanitize';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await dbConnect();
        const product = await Product.findById(id).populate('partnerId', 'name');

        if (!product) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();
        const rawBody = await req.json();
        const body = sanitizeObject(rawBody);

        // SECURITY: Whitelist allowed fields to prevent mass assignment
        const allowedFields = ['title', 'description', 'price', 'category', 'image', 'images',
            'discount', 'productType', 'subCategory', 'weights', 'stock', 'isActive', 'brand', 'sku', 'unit'];
        const updateData: any = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = typeof body[field] === 'string'
                    ? body[field] // Mongoose schema will validate
                    : body[field];
            }
        }

        const product = await Product.findOneAndUpdate(
            { _id: id, partnerId: session.user.id },
            updateData,
            { new: true }
        );

        if (!product) {
            return NextResponse.json({ message: 'Product not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();
        const product = await Product.findOneAndDelete({
            _id: id,
            partnerId: session.user.id
        });

        if (!product) {
            return NextResponse.json({ message: 'Product not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
