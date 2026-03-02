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

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main style={{
                flex: 1,
                marginLeft: isCollapsed ? '80px' : '250px',
                padding: '2rem',
                backgroundColor: '#FEFEFE',
                minHeight: '100vh',
                transition: 'margin-left 0.3s ease'
            }}>
                {session?.user?.id && <SubscriptionBanner partnerId={session.user.id} />}
                {children}
            </main>
        </div>
    );
}
