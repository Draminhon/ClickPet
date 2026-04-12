import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { LocationProvider } from "@/context/LocationContext";
import AuthProvider from "@/context/AuthProvider";

const baloo2 = Baloo_2({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "ClickPet - Delivery para Petshops",
    description: "O melhor para o seu amigão, entregue na sua porta.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={baloo2.className}>
                <AuthProvider>
                    <ToastProvider>
                        <CartProvider>
                            <LocationProvider>
                                <ConditionalLayout>
                                    {children}
                                </ConditionalLayout>
                            </LocationProvider>
                        </CartProvider>
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
