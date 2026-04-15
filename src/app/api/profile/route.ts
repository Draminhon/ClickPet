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
        if (body.name !== undefined) {
            user.name = body.name;
            updateData.name = body.name;
        }
        if (body.address) {
            user.address = { ...user.address, ...body.address };
            updateData.address = body.address;
        }
        if (body.deliveryAddresses !== undefined) {
            user.deliveryAddresses = body.deliveryAddresses;
            updateData.deliveryAddresses = body.deliveryAddresses;
        }
        if (body.phone !== undefined) {
            user.phone = body.phone;
            updateData.phone = body.phone;
        }
        if (body.cnpj !== undefined) {
            user.cnpj = body.cnpj;
            updateData.cnpj = body.cnpj;
        }
        if (body.cpf !== undefined) {
            user.cpf = body.cpf;
            updateData.cpf = body.cpf;
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
        if (body.bannerImage !== undefined) {
            user.bannerImage = body.bannerImage;
            updateData.bannerImage = body.bannerImage;
        }
        if (body.workingHours !== undefined) {
            user.workingHours = body.workingHours;
            updateData.workingHours = body.workingHours;
        }
        if (body.paymentConfig !== undefined) {
            user.paymentConfig = body.paymentConfig;
            updateData.paymentConfig = body.paymentConfig;
        }
        if (body.paymentMethodsTable !== undefined) {
            user.paymentMethods = body.paymentMethodsTable.map((m: any) => ({
                method: m.method,
                fee: typeof m.fee === 'string' ? parseFloat(m.fee.replace(',', '.')) : m.fee,
                term: m.term
            }));
            updateData.paymentMethods = user.paymentMethods;
        }
        if (body.pixConfig !== undefined) {
            user.pixConfig = body.pixConfig;
            updateData.pixConfig = body.pixConfig;
        }
        if (body.specialization !== undefined) {
            user.specialization = body.specialization;
            updateData.specialization = body.specialization;
        }
        if (body.bio !== undefined) {
            user.bio = body.bio;
            updateData.bio = body.bio;
        }
        if (body.whatsapp !== undefined) {
            user.whatsapp = body.whatsapp;
            updateData.whatsapp = body.whatsapp;
        }
        if (body.crmv !== undefined) {
            user.crmv = body.crmv;
            updateData.crmv = body.crmv;
        }

        await user.save();

        // Fetch again to ensure clean returning object (striping password)
        const updatedUser = await User.findById(session.user.id).select('-password');

        const updatedFields = Object.keys(updateData);
        await logAction(req, 'profile_update', { updatedFields });


        return NextResponse.json(updatedUser);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
