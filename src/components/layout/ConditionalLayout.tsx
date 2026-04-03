"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import MobileNav from "./MobileNav";
import Footer from "./Footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isPartnerPage = pathname?.startsWith("/partner");
    const isAdminPage = pathname?.startsWith("/admin");
    const isProductPage = pathname?.startsWith("/product/");

    return (
        <>
            {!isAuthPage && !isPartnerPage && !isAdminPage && <Header />}
            {children}
            {!isAuthPage && !isPartnerPage && !isAdminPage && <Footer isProductPage={isProductPage} />}
            {!isAuthPage && !isPartnerPage && !isAdminPage && <MobileNav />}
        </>
    );
}
