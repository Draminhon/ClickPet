import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { logAction } from '@/lib/audit';

/**
 * DELETE /api/payments/cards/:id
 * `id` é o `_id` do subdocumento (identidade real do registro) — não o
 * `cardToken`. O token não é garantidamente único por cartão (o sandbox da
 * ASAAS devolve o mesmo token pra qualquer cartão de um customer), então
 * usá-lo pra identificar qual linha excluir podia apagar o cartão errado.
 *
 * A ASAAS não tem endpoint para revogar um token — a remoção é só local. O
 * token continua existindo do lado deles, mas sem a nossa referência a ele
 * fica inerte: nada no app volta a usá-lo depois de removido daqui.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const hasCard = (user.savedCards || []).some((c: any) => c._id.toString() === id);
        if (!hasCard) {
            return NextResponse.json({ message: 'Cartão não encontrado.' }, { status: 404 });
        }

        user.savedCards = (user.savedCards || []).filter((c: any) => c._id.toString() !== id) as any;
        await user.save();

        await logAction(req, 'card_removed', { cardId: id });

        return NextResponse.json({ message: 'Cartão removido.' });
    } catch (error: any) {
        console.error('[Payments/Cards] Error removing card:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
