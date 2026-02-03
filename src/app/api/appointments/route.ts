
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        // Basic validation
        if (!body.serviceId || !body.partnerId || !body.date || !body.time) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const appointment = await Appointment.create({
            userId: session.user.id,
            partnerId: body.partnerId,
            serviceId: body.serviceId,
            petId: body.petId, // Optional
            date: new Date(body.date),
            time: body.time,
            notes: body.notes,
            status: 'pending'
        });

        return NextResponse.json(appointment, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // If partner, show their schedule. If customer, show their appointments.
        const query = session.user.role === 'partner'
            ? { partnerId: session.user.id }
            : { userId: session.user.id };

        const appointments = await Appointment.find(query)
            .sort({ date: -1 })
            .populate('serviceId', 'name duration prices category')
            .populate('petId', 'name species breed age weight gender size temperament medicalNotes isVaccinated photo')
            .populate('userId', 'name email phone') // For partners to see who booked
            .populate('partnerId', 'name address'); // For users to see where

        return NextResponse.json(appointments);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
