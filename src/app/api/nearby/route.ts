import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import { calculateDistance, calculateDeliveryFee } from '@/lib/distance';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MOCK_PARTNERS, MOCK_CLINICS } from '@/mock/partners';

export async function GET(req: Request) {
    try {
        await dbConnect();
        console.log('[API/NEARBY] DB Connected');
        let session;
        try {
            session = await getServerSession(authOptions);
            console.log('[API/NEARBY] Session:', !!session);
        } catch (authError) {
            console.warn('[API/NEARBY] Auth session check failed, proceeding as guest:', authError);
            session = null;
        }

        const { searchParams } = new URL(req.url);
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');
        let radius = parseFloat(searchParams.get('radius') || '15');
        const category = searchParams.get('category');

        if (isNaN(lat) || isNaN(lng)) {
            return NextResponse.json(
                { message: 'lat and lng are required' },
                { status: 400 }
            );
        }
        
        if (radius > 50) radius = 50;

        // Fetch real partners
        const realPartners = await User.find({ role: 'partner', status: { $ne: 'suspended' } })
            .limit(500);

        // Conditional data: Guests get mocks too
        const allPartnersToProcess: any[] = session 
            ? realPartners 
            : [...realPartners, ...MOCK_PARTNERS, ...MOCK_CLINICS];

        const nearbyPartners: any[] = [];

        for (const partner of allPartnersToProcess) {
            const coords = partner.address?.coordinates?.coordinates;
            if (!coords || coords.length !== 2) continue;

            const [partnerLng, partnerLat] = coords;
            if (isNaN(partnerLat) || isNaN(partnerLng)) continue;

            const distance = calculateDistance(lat, lng, partnerLat, partnerLng);

            if (distance <= radius) {
                const deliveryFee = calculateDeliveryFee(
                    distance,
                    partner.deliveryFeePerKm || 2,
                    0,
                    partner.freeDeliveryMinimum || 0
                );

                nearbyPartners.push({
                    _id: String(partner._id),
                    name: partner.name,
                    shopLogo: partner.shopLogo || null,
                    specialization: partner.specialization || '',
                    distance,
                    deliveryFee,
                    deliveryRadius: partner.deliveryRadius || 10,
                    minimumOrderValue: partner.minimumOrderValue || 0,
                    freeDeliveryMinimum: partner.freeDeliveryMinimum || 0,
                    workingHours: partner.workingHours || [],
                });
            }
        }

        nearbyPartners.sort((a, b) => a.distance - b.distance);

        const realPartnerIds = realPartners.map(p => String(p._id));
        const nearbyRealIds = nearbyPartners.filter(p => realPartnerIds.includes(p._id)).map(p => p._id);

        let productQuery: any = {
            partnerId: { $in: nearbyRealIds },
            isActive: true,
        };
        if (category) {
            productQuery.category = category;
        }

        const products = nearbyRealIds.length > 0 
            ? await Product.find(productQuery)
                .populate('partnerId', 'name shopLogo')
                .sort({ salesCount: -1 })
                .limit(50)
                .lean()
            : [];

        const serializedProducts = products.map((p: any) => ({
            _id: String(p._id),
            title: p.title,
            description: p.description,
            price: p.price,
            category: p.category,
            image: p.image,
            discount: p.discount,
            productType: p.productType,
            subCategory: p.subCategory,
            rating: p.rating,
            reviewCount: p.reviewCount,
            salesCount: p.salesCount,
            brand: p.brand,
            partnerId: p.partnerId ? {
                _id: String(p.partnerId._id),
                name: p.partnerId.name,
                shopLogo: p.partnerId.shopLogo || null,
            } : null,
        }));

        const productCounts: Record<string, number> = {};
        for (const p of products) {
            const pid = (p as any).partnerId?._id?.toString();
            if (pid) {
                productCounts[pid] = (productCounts[pid] || 0) + 1;
            }
        }

        const petshopsWithCounts = nearbyPartners.map(ps => ({
            ...ps,
            productCount: productCounts[ps._id] || 0,
        }));

        return NextResponse.json(JSON.parse(JSON.stringify({
            petshops: petshopsWithCounts,
            products: serializedProducts,
            totalPetshops: petshopsWithCounts.length,
            totalProducts: serializedProducts.length,
        })));
    } catch (error: any) {
        console.error('Nearby API error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
