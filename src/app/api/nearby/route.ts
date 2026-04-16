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
        const role = searchParams.get('role') || 'partner';

        const hasLocation = !isNaN(lat) && !isNaN(lng);
        
        if (radius > 50) radius = 50;

        // Fetch real partners/vets
        // SECURITY: Only fetch active partners and veterinarians. NEVER include admin in public search.
        const findQuery: any = { 
            status: { $ne: 'suspended' },
            role: { $in: ['partner', 'veterinarian'] }
        };
        
        if (role !== 'any') {
            if (role === 'partner') {
                findQuery.role = { $in: ['partner', 'veterinarian'] };
            } else {
                findQuery.role = role;
            }
        }

        const realPartners = await User.find(findQuery).limit(500);

        // Include mocks for logged-in users too if they are role 'partner' or if real results are low
        const shouldIncludeMocks = !session || (realPartners.length < 5);
        
        const allPartnersToProcess: any[] = shouldIncludeMocks
            ? [...realPartners, ...MOCK_PARTNERS, ...MOCK_CLINICS]
            : realPartners;

        const nearbyPartners: any[] = [];

        for (const partner of allPartnersToProcess) {
            const coords = partner.address?.coordinates?.coordinates;
            
            let distance = null;
            let deliveryFee = 0;

            if (hasLocation && coords && coords.length === 2) {
                const [partnerLng, partnerLat] = coords;
                if (!isNaN(partnerLat) && !isNaN(partnerLng)) {
                    distance = calculateDistance(lat, lng, partnerLat, partnerLng);
                    
                    if (distance <= radius) {
                        deliveryFee = calculateDeliveryFee(
                            distance,
                            partner.deliveryFeePerKm || 2,
                            0,
                            partner.freeDeliveryMinimum || 0
                        );
                    } else {
                        // Too far away, skip this one if we have a search radius
                        continue;
                    }
                }
            }

            // If we have no location, or it's within radius (or we don't care about radius if no location)
            nearbyPartners.push({
                _id: String(partner._id),
                name: partner.name,
                shopLogo: partner.shopLogo || partner.image || null,
                bannerImage: partner.bannerImage || null,
                specialization: partner.specialization || '',
                bio: partner.bio || '',
                // SECURITY: Never leak encrypted PII strings (whatsapp/phone) to the public frontend
                whatsapp: '', 
                crmv: partner.role === 'veterinarian' ? partner.crmv || '' : '',
                distance,
                deliveryFee,
                deliveryRadius: partner.deliveryRadius || 10,
                minimumOrderValue: partner.minimumOrderValue || 0,
                freeDeliveryMinimum: partner.freeDeliveryMinimum || 0,
                workingHours: partner.workingHours || [],
                role: partner.role || 'partner',
                rating: partner.rating || 0,
                reviewCount: partner.reviewCount || 0,
            });
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
