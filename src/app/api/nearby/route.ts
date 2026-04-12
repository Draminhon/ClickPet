import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import { calculateDistance, calculateDeliveryFee } from '@/lib/distance';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');
        const radius = parseFloat(searchParams.get('radius') || '15');
        const category = searchParams.get('category');

        if (isNaN(lat) || isNaN(lng)) {
            return NextResponse.json(
                { message: 'lat and lng are required' },
                { status: 400 }
            );
        }

        // Fetch all partners with addresses
        const partners = await User.find({ role: 'partner' }).lean();

        // Filter partners within radius using Haversine
        const nearbyPartners: any[] = [];

        for (const partner of partners) {
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
                    distance,
                    deliveryFee,
                    deliveryRadius: partner.deliveryRadius || 10,
                    minimumOrderValue: partner.minimumOrderValue || 0,
                    freeDeliveryMinimum: partner.freeDeliveryMinimum || 0,
                });
            }
        }

        // Sort by distance
        nearbyPartners.sort((a, b) => a.distance - b.distance);

        // Fetch products for nearby partners
        const partnerIds = nearbyPartners.map(p => p._id);

        let productQuery: any = {
            partnerId: { $in: partnerIds },
            isActive: true,
        };
        if (category) {
            productQuery.category = category;
        }

        const products = await Product.find(productQuery)
            .populate('partnerId', 'name shopLogo')
            .sort({ salesCount: -1 })
            .limit(50)
            .lean();

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

        // Count products per partner
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

        return NextResponse.json({
            petshops: petshopsWithCounts,
            products: serializedProducts,
            totalPetshops: petshopsWithCounts.length,
            totalProducts: serializedProducts.length,
        });
    } catch (error: any) {
        console.error('Nearby API error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
