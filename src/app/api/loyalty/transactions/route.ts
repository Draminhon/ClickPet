import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import loyaltyService from '@/lib/loyalty-service';

/**
 * GET /api/loyalty/transactions
 * Get user's points transaction history
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await loyaltyService.getTransactionHistory(session.user.id, page, limit);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error fetching transaction history:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch transaction history' },
            { status: 500 }
        );
    }
}
