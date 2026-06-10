import { PUT } from '../src/app/api/profile/route';
import User from '../src/models/User';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';

// Mock NextAuth
jest.mock('next-auth/next');

// Mock Audit logger
jest.mock('@/lib/audit', () => ({
    logAction: jest.fn().mockResolvedValue(true),
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

describe('Profile API PIX Key Validation', () => {
    let partnerId: mongoose.Types.ObjectId;
    let customerId: mongoose.Types.ObjectId;

    beforeEach(async () => {
        jest.clearAllMocks();
        partnerId = new mongoose.Types.ObjectId();
        customerId = new mongoose.Types.ObjectId();

        // Create a partner user in memory DB
        await User.create({
            _id: partnerId,
            name: 'Partner Shop',
            email: 'partner@example.com',
            role: 'partner',
            pixConfig: {
                key: '12345678900',
                keyType: 'CPF',
                beneficiary: 'Partner Shop Ltd'
            }
        });

        // Create a customer user in memory DB
        await User.create({
            _id: customerId,
            name: 'Customer Client',
            email: 'customer@example.com',
            role: 'customer'
        });
    });

    it('should block when a partner updates profile with an empty PIX key', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: partnerId.toString(), role: 'partner' }
        });

        const req = {
            json: async () => ({
                pixConfig: {
                    key: '', // Empty PIX key
                    keyType: 'CPF',
                    beneficiary: 'Partner Shop Ltd'
                }
            })
        } as any;

        const response = await PUT(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toBe('A chave PIX é obrigatória para parceiros.');
    });

    it('should succeed when a partner updates profile with a valid PIX key', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: partnerId.toString(), role: 'partner' }
        });

        const req = {
            json: async () => ({
                name: 'Partner Shop Updated',
                pixConfig: {
                    key: '98765432100', // Valid key
                    keyType: 'CPF',
                    beneficiary: 'Partner Shop Updated'
                }
            })
        } as any;

        const response = await PUT(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.pixConfig.key).toBe('98765432100');
        expect(data.name).toBe('Partner Shop Updated');
    });

    it('should succeed when a partner updates other fields without providing pixConfig in the request body', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: partnerId.toString(), role: 'partner' }
        });

        const req = {
            json: async () => ({
                name: 'Partner Shop New Name'
            })
        } as any;

        const response = await PUT(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe('Partner Shop New Name');
        // Existing PIX key should still be intact in DB
        expect(data.pixConfig.key).toBe('12345678900');
    });

    it('should succeed when a customer updates their profile with no PIX config', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { id: customerId.toString(), role: 'customer' }
        });

        const req = {
            json: async () => ({
                name: 'Customer Updated Name'
            })
        } as any;

        const response = await PUT(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.name).toBe('Customer Updated Name');
    });
});
