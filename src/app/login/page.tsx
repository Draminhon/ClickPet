"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import styles from './login.module.css';

const carouselImages = [
    '/assets/login-carosel/login_carosel1.png',
    '/assets/login-carosel/login_carosel2.jpg',
    '/assets/login-carosel/login_carosel3.jpg'
];

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false
            });

            if (result?.error) {
                showToast(result.error, 'error');
            } else {
                showToast('Login realizado com sucesso!');
                router.push('/');
            }
        } catch (error) {
            showToast('Erro ao realizar login', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
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
                            transition: 'opacity 0.8s ease-in-out'
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

            <div className={styles.formColumn}>
                <div className={styles.topSection}>
                    <h1 className={styles.title}>ClickPet</h1>
                    <p className={styles.subtitle}>Crie uma conta e aproveite nossas inumera ofertas pra você</p>

                    <form className={styles.form} onSubmit={handleContinue}>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputLabel}>Email</div>
                            <input
                                type="email"
                                placeholder="Exemplo@gmail.com"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <div className={styles.inputLabel}>Senha</div>
                            <input
                                type="password"
                                placeholder="Sua senha"
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className={styles.continueButton} disabled={loading}>
                            <span className={styles.continueText}>
                                {loading ? 'Carregando...' : 'CONTINUAR'}
                            </span>
                        </button>
                    </form>
                </div>

                <div className={styles.dividerContainer}>
                    <div className={styles.divider}></div>
                    <span className={styles.dividerText}>Ou</span>
                    <div className={styles.divider}></div>
                </div>

                <div className={styles.bottomSection}>
                    <div className={styles.socialContainer}>
                        <button className={styles.socialButton} onClick={() => signIn('google')}>
                            <Image src="/assets/google2.png" alt="Google" width={28} height={28} className={styles.socialIcon} />
                            <span className={styles.socialText}>Entre com Google</span>
                        </button>
                        <button className={styles.socialButton} onClick={() => signIn('facebook')}>
                            <Image src="/assets/facebook2.png" alt="Facebook" width={28} height={28} className={styles.socialIcon} />
                            <span className={styles.socialText}>Entre com Facebook</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
