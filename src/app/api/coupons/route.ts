import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Coupon from '@/models/Coupon';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

/**
 * Validates coupon fields.
 * `data` should only contain the fields being set (whole body on create,
 * only the fields the client actually sent on a partial update), plus an
 * `type` resolved to its effective value (existing type merged in on update).
 * Returns an error message in Portuguese, or null if everything is valid.
 */
function validateCouponData(data: any, isCreate: boolean): string | null {
    const type = data.type === 'fixed' ? 'fixed' : 'percentage';

    if (isCreate && (typeof data.code !== 'string' || !data.code.trim())) {
        return 'O código do cupom é obrigatório';
    }

    if (data.discount !== undefined && data.discount !== null && data.discount !== '') {
        const discount = Number(data.discount);
        if (isNaN(discount) || discount <= 0) {
            return 'O valor do desconto deve ser maior que zero';
        }
        if (type === 'percentage' && discount > 100) {
            return 'O desconto percentual não pode ser maior que 100%';
        }
    } else if (isCreate) {
        return 'O valor do desconto é obrigatório';
    }

    if (data.expiresAt !== undefined && data.expiresAt !== null && data.expiresAt !== '') {
        const expiresAt = new Date(data.expiresAt);
        if (isNaN(expiresAt.getTime())) {
            return 'Data de expiração inválida';
        }
        if (expiresAt.getTime() <= Date.now()) {
            return 'A data de expiração deve ser no futuro';
        }
    } else if (isCreate) {
        return 'A data de expiração é obrigatória';
    }

    if (data.minPurchase !== undefined && data.minPurchase !== null && data.minPurchase !== '') {
        const minPurchase = Number(data.minPurchase);
        if (isNaN(minPurchase) || minPurchase < 0) {
            return 'A compra mínima não pode ser negativa';
        }
    }

    if (data.maxUses !== undefined && data.maxUses !== null && data.maxUses !== '') {
        const maxUses = Number(data.maxUses);
        if (isNaN(maxUses) || maxUses <= 0 || !Number.isInteger(maxUses)) {
            return 'O número máximo de usos deve ser um número inteiro positivo';
        }
    }

    if (data.maxDiscount !== undefined && data.maxDiscount !== null && data.maxDiscount !== '') {
        const maxDiscount = Number(data.maxDiscount);
        if (isNaN(maxDiscount) || maxDiscount <= 0) {
            return 'O desconto máximo deve ser um número positivo';
        }
    }

    return null;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        if (!session.user.id) {
            return NextResponse.json({ message: 'Partner ID is missing from session' }, { status: 400 });
        }

        const validationError = validateCouponData(body, true);
        if (validationError) {
            return NextResponse.json({ message: validationError }, { status: 400 });
        }

        console.log(`[COUPON] Creating coupon '${body.code.toUpperCase()}' for partner ${session.user.id}`);

        const coupon = await Coupon.create({
            ...body,
            partnerId: session.user.id,
            code: body.code.toUpperCase(),
        });

        console.log(`[COUPON] Success:`, coupon._id);

        return NextResponse.json(coupon, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Código de cupom já existe' }, { status: 400 });
        }
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const coupons = await Coupon.find({ partnerId: session.user.id }).sort({ createdAt: -1 });

        return NextResponse.json(coupons);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const couponId = searchParams.get('id');
        if (!couponId) {
            return NextResponse.json({ message: 'Coupon id is required' }, { status: 400 });
        }

        await dbConnect();

        const existing = await Coupon.findOne({ _id: couponId, partnerId: session.user.id });
        if (!existing) {
            return NextResponse.json({ message: 'Cupom não encontrado' }, { status: 404 });
        }

        const body = await req.json();

        // Whitelist: never let code/partnerId/usedCount be changed through this endpoint.
        const ALLOWED_FIELDS = ['type', 'discount', 'maxDiscount', 'minPurchase', 'maxUses', 'expiresAt', 'isActive'];
        const updateBody: Record<string, any> = {};
        for (const field of ALLOWED_FIELDS) {
            if (field in body) {
                updateBody[field] = body[field];
            }
        }

        const effectiveType = updateBody.type !== undefined ? updateBody.type : existing.type;
        const validationError = validateCouponData({ ...updateBody, type: effectiveType }, false);
        if (validationError) {
            return NextResponse.json({ message: validationError }, { status: 400 });
        }

        const coupon = await Coupon.findOneAndUpdate(
            { _id: couponId, partnerId: session.user.id },
            { $set: updateBody },
            { new: true, runValidators: true }
        );

        return NextResponse.json(coupon);
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Código de cupom já existe' }, { status: 400 });
        }
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'partner') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const couponId = searchParams.get('id');

        await dbConnect();
        await Coupon.findOneAndDelete({ _id: couponId, partnerId: session.user.id });

        return NextResponse.json({ message: 'Coupon deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
