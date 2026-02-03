import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();
        const body = await req.json();

        const updateData: any = { status: body.status };

        // Update timestamps based on status
        if (body.status === 'confirmed') {
            updateData.confirmedAt = new Date();
        } else if (body.status === 'completed') {
            updateData.completedAt = new Date();
        } else if (body.status === 'cancelled') {
            updateData.cancelledAt = new Date();
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('serviceId').populate('petId').populate('userId', 'name email');

        if (!appointment) {
            return NextResponse.json({ message: 'Appointment not found' }, { status: 404 });
        }

        return NextResponse.json(appointment);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        await Appointment.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Appointment cancelled' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
