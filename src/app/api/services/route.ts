import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/models/Service';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { sanitizeObject } from '@/lib/sanitize';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Check subscription limits
        const { canAddService } = await import('@/lib/subscriptionCheck');
        const canAdd = await canAddService(session.user.id);

        if (!canAdd.allowed) {
            return NextResponse.json({
                message: canAdd.message,
                current: canAdd.current,
                limit: canAdd.limit
            }, { status: 403 });
        }

        const rawBody = await req.json();
        const body = sanitizeObject(rawBody);

        // SECURITY: Whitelist allowed fields to prevent mass assignment
        const allowedFields = ['name', 'description', 'category', 'species', 'prices', 'duration', 'image', 'isActive', 'availability'];
        const serviceData: any = { 
            partnerId: session.user.id,
            // Defaults
            isActive: true 
        };

        allowedFields.forEach(field => {
            if (body[field] !== undefined) serviceData[field] = body[field];
        });

        // Basic validation
        if (!serviceData.name || serviceData.name.trim().length < 2) {
            return NextResponse.json({ message: 'Nome do serviço é obrigatório' }, { status: 400 });
        }

        const service = await Service.create(serviceData);

        return NextResponse.json(service, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const partnerId = searchParams.get('partnerId');

        let query: any = {};
        if (category) query.category = category;
        if (partnerId) query.partnerId = partnerId;

        // For public listing, only show active services
        if (!partnerId) {
            query.isActive = true;
        }

        const services = await Service.find(query).populate('partnerId', 'name');
        return NextResponse.json(services);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
