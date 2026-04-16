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

        // SECURITY: Role-based status transitions
        // Customers can ONLY cancel. Partners can confirm, complete, cancel, or mark as no_show.
        const targetStatus = body.status;
        const userRole = session.user.role;

        if (userRole === 'customer') {
            if (targetStatus !== 'cancelled') {
                return NextResponse.json({ 
                    message: 'Clientes só podem cancelar agendamentos. Confirmações e finalizações são exclusivas do parceiro.' 
                }, { status: 403 });
            }
        } else if (userRole === 'partner') {
            const allowedPartnerStatuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
            if (!allowedPartnerStatuses.includes(targetStatus)) {
                return NextResponse.json({ message: 'Status inválido para o parceiro' }, { status: 400 });
            }
        }

        const updateData: any = { status: targetStatus };
        if (targetStatus === 'confirmed') updateData.confirmedAt = new Date();
        if (targetStatus === 'completed') updateData.completedAt = new Date();
        if (targetStatus === 'cancelled') {
            updateData.cancelledAt = new Date();
            updateData.cancelReason = body.cancelReason || 'Cancelado pelo usuário';
        }

        const updated = await Appointment.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
