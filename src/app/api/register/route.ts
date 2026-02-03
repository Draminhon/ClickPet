import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { name, email, password, role, cnpj } = await req.json();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Email já cadastrado.' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            cnpj: role === 'partner' ? cnpj : undefined,
        });

        return NextResponse.json({ message: 'Usuário criado com sucesso!' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Erro ao criar usuário.' },
            { status: 500 }
        );
    }
}
