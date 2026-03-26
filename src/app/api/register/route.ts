import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sanitizeInput } from '@/lib/sanitize';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { name, email, password } = await req.json();

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

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email já cadastrado.' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // SECURITY: Always force role to 'customer'. Partners/admins must be promoted by an admin.
        const user = await User.create({
            name: sanitizedName,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'customer',
        });

        return NextResponse.json({ message: 'Usuário criado com sucesso!' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { message: 'Erro ao criar usuário.' },
            { status: 500 }
        );
    }
}
