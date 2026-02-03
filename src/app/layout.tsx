import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import AuthProvider from "@/context/AuthProvider";

const sora = Sora({ subsets: ["latin"] });

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
            <body className={sora.className}>
                <AuthProvider>
                    <ToastProvider>
                        <CartProvider>
                            <ConditionalLayout>
                                {children}
                            </ConditionalLayout>
                        </CartProvider>
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
