"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import MobileNav from "./MobileNav";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/register";

    return (
        <>
            {!isAuthPage && <Header />}
            {children}
            {!isAuthPage && <MobileNav />}
        </>
    );
}
