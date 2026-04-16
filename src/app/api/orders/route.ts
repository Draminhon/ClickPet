import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import notificationService from '@/lib/notification-service';
import { calculateDistance, calculateDeliveryFee } from '@/lib/distance';
import loyaltyService from '@/lib/loyalty-service';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        // Prevent mass assignment and force correct ownership/initial status
        const rawItems = (body.items || []).map((item: any) => ({
            productId: item.productId,
            quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
            shopName: item.shopName
        }));

        if (rawItems.length === 0) {
            return NextResponse.json({ message: 'Pedido deve ter pelo menos um item' }, { status: 400 });
        }

        // SECURITY: Recalculate prices from database — never trust client-sent prices
        const productIds = rawItems.map((item: any) => item.productId).filter(Boolean);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

        // SECURITY: Ensure all products exist and belong to the SAME partner
        if (products.length === 0) {
            return NextResponse.json({ message: 'Produtos não encontrados' }, { status: 404 });
        }

        const firstPartnerId = products[0].partnerId?.toString();
        const allSamePartner = products.every((p: any) => p.partnerId?.toString() === firstPartnerId);

        if (!allSamePartner) {
            return NextResponse.json({ message: 'Todos os itens devem ser da mesma loja' }, { status: 400 });
        }

        const verifiedItems = rawItems.map((item: any) => {
            const dbProduct = productMap.get(item.productId);
            if (!dbProduct) {
                throw new Error(`Produto não encontrado: ${item.productId}`);
            }
            return {
                productId: item.productId,
                title: dbProduct.title,
                price: dbProduct.price,
                quantity: item.quantity,
                shopName: item.shopName || dbProduct.partnerId?.name || '',
            };
        });

        // Calculate subtotal from verified prices
        const subtotal = verifiedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        
        // SECURITY: Validate Coupon and calculate discount on SERVER
        let serverCalculatedDiscount = 0;
        let verifiedCoupon = null;

        if (body.coupon) {
            const couponCode = String(body.coupon).toUpperCase();
            const dbCoupon = await Coupon.findOne({ 
                code: couponCode,
                partnerId: firstPartnerId, // SECURITY: Coupon must belong to the cart's partner
                isActive: true,
                expiresAt: { $gt: new Date() }
            });

            if (dbCoupon) {
                // Check min purchase
                if (subtotal >= (dbCoupon.minPurchase || 0)) {
                    // Check max uses
                    if (!dbCoupon.maxUses || dbCoupon.usedCount < dbCoupon.maxUses) {
                        verifiedCoupon = couponCode;
                        if (dbCoupon.type === 'percentage') {
                            serverCalculatedDiscount = (subtotal * dbCoupon.discount) / 100;
                            if (dbCoupon.maxDiscount && serverCalculatedDiscount > dbCoupon.maxDiscount) {
                                serverCalculatedDiscount = dbCoupon.maxDiscount;
                            }
                        } else {
                            serverCalculatedDiscount = dbCoupon.discount;
                        }
                    }
                }
            }
        }

        // SECURITY: Recalculate delivery fee server-side. Never trust client-provided pricing.
        const partner = await User.findById(firstPartnerId);
        if (!partner) {
            return NextResponse.json({ message: 'Parceiro não encontrado' }, { status: 404 });
        }

        let verifiedDeliveryFee = 0;
        let verifiedDistance = 0;

        if (!body.isPickup) {
            const userCoords = body.address?.coordinates;
            const shopCoords = partner.address?.coordinates?.coordinates;

            if (userCoords && shopCoords && Array.isArray(userCoords) && Array.isArray(shopCoords)) {
                verifiedDistance = calculateDistance(userCoords[1], userCoords[0], shopCoords[1], shopCoords[0]);
                verifiedDeliveryFee = calculateDeliveryFee(
                    verifiedDistance,
                    partner.deliveryFeePerKm || 2,
                    subtotal,
                    partner.freeDeliveryMinimum || 0
                );
            } else {
                // Fallback or error if coordinates are missing for delivery
                console.warn('[ORDER] Missing coordinates for delivery calculation, using capped fallback');
                verifiedDeliveryFee = Math.max(0, Math.min(Number(body.deliveryFee) || 0, 50)); 
            }
        }

        // SECURITY: Validate and calculate Loyalty Points discount
        let pointsDiscount = 0;
        const requestedPoints = Math.floor(Number(body.pointsRedeemed) || 0);
        
        if (requestedPoints > 0) {
            try {
                const loyaltyAccount = await loyaltyService.getLoyaltyAccount(session.user.id);
                if (loyaltyAccount.totalPoints < requestedPoints) {
                    return NextResponse.json({ message: 'Pontos de fidelidade insuficientes' }, { status: 400 });
                }
                
                // POINTS_TO_REAL is 0.1 according to loyalty-service (10 points = R$1)
                pointsDiscount = requestedPoints * 0.1;
                
                // Ensure discount doesn't exceed subtotal
                if (pointsDiscount > subtotal - serverCalculatedDiscount) {
                    pointsDiscount = subtotal - serverCalculatedDiscount;
                }
            } catch (pError) {
                console.error('[ORDER] Loyalty points verification failed:', pError);
                return NextResponse.json({ message: 'Erro ao validar pontos de fidelidade' }, { status: 400 });
            }
        }

        const calculatedTotal = subtotal - serverCalculatedDiscount - pointsDiscount + verifiedDeliveryFee;

        const orderData: any = {
            userId: session.user.id,
            items: verifiedItems,
            total: Math.max(0, calculatedTotal),
            deliveryFee: verifiedDeliveryFee,
            distance: verifiedDistance || body.distance,
            isPickup: !!body.isPickup,
            status: 'pending',
            address: body.address ? {
                street: body.address.street,
                number: body.address.number,
                complement: body.address.complement,
                city: body.address.city,
                zip: body.address.zip,
                coordinates: body.address.coordinates
            } : undefined,
            coupon: verifiedCoupon,
            discount: serverCalculatedDiscount,
            pointsRedeemed: requestedPoints,
            pointsDiscount: pointsDiscount,
            paymentMethod: body.paymentMethod || 'cartao',
            // SECURITY: Never trust client paymentStatus — always start as pending
            paymentStatus: 'pending',
        };

        // Get partnerId from verified source
        const partnerId = firstPartnerId;

        const order = await Order.create({
            ...orderData,
            partnerId,
        });

        // Notify partner about new order
        if (partnerId) {
            await notificationService.notifyPartnerNewOrder(
                partnerId,
                order._id.toString(),
                order.total
            );
        }

        // Increment coupon usage if present
        if (verifiedCoupon) {
            await Coupon.findOneAndUpdate(
                { code: verifiedCoupon },
                { $inc: { usedCount: 1 } },
                { new: true }
            );
        }

        // Deduct points after order creation is guaranteed
        if (requestedPoints > 0) {
            await loyaltyService.redeemPoints(session.user.id, requestedPoints);
        }

        return NextResponse.json(order, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: 'Error creating order' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const query = session.user.role === 'partner'
            ? { partnerId: session.user.id }
            : { userId: session.user.id };

        const orders = await Order.find(query)
            .populate('deliveryPersonId')
            .sort({ createdAt: -1 });

        return NextResponse.json(orders);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
