import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Model to store push tokens
import mongoose from 'mongoose';

const PushTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    platform: {
        type: String,
        enum: ['web', 'ios', 'android'],
        default: 'web',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

PushTokenSchema.index({ userId: 1 });

const PushToken = mongoose.models.PushToken || mongoose.model('PushToken', PushTokenSchema);

/**
 * POST /api/push-tokens
 * Register a device push token for the authenticated user
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

        const { token, platform } = await req.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Upsert the push token
        const pushToken = await PushToken.findOneAndUpdate(
            { token },
            {
                userId: session.user.id,
                token,
                platform: platform || 'web',
                isActive: true,
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            pushToken,
        });
    } catch (error: any) {
        console.error('Error registering push token:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to register push token' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/push-tokens
 * Unregister a device push token
 */
export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { token } = await req.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Deactivate the push token
        await PushToken.findOneAndUpdate(
            { token, userId: session.user.id },
            { isActive: false }
        );

        return NextResponse.json({
            success: true,
            message: 'Push token unregistered',
        });
    } catch (error: any) {
        console.error('Error unregistering push token:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to unregister push token' },
            { status: 500 }
        );
    }
}
