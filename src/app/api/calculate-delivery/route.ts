import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { calculateDistance, calculateDeliveryFee } from '@/lib/distance';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { partnerId, customerLat, customerLng, orderTotal } = body;

        if (!partnerId || !customerLat || !customerLng) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Get partner details
        const partner = await User.findById(partnerId);

        if (!partner || partner.role !== 'partner') {
            return NextResponse.json(
                { message: 'Partner not found' },
                { status: 404 }
            );
        }

        // Check if partner has coordinates
        const partnerCoords = partner.address?.coordinates?.coordinates;
        if (!partnerCoords || partnerCoords.length !== 2) {
            return NextResponse.json({
                deliveryFee: 0,
                distance: 0,
                message: 'Partner location not configured',
            });
        }

        const [partnerLng, partnerLat] = partnerCoords;

        // Calculate distance
        const distance = calculateDistance(
            partnerLat,
            partnerLng,
            customerLat,
            customerLng
        );

        // Check if within delivery radius
        if (distance > partner.deliveryRadius) {
            return NextResponse.json({
                deliveryFee: null,
                distance,
                message: `Fora do raio de entrega (${partner.deliveryRadius}km)`,
                outOfRange: true,
            });
        }

        // Calculate delivery fee
        const deliveryFee = calculateDeliveryFee(
            distance,
            partner.deliveryFeePerKm || 2,
            orderTotal || 0,
            partner.freeDeliveryMinimum || 0
        );

        return NextResponse.json({
            deliveryFee,
            distance,
            isFreeDelivery: deliveryFee === 0 && orderTotal >= partner.freeDeliveryMinimum,
            partnerName: partner.name,
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
