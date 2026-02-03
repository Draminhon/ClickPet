import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(session.user.id).select('-password');

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const updateData: any = {};
        if (body.address) updateData.address = body.address;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.minimumOrderValue !== undefined) updateData.minimumOrderValue = body.minimumOrderValue;
        if (body.deliveryRadius !== undefined) updateData.deliveryRadius = body.deliveryRadius;
        if (body.deliveryFeePerKm !== undefined) updateData.deliveryFeePerKm = body.deliveryFeePerKm;
        if (body.freeDeliveryMinimum !== undefined) updateData.freeDeliveryMinimum = body.freeDeliveryMinimum;

        const user = await User.findByIdAndUpdate(
            session.user.id,
            updateData,
            { new: true }
        ).select('-password');

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
