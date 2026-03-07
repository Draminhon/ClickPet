import AuditLog from '@/models/AuditLog';
import dbConnect from './db';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Standardized utility to log sensitive actions to the AuditLog collection.
 */
export async function logAction(
    req: NextRequest | Request,
    action: string,
    details: any = {}
) {
    try {
        await dbConnect();

        // Get session data
        const token = await getToken({
            req: req as any,
            secret: process.env.NEXTAUTH_SECRET
        });

        // Get IP from headers (standard Next.js way)
        const forwarded = req.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';

        await AuditLog.create({
            action,
            userId: token?.id || null,
            userRole: (token?.role as string) || 'anonymous',
            details,
            ipAddress
        });
    } catch (error) {
        // We catch errors to prevent logging failures from breaking use flows,
        // but we log it to console for infrastructure monitoring.
        console.error('[CRITICAL] Audit logging failed:', error);
    }
}
