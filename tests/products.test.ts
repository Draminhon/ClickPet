import { GET, POST } from '@/app/api/products/route';
import Product from '@/models/Product';
import Subscription from '@/models/Subscription';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';

// Mock NextAuth
jest.mock('next-auth/next');
// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: (data: any, init?: any) => ({
            json: async () => data,
            status: init?.status || 200,
        }),
    },
}));

describe('Products API Security', () => {
    let partnerId: string;

    beforeEach(async () => {
        jest.clearAllMocks();
        partnerId = new mongoose.Types.ObjectId().toString();

        // Create an active subscription for the partner
        await Subscription.create({
            partnerId: partnerId,
            plan: 'premium',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            amount: 99.90,
            features: {
                maxProducts: -1,
                maxServices: -1,
                hasAnalytics: true,
                hasAdvancedReports: true,
                maxImages: 10
            }
        });
    });

    it('should prevent RegExp injection in search', async () => {
        // Create a test product
        await Product.create({
            title: 'Normal Product',
            description: 'desc',
            price: 10,
            category: 'food',
            partnerId: partnerId
        });

        // Search with a regex that would match everything if not escaped
        const reqWithInjection = {
            url: 'http://localhost/api/products?search=.*'
        } as any;

        const response = await GET(reqWithInjection);
        const data = await response.json();

        // Should NOT match if ".*" is escaped to "\\.\\*"
        expect(data.length).toBe(0);

        // Search with actual title
        const reqNormal = {
            url: 'http://localhost/api/products?search=Normal'
        } as any;

        const responseNormal = await GET(reqNormal);
        const dataNormal = await responseNormal.json();
        expect(dataNormal.length).toBe(1);
    });

    it('should block unauthorized POST', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);

        const req = {
            json: async () => ({ title: 'New' })
        } as any;

        const response = await POST(req);
        expect(response.status).toBe(401);
    });

    it('should block non-partner users from creating products', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: new (require('mongoose').Types.ObjectId)().toString(), role: 'customer' }
        });

        const req = {
            json: async () => ({ title: 'New' })
        } as any;

        const response = await POST(req);
        expect(response.status).toBe(401);
    });

    it('should validate price is positive', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: partnerId, role: 'partner' }
        });

        const req = {
            json: async () => ({
                title: 'Negative Price',
                description: 'desc',
                category: 'food',
                price: -10
            })
        } as any;

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toBe('Preço deve ser maior que zero');
    });
});
