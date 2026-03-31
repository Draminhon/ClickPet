"use client";

import { SessionProvider } from "next-auth/react";
import AuthRedirect from "@/components/auth/AuthRedirect";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthRedirect />
            {children}
        </SessionProvider>
    );
}
