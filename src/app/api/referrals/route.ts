import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import loyaltyService from '@/lib/loyalty-service';
import Referral from '@/models/Referral';

/**
 * GET /api/referrals
 * Get user's referral status and code
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

        // Get or create referral code
        let referral = await Referral.findOne({ referrerId: session.user.id });

        if (!referral) {
            referral = await loyaltyService.createReferral(session.user.id);
        }

        // Get referral stats
        const stats = await Referral.aggregate([
            { $match: { referrerId: session.user.id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const referrals = await Referral.find({ referrerId: session.user.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('referredId', 'name email');

        return NextResponse.json({
            code: referral.code,
            stats,
            referrals,
        });
    } catch (error: any) {
        console.error('Error fetching referrals:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch referrals' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/referrals
 * Create a new referral
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

        const { referredEmail } = await req.json();

        const referral = await loyaltyService.createReferral(session.user.id, referredEmail);

        return NextResponse.json({
            success: true,
            referral,
        });
    } catch (error: any) {
        console.error('Error creating referral:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create referral' },
            { status: 500 }
        );
    }
}
