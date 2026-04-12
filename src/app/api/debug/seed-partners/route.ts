import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

const mockPartners = [
    {
        name: 'Pet Feliz Central',
        email: 'feliz@clickpet.com',
        role: 'partner',
        shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop',
        specialization: 'Petshop & Clínica',
    },
    {
        name: 'Canto das Aves',
        email: 'aves@clickpet.com',
        role: 'partner',
        shopLogo: 'https://images.unsplash.com/photo-1552728089-57bdde30fc3b?w=100&h=100&fit=crop',
        specialization: 'Aves & Gaiolas',
    },
    {
        name: 'Mundo Submarino',
        email: 'submarino@clickpet.com',
        role: 'partner',
        shopLogo: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&h=100&fit=crop',
        specialization: 'Aquarismo Profissional',
    },
    {
        name: 'Casa do Criador',
        email: 'criador@clickpet.com',
        role: 'partner',
        shopLogo: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=100&h=100&fit=crop',
        specialization: 'Casa de Ração',
    },
    {
        name: 'Dog Style Grooming',
        email: 'styling@clickpet.com',
        role: 'partner',
        shopLogo: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop',
        specialization: 'Banho e Tosa',
    },
    {
        name: 'Gato Mania',
        email: 'gato@clickpet.com',
        role: 'partner',
        shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop',
        specialization: 'Artigos Felinos',
    },
    {
        name: 'Reino Animal',
        email: 'reino@clickpet.com',
        role: 'partner',
        shopLogo: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=100&h=100&fit=crop',
        specialization: 'Petshop Geral',
    },
    {
        name: 'Aquário Design',
        email: 'design@clickpet.com',
        role: 'partner',
        shopLogo: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=100&h=100&fit=crop',
        specialization: 'Peixes Ornamentais',
    },
];

export async function GET() {
    try {
        await dbConnect();

        for (const partnerData of mockPartners) {
            await User.findOneAndUpdate(
                { email: partnerData.email },
                partnerData,
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ message: 'Seeding successful', count: mockPartners.length });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
