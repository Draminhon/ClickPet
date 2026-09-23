import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Appointment from '@/models/Appointment';
import Service from '@/models/Service';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Lista usada quando o serviço não tem `availability` configurada — mesmos
// horários que o app mostrava fixos antes desta rota existir, pra não mudar
// o comportamento visual de parceiros que ainda não configuraram os
// próprios horários.
const DEFAULT_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

function timeToMinutes(time: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

/**
 * Gera os horários candidatos a partir da janela configurada em
 * `Service.availability` para o dia da semana pedido, andando de
 * `duration` em `duration` minutos (60 min se o serviço não tiver duração).
 */
function slotsFromAvailability(service: any, weekday: string): string[] {
    const window = (service.availability || []).find((a: any) => a.day === weekday);
    if (!window?.startTime || !window?.endTime) return [];

    const start = timeToMinutes(window.startTime);
    const end = timeToMinutes(window.endTime);
    if (start === null || end === null || end <= start) return [];

    const step = service.duration && service.duration > 0 ? service.duration : 60;
    const slots: string[] = [];
    for (let t = start; t + step <= end; t += step) {
        slots.push(minutesToTime(t));
    }
    return slots;
}

/**
 * GET /api/appointments/availability?partnerId=X&serviceId=Y&date=YYYY-MM-DD
 * Horários candidatos para o serviço/dia (da janela configurada, ou uma
 * lista padrão se o parceiro não configurou `availability`) e quais já estão
 * ocupados — o app mostrava uma lista fixa sem checar reserva nenhuma antes.
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const partnerId = searchParams.get('partnerId');
        const serviceId = searchParams.get('serviceId');
        const date = searchParams.get('date');

        if (!partnerId || !serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ message: 'partnerId, serviceId e date (YYYY-MM-DD) são obrigatórios.' }, { status: 400 });
        }

        await dbConnect();

        const service = await Service.findOne({ _id: serviceId, partnerId });
        if (!service) {
            return NextResponse.json({ message: 'Serviço não encontrado para este parceiro.' }, { status: 404 });
        }

        const requestedDate = new Date(date + 'T12:00:00');
        const weekday = WEEKDAYS[requestedDate.getDay()];

        const configuredSlots = slotsFromAvailability(service, weekday);
        const slots = configuredSlots.length > 0 ? configuredSlots : DEFAULT_SLOTS;

        const booked = await Appointment.find({
            partnerId,
            date: requestedDate,
            status: { $in: ['pending', 'confirmed'] },
        }).select('time');

        return NextResponse.json({
            slots,
            bookedTimes: booked.map((a: any) => a.time),
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
