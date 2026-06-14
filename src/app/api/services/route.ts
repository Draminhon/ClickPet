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
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');

        let query: any = {};
        if (category) query.category = category;
        
        if (partnerId) {
            query.partnerId = partnerId;
        } else {
            query.isActive = true;
            if (!isNaN(lat) && !isNaN(lng)) {
                // Find all active partners within 15km
                const User = (await import('@/models/User')).default;
                const realPartners = await User.find({ 
                    status: { $ne: 'suspended' },
                    role: { $in: ['partner', 'veterinarian'] }
                });
                const nearbyRealIds = [];
                const { calculateDistance } = await import('@/lib/distance');
                for (const partner of realPartners) {
                    const coords = partner.address?.coordinates?.coordinates;
                    if (coords && coords.length === 2) {
                        const [partnerLng, partnerLat] = coords;
                        if (!isNaN(partnerLat) && !isNaN(partnerLng)) {
                            const dist = calculateDistance(lat, lng, partnerLat, partnerLng);
                            if (dist <= 15) { // 15km radius
                                nearbyRealIds.push(partner._id);
                            }
                        }
                    }
                }
                query.partnerId = { $in: nearbyRealIds };
            }
        }

        const services = await Service.find(query).populate('partnerId', '-password');
        
        services.forEach((s: any) => {
            if (s.partnerId && typeof s.partnerId.decryptFieldsSync === 'function') {
                s.partnerId.decryptFieldsSync();
            }
        });

        return NextResponse.json(services);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
