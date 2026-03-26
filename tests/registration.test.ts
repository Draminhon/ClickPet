import { POST } from '../src/app/api/register/route';
import User from '../src/models/User';
import mongoose from 'mongoose';

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: (data: any, init?: any) => ({
            json: async () => data,
            status: init?.status || 200,
        }),
    },
}));

describe('Registration API Security', () => {
    it('should force role to "customer" even if "admin" is requested', async () => {
        const req = {
            json: async () => ({
                name: 'Hacker User',
                email: 'hacker@example.com',
                password: 'password123',
                role: 'admin' // Attempted escalation
            })
        } as any;

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        
        const user = await User.findOne({ email: 'hacker@example.com' });
        expect(user).toBeDefined();
        expect(user.role).toBe('customer'); // Escalation blocked
    });

    it('should validate password length', async () => {
        const req = {
            json: async () => ({
                name: 'Short Pass',
                email: 'short@example.com',
                password: '123'
            })
        } as any;

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toContain('Senha deve ter pelo menos 8 caracteres');
    });

    it('should validate email format', async () => {
        const req = {
            json: async () => ({
                name: 'Bad Email',
                email: 'not-an-email',
                password: 'password123'
            })
        } as any;

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toBe('Email inválido.');
    });
});
