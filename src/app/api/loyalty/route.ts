import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import loyaltyService from '@/lib/loyalty-service';

/**
 * GET /api/loyalty
 * Get user's loyalty account status
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

        const account = await loyaltyService.getLoyaltyAccount(session.user.id);
        const benefits = loyaltyService.getTierBenefits(account.currentTier);

        return NextResponse.json({
            account,
            benefits,
        });
    } catch (error: any) {
        console.error('Error fetching loyalty account:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch loyalty account' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/loyalty
 * Redeem points for discount
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { pointsToRedeem } = await req.json();

        if (!pointsToRedeem || pointsToRedeem < 100) {
            return NextResponse.json(
                { error: 'Mínimo de 100 pontos para resgatar' },
                { status: 400 }
            );
        }

        const result = await loyaltyService.redeemPoints(session.user.id, pointsToRedeem);

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        console.error('Error redeeming points:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to redeem points' },
            { status: 500 }
        );
    }
}
