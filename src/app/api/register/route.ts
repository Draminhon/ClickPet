import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User, { hashEmail } from '@/models/User';
import Subscription from '@/models/Subscription';
import bcrypt from 'bcryptjs';
import { sanitizeInput } from '@/lib/sanitize';

import { authRateLimiter } from '@/lib/rateLimit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
    try {
        const ip = req.headers?.get('x-forwarded-for') || req.headers?.get('x-real-ip') || '127.0.0.1';
        const rateLimitResult = authRateLimiter.check(ip);
        
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { message: 'Muitas solicitações. Tente novamente em alguns minutos.' },
                { status: 429 }
            );
        }

        await dbConnect();
        
        const rawBody = await req.json();
        
        const name = sanitizeInput(rawBody.name);
        const email = sanitizeInput(rawBody.email);
        const password = String(rawBody.password);
        const role = sanitizeInput(rawBody.role);

        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { message: 'Nome deve ter pelo menos 2 caracteres.' },
                { status: 400 }
            );
        }

        if (!email || !EMAIL_REGEX.test(email)) {
            return NextResponse.json(
                { message: 'Email inválido.' },
                { status: 400 }
            );
        }

        if (!password || password.length < 8) {
            return NextResponse.json(
                { message: 'Senha deve ter pelo menos 8 caracteres.' },
                { status: 400 }
            );
        }



        const existingUser = await User.findOne({ emailHash: hashEmail(email) });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email já cadastrado.' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Security: Allow customer, partner, and veterinarian to be created via public registration
        let finalRole: 'customer' | 'partner' | 'veterinarian' = 'customer';
        if (role === 'partner') finalRole = 'partner';
        else if (role === 'veterinarian') finalRole = 'veterinarian';

        const userData: any = {
            name: name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: finalRole,
        };



        const user = await User.create(userData);

        // If partner or veterinarian, create an automatic enterprise active subscription
        if (finalRole === 'partner' || finalRole === 'veterinarian') {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(startDate.getFullYear() + 50); // permanent

            await Subscription.create({
                partnerId: user._id,
                plan: 'enterprise',
                status: 'active',
                startDate,
                endDate,
                amount: 0,
                features: Subscription.getPlanFeatures('enterprise'),
            });
        }

        return NextResponse.json({ message: 'Usuário criado com sucesso!' }, { status: 201 });
    } catch (error: any) {
        console.error('[REGISTER] Error:', error.message, error.errors || '');
        return NextResponse.json(
            { message: 'Erro ao criar usuário.' },
            { status: 500 }
        );
    }
}
