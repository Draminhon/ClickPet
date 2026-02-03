import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Subscription from '@/models/Subscription';

// GET /api/admin/partners - List all partners
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Build query
        const query: any = { role: 'partner' };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { cnpj: { $regex: search, $options: 'i' } }
            ];
        }

        // Get partners
        const partners = await User.find(query)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Get subscription info for each partner
        const partnersWithSub = await Promise.all(partners.map(async (partner: any) => {
            const subscription = await Subscription.findOne({ partnerId: partner._id })
                .select('plan status endDate')
                .lean();
            
            return {
                ...partner,
                subscription: subscription || null
            };
        }));

        const total = await User.countDocuments(query);

        return NextResponse.json({
            partners: partnersWithSub,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching partners:', error);
        return NextResponse.json({ error: 'Erro ao buscar parceiros' }, { status: 500 });
    }
}
