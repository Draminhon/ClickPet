import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Subscription from '@/models/Subscription';
import bcrypt from 'bcryptjs';
import { sanitizeInput } from '@/lib/sanitize';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { name, email, password, role, cnpj } = await req.json();

        // Validate required fields
        const sanitizedName = sanitizeInput(name)?.trim();
        if (!sanitizedName || sanitizedName.length < 2) {
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

        if (role === 'partner' && (!cnpj || cnpj.length < 14)) {
            return NextResponse.json(
                { message: 'CNPJ é obrigatório para petshops.' },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email já cadastrado.' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Security: Only allow 'customer' and 'partner' to be created via public registration
        const finalRole = (role === 'partner') ? 'partner' : 'customer';

        const userData: any = {
            name: sanitizedName,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: finalRole,
        };

        if (finalRole === 'partner') {
            userData.cnpj = cnpj;
        }

        const user = await User.create(userData);

        // If partner, create an automatic free active subscription
        if (finalRole === 'partner') {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(startDate.getFullYear() + 50); // Free plan is "permanent"

            await Subscription.create({
                partnerId: user._id,
                plan: 'free',
                status: 'active',
                startDate,
                endDate,
                amount: 0,
                features: Subscription.getPlanFeatures('free'),
            });
        }

        return NextResponse.json({ message: 'Usuário criado com sucesso!' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { message: 'Erro ao criar usuário.' },
            { status: 500 }
        );
    }
}
