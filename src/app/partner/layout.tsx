"use client";

import { useState, useEffect } from 'react';
import Sidebar from "@/components/layout/Sidebar";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { useSession } from "next-auth/react";

export default function PartnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsCollapsed(true);
            }
        };

        // Initialize state on mount
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main style={{
                flex: 1,
                marginLeft: isMobile ? '0' : (isCollapsed ? '80px' : '250px'),
                padding: isMobile ? '1rem' : '2rem',
                backgroundColor: '#FEFEFE',
                minHeight: '100vh',
                transition: 'margin-left 0.3s ease',
                width: '100%',
                overflowX: 'hidden'
            }}>
                {session?.user?.id && <SubscriptionBanner partnerId={session.user.id} />}
                {children}
            </main>
        </div>
    );
}
