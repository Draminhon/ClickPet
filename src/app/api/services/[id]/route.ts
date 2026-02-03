
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/models/Service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await dbConnect();

        const service = await Service.findById(id).populate('partnerId', 'name address'); // Populate partner info including address if possible

        if (!service) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json(service);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
