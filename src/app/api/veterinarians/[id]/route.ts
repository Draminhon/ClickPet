import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;

        const vet = await User.findById(id)
            .select('-password -twoFactorSecret -cnpj -cpf -failedLoginAttempts -lockUntil -tokenVersion -paymentConfig -paymentMethods -pixConfig');

        if (!vet || vet.role !== 'veterinarian') {
            return NextResponse.json({ message: 'Veterinário não encontrado' }, { status: 404 });
        }

        // Access decrypted fields directly from the Mongoose document (getters trigger decryption)
        const vetData = {
            _id: String(vet._id),
            name: vet.name,
            image: vet.image || null,
            bannerImage: vet.bannerImage || null,
            specialization: vet.specialization || '',
            bio: vet.bio || '',
            whatsapp: vet.whatsapp || '',
            phone: vet.phone || '',
            crmv: vet.crmv || '',
            role: vet.role,
            createdAt: vet.createdAt,
            workingHours: vet.workingHours || [],
            address: vet.address ? {
                street: vet.address.street || '',
                number: vet.address.number || '',
                complement: vet.address.complement || '',
                neighborhood: vet.address.neighborhood || '',
                city: vet.address.city || '',
                state: vet.address.state || '',
                zip: vet.address.zip || '',
            } : null,
        };

        return NextResponse.json(vetData);
    } catch (error: any) {
        console.error('Vet profile API error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
