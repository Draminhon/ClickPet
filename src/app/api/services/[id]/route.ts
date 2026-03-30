import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/models/Service';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await dbConnect();

        const service = await Service.findById(id).populate('partnerId', 'name address');

        if (!service) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json(service);
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
        const body = await req.json();

        // SECURITY: Whitelist allowed fields to prevent mass assignment
        const allowedFields = ['name', 'description', 'category', 'species', 'prices', 'duration', 'image', 'isActive', 'availability'];
        const updateData: any = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const service = await Service.findOneAndUpdate(
            { _id: id, partnerId: session.user.id },
            updateData,
            { new: true }
        );

        if (!service) {
            return NextResponse.json({ message: 'Service not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json(service);
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
        const service = await Service.findOneAndDelete({
            _id: id,
            partnerId: session.user.id
        });

        if (!service) {
            return NextResponse.json({ message: 'Service not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Service deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
