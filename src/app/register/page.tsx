"use client";

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './Register.module.css';
import { maskCNPJ } from '@/utils/masks';
import { useToast } from '@/context/ToastContext';

const carouselImages = [
    '/assets/login-carosel/login_carosel1.png',
    '/assets/login-carosel/login_carosel2.jpg',
    '/assets/login-carosel/login_carosel3.jpg'
];

export default function Register() {
    const router = useRouter();
    const { showToast } = useToast();
    const [role, setRole] = useState<'customer' | 'partner'>('customer');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        cnpj: '',
    });
    const [loading, setLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'cnpj' ? maskCNPJ(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            showToast('As senhas não coincidem.', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role }),
            });

            if (res.ok) {
                showToast('Conta criada com sucesso! Faça login para continuar.');
                router.push('/login');
            } else {
                const data = await res.json();
                showToast(data.message || 'Erro ao realizar cadastro', 'error');
            }
        } catch (err) {
            showToast('Ocorreu um erro. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.registerContainer}>
            {/* Left Column: Carousel */}
            <div className={styles.carouselColumn}>
                {carouselImages.map((src, index) => (
                    <div
                        key={src}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: index === currentImageIndex ? 1 : 0,
                            transition: 'opacity 1s ease-in-out'
                        }}
                    >
                        <Image
                            src={src}
                            alt={`Carousel ${index + 1}`}
                            fill
                            className={styles.carouselSlide}
                            priority={index === 0}
                        />
                    </div>
                ))}
            </div>

            {/* Right Column: Form */}
            <div className={styles.formColumn}>
                <div className={styles.topSection}>
                    <Link href="/" className={styles.title} style={{ color: '#3BB77E', fontWeight: 800, textDecoration: 'none' }}>
                        ClickPet<span style={{ color: '#253D4E' }}>.</span>
                    </Link>
                    <h1 className={styles.title} style={{ marginTop: 0 }}>Crie sua conta</h1>
                    <p className={styles.subtitle}>Junte-se a nós e aproveite o melhor para o seu pet</p>

                    <div className={styles.roleSelector}>
                        <button
                            type="button"
                            className={`${styles.roleBtn} ${role === 'customer' ? styles.active : ''}`}
                            onClick={() => setRole('customer')}
                        >
                            Sou Cliente
                        </button>
                        <button
                            type="button"
                            className={`${styles.roleBtn} ${role === 'partner' ? styles.active : ''}`}
                            onClick={() => setRole('partner')}
                        >
                            Sou Petshop
                        </button>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>
                                {role === 'partner' ? 'Nome do Petshop' : 'Nome Completo'}
                            </label>
                            <input
                                name="name"
                                type="text"
                                placeholder={role === 'partner' ? 'Meu Petshop' : 'Seu nome'}
                                className={styles.input}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>E-mail</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="exemplo@email.com"
                                className={styles.input}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.inputLabel}>Senha</label>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className={styles.input}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup} style={{ flex: 1 }}>
                                <label className={styles.inputLabel}>Confirmar</label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className={styles.input}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {role === 'partner' && (
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>CNPJ</label>
                                <input
                                    name="cnpj"
                                    type="text"
                                    placeholder="00.000.000/0000-00"
                                    className={styles.input}
                                    value={formData.cnpj}
                                    onChange={handleChange}
                                    required
                                    maxLength={18}
                                />
                            </div>
                        )}

                        <button type="submit" className={styles.continueButton} disabled={loading}>
                            <span className={styles.continueText}>
                                {loading ? 'CADASTRANDO...' : 'CRIAR CONTA'}
                            </span>
                        </button>
                    </form>
                </div>

                <div className={styles.dividerContainer}>
                    <div className={styles.divider}></div>
                    <span className={styles.dividerText}>ou</span>
                    <div className={styles.divider}></div>
                </div>

                <div className={styles.bottomSection} style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <div className={styles.socialContainer}>
                        <button className={styles.socialButton} onClick={() => signIn('google')}>
                            <Image src="/assets/google2.png" alt="Google" width={28} height={28} className={styles.socialIcon} />
                            <span className={styles.socialText}>Cadastre-se com Google</span>
                        </button>
                        <button className={styles.socialButton} onClick={() => signIn('facebook')}>
                            <Image src="/assets/facebook2.png" alt="Facebook" width={28} height={28} className={styles.socialIcon} />
                            <span className={styles.socialText}>Cadastre-se com Facebook</span>
                        </button>
                    </div>

                    <p className={styles.footer} style={{ marginTop: '24px' }}>
                        Já tem uma conta? <Link href="/login" className={styles.link}>Faça login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
