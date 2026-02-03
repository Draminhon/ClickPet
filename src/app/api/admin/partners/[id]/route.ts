import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Subscription from '@/models/Subscription';

// DELETE /api/admin/partners/[id] - Delete a partner
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        const { id } = await params;

        await dbConnect();

        // Check if partner exists
        const partner = await User.findById(id);
        if (!partner) {
            return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 });
        }

        if (partner.role !== 'partner') {
            return NextResponse.json({ error: 'Usuário não é um parceiro' }, { status: 400 });
        }

        // Delete subscription first
        await Subscription.findOneAndDelete({ partnerId: id });

        // Delete partner
        await User.findByIdAndDelete(id);

        // TODO: Delete other related data (products, services, orders, etc.)
        // For now we just delete the user and subscription as requested

        return NextResponse.json({ message: 'Parceiro excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting partner:', error);
        return NextResponse.json({ error: 'Erro ao excluir parceiro' }, { status: 500 });
    }
}
