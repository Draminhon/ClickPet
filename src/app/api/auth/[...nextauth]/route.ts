import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import speakeasy from "speakeasy";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                twoFactorCode: { label: "2FA Token", type: "text" },
            },
            async authorize(credentials, req) {
                // Determine IP - safely handle req object
                const ip = (req as any)?.headers?.['x-forwarded-for'] || 
                           (req as any)?.headers?.['x-real-ip'] || 
                           '127.0.0.1';
                
                const { authRateLimiter } = await import("@/lib/rateLimit");
                const rateLimitResult = authRateLimiter.check(ip);
                if (!rateLimitResult.success) {
                    throw new Error("Muitas tentativas. Tente novamente em 5 minutos.");
                }

                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email e senha obrigatórios");
                }

                // Force Strings to prevent NoSQL Operator Injection payloads (e.g. { $gt: "" })
                const emailStr = String(credentials.email);
                const passwordStr = String(credentials.password);

                await dbConnect();
                
                // Exclude encrypted fields initially to prevent lean() decryption issues
                const user: any = await User.findOne({ email: emailStr })
                    .select('-cnpj -phone -address -twoFactorSecret')
                    .lean();

                if (!user) {
                    throw new Error("Email ou senha incorretos");
                }

                if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
                    throw new Error("Conta bloqueada temporariamente. Tente novamente mais tarde.");
                }

                const isPasswordValid = await bcrypt.compare(
                    passwordStr,
                    user.password
                );

                if (!isPasswordValid) {
                    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
                    const updateData: any = { failedLoginAttempts: failedAttempts };
                    if (failedAttempts >= 5) {
                        updateData.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                    }
                    await User.findByIdAndUpdate(user._id, updateData);
                    throw new Error("Email ou senha incorretos");
                }

                if (user.role === 'admin' && user.twoFactorEnabled) {
                    if (!credentials?.twoFactorCode) {
                        throw new Error("Código 2FA obrigatório para administradores");
                    }
                    
                    // Fetch full document without lean() to trigger mongoose-field-encryption decryption
                    const adminDoc = await User.findById(user._id);
                    if (!adminDoc || !adminDoc.twoFactorSecret) {
                        throw new Error("Configuração 2FA inválida no administrador");
                    }

                    const is2faValid = speakeasy.totp.verify({
                        secret: adminDoc.twoFactorSecret,
                        encoding: "base32",
                        token: String(credentials.twoFactorCode),
                        window: 1 // allows 30 seconds drift back/forward
                    });

                    if (!is2faValid) {
                        throw new Error("Código 2FA inválido");
                    }
                }

                await User.findByIdAndUpdate(user._id, {
                    failedLoginAttempts: 0,
                    lockUntil: null
                });

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tokenVersion: user.tokenVersion || 0,
                };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            httpOptions: {
                timeout: 30000,
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }: any) {
            if (account.provider === "google") {
                try {
                    await dbConnect();
                    let dbUser = await User.findOne({ email: user.email });

                    if (!dbUser) {
                        const { cookies } = await import("next/headers");
                        const cookieStore = await cookies();
                        const intent = cookieStore.get('clickpet_register_intent')?.value;
                        const roleToAssign = (intent === 'partner' || intent === 'veterinarian') ? intent : 'customer';

                        dbUser = await User.create({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: roleToAssign
                        });

                        if (roleToAssign === 'partner') {
                            const Subscription = (await import('@/models/Subscription')).default;
                            await Subscription.create({
                                partnerId: dbUser._id,
                                plan: 'free',
                                status: 'active',
                                startDate: new Date(),
                                endDate: new Date(Date.now() + 50 * 365 * 24 * 60 * 60 * 1000), // 50 years
                                amount: 0,
                                features: Subscription.getPlanFeatures('free'),
                            });
                        }
                        cookieStore.delete('clickpet_register_intent');
                    }
                    user.id = dbUser._id.toString();
                    user.role = dbUser.role;
                    return true;
                } catch (error) {
                    console.error("[AUTH] OAuth SignIn Error:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account, trigger }: any) {
            await dbConnect();

            if (user) {
                // Initial Login
                token.lastRefreshed = Date.now();
                if (account && account.provider !== 'credentials') {
                    const dbUser = await User.findOne({ email: user.email }).lean() as any;
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.role = dbUser.role;
                        token.tokenVersion = dbUser.tokenVersion || 0;
                        if (dbUser.role === 'partner') {
                            const Subscription = (await import('@/models/Subscription')).default;
                            const sub = await Subscription.findOne({ partnerId: dbUser._id }).lean() as any;
                            if (sub) {
                                token.subscriptionStatus = sub.status;
                                token.subscriptionPlan = sub.plan;
                            }
                            const a = dbUser.address;
                            token.isProfileComplete = !!(dbUser.cnpj && dbUser.phone && a?.street && a?.number && a?.city && a?.neighborhood && (a?.zip || a?.zipCode));
                        }
                    }
                } else {
                    token.role = user.role;
                    token.id = user.id;
                    token.tokenVersion = user.tokenVersion;
                    if (user.role === 'partner') {
                        const Subscription = (await import('@/models/Subscription')).default;
                        const sub = await Subscription.findOne({ partnerId: user.id }).lean() as any;
                        const dbUser = await User.findById(user.id).lean() as any;
                        if (sub) {
                            token.subscriptionStatus = sub.status;
                            token.subscriptionPlan = sub.plan;
                        }
                        const a = dbUser?.address;
                        token.isProfileComplete = !!(dbUser?.cnpj && dbUser?.phone && a?.street && a?.number && a?.city && a?.neighborhood && (a?.zip || a?.zipCode));
                    }
                }
            } else if (token.id) {
                const now = Date.now();
                // Refresh data if specifically requested or if it's been more than 2 minutes
                const shouldRefreshHeavy = trigger === "update" || (now - (token.lastRefreshed || 0) > 120000);

                try {
                    if (shouldRefreshHeavy) {
                        const dbUser = await User.findById(token.id).select('role tokenVersion subscriptionId address cnpj phone').lean() as any;
                        
                        if (!dbUser) {
                            console.warn(`[AUTH] Session refresh failed: User ${token.id} not found in DB.`);
                            return token; // Stay with existing token data if user disappeared (avoid immediate logout)
                        }

                        // Critical check: if token version changed, the session is definitely invalid
                        if (dbUser.tokenVersion !== undefined && token.tokenVersion !== undefined && dbUser.tokenVersion !== token.tokenVersion) {
                             console.log(`[AUTH] Token version mismatch for ${token.id}. Expecting logout.`);
                             return {} as any; // Trigger logout
                        }

                        token.role = dbUser.role || token.role; // Default back to token role if DB role is missing
                        token.lastRefreshed = now;
                        
                        if (dbUser.role === 'partner') {
                            const Subscription = (await import('@/models/Subscription')).default;
                            const sub = await Subscription.findOne({ partnerId: dbUser._id }).lean() as any;
                            if (sub) {
                                token.subscriptionStatus = sub.status;
                                token.subscriptionPlan = sub.plan;
                            }
                            const a = dbUser.address;
                            token.isProfileComplete = !!(dbUser.cnpj && dbUser.phone && a?.street && a?.number && a?.city && a?.neighborhood && (a?.zip || a?.zipCode));
                        }
                    } else {
                        // Quick check only for token version and role persistence
                        const dbUser = await User.findById(token.id).select('tokenVersion role').lean() as any;
                        if (dbUser) {
                            token.role = dbUser.role || token.role;
                        }
                    }
                } catch (e) {
                    console.error("[AUTH] JWT Refresh Error:", e);
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token.id) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.subscriptionStatus = token.subscriptionStatus;
                session.user.subscriptionPlan = token.subscriptionPlan;
                session.user.isProfileComplete = token.isProfileComplete;
            }
            return session;
        },
        async redirect({ url, baseUrl }: any) {
            return url.startsWith(baseUrl) ? url : url.startsWith('/') ? `${baseUrl}${url}` : baseUrl;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 15 * 60, // 15 minutes
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
