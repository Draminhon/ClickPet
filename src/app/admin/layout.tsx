"use client";

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, CreditCard, Users, LogOut, PieChart } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

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
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            background: '#F8F9FA',
            fontFamily: 'inherit'
        }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                background: 'linear-gradient(180deg, #253D4E 0%, #1a2a36 100%)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                left: 0,
                top: 0,
                zIndex: 100,
                boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ 
                    padding: '2.5rem 2rem', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '1rem'
                }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <h1 style={{ 
                            fontSize: '1.75rem', 
                            fontWeight: 800, 
                            color: '#3BB77E',
                            margin: 0,
                            letterSpacing: '-0.5px'
                        }}>
                            ClickPet<span style={{ color: 'white' }}>.</span>
                        </h1>
                    </Link>
                    <div style={{ marginTop: '0.5rem', opacity: 0.6, fontSize: '0.8rem', fontWeight: 500 }}>
                        PAINEL ADMINISTRATIVO
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    {[
                        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
                        { href: '/admin/partners', icon: Users, label: 'Petshops' },
                        { href: '/admin/subscriptions', icon: CreditCard, label: 'Assinaturas' },
                        { href: '/admin/reports', icon: PieChart, label: 'Relatórios' },
                    ].map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link 
                                key={item.href}
                                href={item.href} 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.25rem',
                                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                                    background: isActive ? 'rgba(59, 183, 126, 0.15)' : 'transparent',
                                    textDecoration: 'none',
                                    borderRadius: '12px',
                                    marginBottom: '0.5rem',
                                    transition: 'all 0.2s ease',
                                    borderLeft: isActive ? '4px solid #3BB77E' : '4px solid transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                        e.currentTarget.style.color = 'white';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                    }
                                }}
                            >
                                <Icon size={20} style={{ color: isActive ? '#3BB77E' : 'inherit' }} />
                                <span style={{ fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ 
                    padding: '1.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0 0.5rem' }}>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: '#3BB77E',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 700
                        }}>
                            {session.user.email?.[0].toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                Admin
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.5, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {session.user.email}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (confirm('Tem certeza que deseja sair?')) {
                                signOut({ callbackUrl: '/' });
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.85rem 1rem',
                            color: '#FF6B6B',
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            fontWeight: 600
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'}
                    >
                        <LogOut size={18} />
                        <span>Sair da Conta</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ 
                flex: 1, 
                marginLeft: '280px',
                padding: '2.5rem 3rem',
                maxWidth: '1600px'
            }}>
                {children}
            </main>
        </div>
    );
}
