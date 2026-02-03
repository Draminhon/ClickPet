import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Coupon from '@/models/Coupon';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { code, total } = await req.json();

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true,
            expiresAt: { $gt: new Date() }
        });

        if (!coupon) {
            return NextResponse.json({ message: 'Cupom inválido ou expirado' }, { status: 404 });
        }

        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ message: 'Cupom esgotado' }, { status: 400 });
        }

        if (total < coupon.minPurchase) {
            return NextResponse.json({
                message: `Compra mínima de R$ ${coupon.minPurchase.toFixed(2)} necessária`
            }, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            discount: coupon.discount,
            code: coupon.code,
            partnerId: coupon.partnerId.toString()
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
