
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Service from '@/models/Service';
import Pet from '@/models/Pet';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { writeRateLimiter } from '@/lib/rateLimit';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        if (!writeRateLimiter.check(session.user.id).success) {
            return NextResponse.json({ message: 'Muitas tentativas. Aguarde um instante.' }, { status: 429 });
        }

        await dbConnect();
        const body = await req.json();

        // Basic validation
        if (!body.serviceId || !body.partnerId || !body.date || !body.time) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // SECURITY: sem isso, um cliente podia informar um serviceId que não
        // pertence ao partnerId (agendando com o preço/duração de outro
        // parceiro), ou um petId de outro usuário — vazando os dados do pet
        // (nome, raça, foto) para o parceiro que vê o agendamento.
        const service = await Service.findOne({ _id: body.serviceId, partnerId: body.partnerId });
        if (!service) {
            return NextResponse.json({ message: 'Serviço não encontrado para este parceiro.' }, { status: 400 });
        }

        if (body.petId) {
            const pet = await Pet.findOne({ _id: body.petId, ownerId: session.user.id });
            if (!pet) {
                return NextResponse.json({ message: 'Pet não encontrado.' }, { status: 400 });
            }
        }

        // Evita dois agendamentos no mesmo horário para o mesmo parceiro —
        // antes disso só era descoberto depois de tentar confirmar, sem aviso.
        const requestedDate = new Date(body.date + 'T12:00:00');
        const conflict = await Appointment.findOne({
            partnerId: body.partnerId,
            date: requestedDate,
            time: body.time,
            status: { $in: ['pending', 'confirmed'] },
        });
        if (conflict) {
            return NextResponse.json({ message: 'Esse horário acabou de ser reservado. Escolha outro.' }, { status: 409 });
        }

        const appointment = await Appointment.create({
            userId: session.user.id,
            partnerId: body.partnerId,
            serviceId: body.serviceId,
            petId: body.petId, // Optional
            date: requestedDate,
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

        // If partner/veterinarian, show their schedule. If customer, show their appointments.
        const query = ['partner', 'veterinarian'].includes(session.user.role)
            ? { partnerId: session.user.id }
            : { userId: session.user.id };

        const appointments = await Appointment.find(query)
            .sort({ date: -1 })
            .populate('serviceId', 'name duration prices category image')
            .populate('petId', 'name species breed age weight photo')
            .populate('userId', '-password') // For partners to see who booked
            .populate('partnerId', '-password'); // For users to see where

        appointments.forEach((appt: any) => {
            if (appt.userId && typeof appt.userId.decryptFieldsSync === 'function') {
                appt.userId.decryptFieldsSync();
            }
            if (appt.partnerId && typeof appt.partnerId.decryptFieldsSync === 'function') {
                appt.partnerId.decryptFieldsSync();
            }
        });

        return NextResponse.json(appointments);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
