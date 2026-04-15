"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import MobileNav from "./MobileNav";
import Footer from "./Footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isPartnerPage = (pathname?.startsWith("/partner") && pathname !== "/partner-about") || pathname?.startsWith("/vet");
    const isAdminPage = pathname?.startsWith("/admin");
    const isProductPage = pathname?.startsWith("/product/");

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {!isAuthPage && !isPartnerPage && !isAdminPage && <Header />}
            <main style={{ flex: 1 }}>
                {children}
            </main>
            {!isAuthPage && !isPartnerPage && !isAdminPage && <Footer />}
            {!isAuthPage && !isPartnerPage && !isAdminPage && <MobileNav />}
        </div>
    );
}
