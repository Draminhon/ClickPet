import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email e senha obrigatórios");
                }

                await dbConnect();
                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    throw new Error("Usuário não encontrado");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Senha incorreta");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;

                // Fetch subscription data for partners
                if (user.role === 'partner') {
                    await dbConnect();
                    const Subscription = (await import('@/models/Subscription')).default;
                    const subscription = await Subscription.findOne({ partnerId: user.id });

                    if (subscription) {
                        token.subscriptionStatus = subscription.status;
                        token.subscriptionPlan = subscription.plan;
                    }
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.subscriptionStatus = token.subscriptionStatus;
                session.user.subscriptionPlan = token.subscriptionPlan;
            }
            return session;
        },
        async redirect({ url, baseUrl }: any) {
            // Default behavior - allow all redirects
            if (url.startsWith(baseUrl)) return url;
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            return baseUrl;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
