"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import MobileNav from "./MobileNav";
import Footer from "./Footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register";

    return (
        <>
            {!isAuthPage && <Header />}
            {children}
            {!isAuthPage && <Footer />}
            {!isAuthPage && <MobileNav />}
        </>
    );
}
