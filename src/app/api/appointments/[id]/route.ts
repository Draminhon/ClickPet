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

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return NextResponse.json({ message: 'Appointment not found' }, { status: 404 });
        }

        // Authorization: Partner of the appointment or the Client who booked it
        const isAuthorized =
            appointment.partnerId.toString() === session.user.id ||
            appointment.userId.toString() === session.user.id;

        if (!isAuthorized) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const updateData: any = { status: body.status };
        if (body.status === 'confirmed') updateData.confirmedAt = new Date();
        if (body.status === 'completed') updateData.completedAt = new Date();
        if (body.status === 'cancelled') {
            updateData.cancelledAt = new Date();
            updateData.cancelReason = body.cancelReason;
        }

        const updated = await Appointment.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
