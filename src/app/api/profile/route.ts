import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { sanitizeObject } from '@/lib/sanitize';
import { logAction } from '@/lib/audit';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findById(session.user.id).select('-password');

        if (!user) {
            console.error('[PROFILE] User not found in DB for ID:', session.user.id);
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('[PROFILE] Error fetching profile:', error);
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
        const rawBody = await req.json();
        const body = sanitizeObject(rawBody);

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const updateData: any = {};
        if (body.address) {
            user.address = { ...user.address, ...body.address };
            updateData.address = body.address;
        }
        if (body.phone !== undefined) {
            user.phone = body.phone;
            updateData.phone = body.phone;
        }
        if (body.minimumOrderValue !== undefined) {
            user.minimumOrderValue = body.minimumOrderValue;
            updateData.minimumOrderValue = body.minimumOrderValue;
        }
        if (body.deliveryRadius !== undefined) {
            user.deliveryRadius = body.deliveryRadius;
            updateData.deliveryRadius = body.deliveryRadius;
        }
        if (body.deliveryFeePerKm !== undefined) {
            user.deliveryFeePerKm = body.deliveryFeePerKm;
            updateData.deliveryFeePerKm = body.deliveryFeePerKm;
        }
        if (body.freeDeliveryMinimum !== undefined) {
            user.freeDeliveryMinimum = body.freeDeliveryMinimum;
            updateData.freeDeliveryMinimum = body.freeDeliveryMinimum;
        }
        if (body.image !== undefined) {
            user.image = body.image;
            updateData.image = body.image;
        }
        if (body.shopLogo !== undefined) {
            user.shopLogo = body.shopLogo;
            updateData.shopLogo = body.shopLogo;
        }

        await user.save();

        // Fetch again to ensure clean returning object (striping password)
        const updatedUser = await User.findById(session.user.id).select('-password');

        const updatedFields = Object.keys(updateData);
        await logAction(req, 'profile_update', { updatedFields });

        // Debug logging
        if (body.image) {
            console.log(`[DEBUG] Received image length: ${body.image.length}`);
            console.log(`[DEBUG] Saved user image field present: ${!!user?.image}`);
        }

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
