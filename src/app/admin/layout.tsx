"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, CreditCard, Users, LogOut } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (session?.user?.role !== 'admin') {
            // Add debug info to redirect
            console.log('AdminLayout redirecting: role mismatch', session?.user?.role);
            router.push('/?error=client_admin_redirect&role=' + (session?.user?.role || 'undefined'));
        }
    }, [session, status, router]);

    if (status === 'loading' || !session || session.user.role !== 'admin') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
            {/* Sidebar */}
            <aside style={{
                width: '250px',
                background: 'linear-gradient(135deg, #6CC551 0%, #5AB03F 100%)',
                color: 'white',
                padding: '2rem 0',
                boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>ClickPet Admin</h1>
                    <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>{session.user.email}</p>
                </div>

                <nav>
                    <Link href="/admin" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem 1.5rem',
                        color: 'white',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>

                    <Link href="/admin/subscriptions" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem 1.5rem',
                        color: 'white',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <CreditCard size={20} />
                        <span>Assinaturas</span>
                    </Link>

                    <Link href="/admin/partners" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem 1.5rem',
                        color: 'white',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <Users size={20} />
                        <span>Petshops</span>
                    </Link>

                    <button
                        onClick={() => router.push('/api/auth/signout')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.5rem',
                            color: 'white',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'background 0.2s',
                            marginTop: '2rem',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem' }}>
                {children}
            </main>
        </div>
    );
}
