import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // Global API protection (except auth and public routes)
    const publicApiRoutes = [
        '/api/auth',
        '/api/register',
        '/api/products',
        '/api/services',
        '/api/reviews',
        '/api/webhooks',
    ];

    const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

    if (pathname.startsWith('/api') && !isPublicApiRoute) {
        if (!token) {
            return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
        }
    }

    // Protect profile route
    if (pathname === '/profile') {
        if (!token) {
            return NextResponse.redirect(new URL('/login?callbackUrl=/profile', req.url));
        }
        return NextResponse.next();
    }

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login?error=admin_no_token', req.url));
        }
        if (token.role !== 'admin') {
            return NextResponse.redirect(new URL('/?error=admin_role_mismatch', req.url));
        }
        return NextResponse.next();
    }

    // Protect partner routes
    if (pathname.startsWith('/partner')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login?error=partner_no_token', req.url));
        }
        if (token.role !== 'partner') {
            return NextResponse.redirect(new URL('/?error=partner_role_mismatch', req.url));
        }

        // Check subscription status
        const subscriptionStatus = token?.subscriptionStatus as string | undefined;
        const isProfileComplete = token?.isProfileComplete as boolean | undefined;

        // Step 1: Active Subscription
        if (!subscriptionStatus || subscriptionStatus !== 'active') {
             if (pathname.startsWith('/partner/subscription') || pathname === '/partner/dashboard') {
                return NextResponse.next();
            }
            return NextResponse.redirect(new URL('/partner/subscription', req.url));
        }

        // Step 2: Complete Profile
        if (!isProfileComplete) {
            // Force settings page if profile is incomplete. Only allow subscription page as fallback.
            if (pathname === '/partner/settings' || pathname.startsWith('/partner/subscription')) {
                return NextResponse.next();
            }
            return NextResponse.redirect(new URL('/partner/settings', req.url));
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/partner/:path*',
        '/profile',
        '/api/((?!auth).*)',
    ],
};
