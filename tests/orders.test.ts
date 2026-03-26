import { POST } from '@/app/api/orders/route';
import Product from '@/models/Product';
import Order from '@/models/Order';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';

// Mock NextAuth
jest.mock('next-auth/next');
// Mock notification service
jest.mock('@/lib/notification-service', () => ({
    notifyPartnerNewOrder: jest.fn().mockResolvedValue(true),
}));
// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: (data: any, init?: any) => ({
            json: async () => data,
            status: init?.status || 200,
        }),
    },
}));

describe('Orders API Security', () => {
    let partnerId: mongoose.Types.ObjectId;
    let productId: mongoose.Types.ObjectId;

    beforeEach(async () => {
        jest.clearAllMocks();
        partnerId = new mongoose.Types.ObjectId();
        productId = new mongoose.Types.ObjectId();

        // Create a real product in memory DB
        await Product.create({
            _id: productId,
            title: 'Expensive Item',
            description: 'Item of high value for testing total calculation',
            price: 100, // True price is 100
            category: 'food',
            partnerId: partnerId
        });
    });

    it('should recalculate total and ignore client-sent price', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: new mongoose.Types.ObjectId().toString(), role: 'customer' }
        });

        const req = {
            json: async () => ({
                items: [{
                    productId: productId.toString(),
                    quantity: 2,
                    price: 1 // Attempted to buy for R$ 1
                }],
                total: 2, // Attempted total R$ 2
                paymentStatus: 'approved' // Attempted to bypass payment
            })
        } as any;

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        
        // Check the created order in DB
        const order = await Order.findById(data._id);
        expect(order.items[0].price).toBe(100); // Should be 100, not 1
        expect(order.total).toBe(200); // 100 * 2 = 200
        expect(order.paymentStatus).toBe('pending'); // Should be pending, not approved
    });

    it('should block orders with empty items', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: new mongoose.Types.ObjectId().toString(), role: 'customer' }
        });

        const req = {
            json: async () => ({ items: [] })
        } as any;

        const response = await POST(req);
        expect(response.status).toBe(400);
    });
});
