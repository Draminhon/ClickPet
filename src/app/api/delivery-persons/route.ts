import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DeliveryPerson from '@/models/DeliveryPerson';
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
        console.log('[DELIVERY] Creating with body:', body);

        const deliveryPerson = await DeliveryPerson.create({
            ...body,
            partnerId: session.user.id,
        });

        return NextResponse.json(deliveryPerson, { status: 201 });
    } catch (error: any) {
        console.error('[DELIVERY] POST Error:', error);
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
        const deliveryPersons = await DeliveryPerson.find({ partnerId: session.user.id }).sort({ createdAt: -1 });
        console.log('[DELIVERY] Fetched count:', deliveryPersons.length);
        if (deliveryPersons.length > 0) {
            console.log('[DELIVERY] First item cnhCategory:', deliveryPersons[0].cnhCategory);
        }

        return NextResponse.json(deliveryPersons);
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
        const id = searchParams.get('id');

        await dbConnect();
        await DeliveryPerson.findOneAndDelete({ _id: id, partnerId: session.user.id });

        return NextResponse.json({ message: 'Delivery person deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ message: 'Missing ID' }, { status: 400 });
        }

        await dbConnect();
        const body = await req.json();
        console.log('[DELIVERY] Updating ID:', id, 'with body:', body);

        const deliveryPerson = await DeliveryPerson.findOneAndUpdate(
            { _id: id, partnerId: session.user.id },
            { $set: body },
            { new: true }
        );

        if (!deliveryPerson) {
            return NextResponse.json({ message: 'Delivery person not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json(deliveryPerson);
    } catch (error: any) {
        console.error('[DELIVERY] PUT Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
