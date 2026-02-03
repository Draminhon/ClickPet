"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

import { maskCNPJ } from '@/utils/masks';

export default function Register() {
    const router = useRouter();
    const [role, setRole] = useState<'customer' | 'partner'>('customer');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        cnpj: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (e.target.name === 'cnpj') {
            value = maskCNPJ(value);
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    // Quick fix for input mapping, better to use name attribute
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (e.target.name === 'cnpj') {
            value = maskCNPJ(value);
        }
        setFormData({ ...formData, [e.target.name]: value });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role }),
            });

            if (res.ok) {
                router.push('/login');
            } else {
                const data = await res.json();
                setError(data.message);
            }
        } catch (err) {
            setError('Ocorreu um erro. Tente novamente.');
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <Link href="/" className={styles.logo}>
                    CLICK<span>PET</span> 🐾
                </Link>

                <h1 className={styles.title}>Crie sua conta</h1>

                <div className={styles.roleSelector}>
                    <button
                        className={`${styles.roleBtn} ${role === 'customer' ? styles.active : ''}`}
                        onClick={() => setRole('customer')}
                    >
                        Sou Cliente
                    </button>
                    <button
                        className={`${styles.roleBtn} ${role === 'partner' ? styles.active : ''}`}
                        onClick={() => setRole('partner')}
                    >
                        Sou Petshop
                    </button>
                </div>

                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <input
                            name="name"
                            type="text"
                            placeholder="Nome Completo"
                            className={styles.input}
                            onChange={handleInput}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <input
                            name="email"
                            type="email"
                            placeholder="E-mail"
                            className={styles.input}
                            onChange={handleInput}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <input
                            name="password"
                            type="password"
                            placeholder="Senha"
                            className={styles.input}
                            onChange={handleInput}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <input
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirmar Senha"
                            className={styles.input}
                            onChange={handleInput}
                            required
                        />
                    </div>
                    {role === 'partner' && (
                        <div className={styles.inputGroup}>
                            <input
                                name="cnpj"
                                type="text"
                                placeholder="CNPJ"
                                className={styles.input}
                                value={formData.cnpj}
                                onChange={handleInput}
                                required
                                maxLength={18}
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                        Cadastrar
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>ou</span>
                </div>

                <p className={styles.footer}>
                    Já tem conta? <Link href="/login" className={styles.link}>Entrar</Link>
                </p>
            </div>
        </div>
    );
}
