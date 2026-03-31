"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * This component handles automatic redirection for partners.
 * If a partner lands on the homepage or login page, they are taken to their dashboard.
 */
export default function AuthRedirect() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'partner') {
            // Define pages where a partner should be redirected FROM
            const redirectFrom = ['/', '/login', '/register', '/profile'];
            
            if (redirectFrom.includes(pathname)) {
                console.log('[AuthRedirect] Partner detected on public page, redirecting to dashboard...');
                router.push('/partner/dashboard');
            }
        }
    }, [session, status, pathname, router]);

    return null;
}
