"use client";

import Sidebar from "@/components/layout/Sidebar";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { useSession } from "next-auth/react";

export default function PartnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: '250px', padding: '2rem', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
                {session?.user?.id && <SubscriptionBanner partnerId={session.user.id} />}
                {children}
            </main>
        </div>
    );
}
