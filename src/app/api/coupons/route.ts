import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Coupon from '@/models/Coupon';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const coupon = await Coupon.create({
            ...body,
            partnerId: session.user.id,
            code: body.code.toUpperCase(),
        });

        return NextResponse.json(coupon, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Código de cupom já existe' }, { status: 400 });
        }
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const coupons = await Coupon.find({ partnerId: session.user.id }).sort({ createdAt: -1 });

        return NextResponse.json(coupons);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const couponId = searchParams.get('id');

        await dbConnect();
        await Coupon.findOneAndDelete({ _id: couponId, partnerId: session.user.id });

        return NextResponse.json({ message: 'Coupon deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
