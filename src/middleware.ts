import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
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

        // Allow access to subscription pages even if subscription is not active
        if (pathname.startsWith('/partner/subscription')) {
            return NextResponse.next();
        }

        // Check subscription status for other partner routes
        const subscriptionStatus = token?.subscriptionStatus as string | undefined;

        // If subscription is not active, redirect to subscription page
        if (!subscriptionStatus || subscriptionStatus !== 'active') {
            // Allow access to dashboard to see the warning
            if (pathname === '/partner/dashboard') {
                return NextResponse.next();
            }
            return NextResponse.redirect(new URL('/partner/subscription', req.url));
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
