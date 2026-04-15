"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, User, MapPin, Phone, Award, Calendar, FileText, MessageCircle } from 'lucide-react';
import styles from './ClinicProfile.module.css';

interface VetProfile {
    _id: string;
    name: string;
    image?: string;
    bannerImage?: string;
    specialization?: string;
    bio?: string;
    whatsapp?: string;
    crmv?: string;
    address?: {
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
    workingHours?: any[];
    createdAt?: string;
}

export default function ClinicProfilePage() {
    const params = useParams();
    const id = params.id as string;
    const [vet, setVet] = useState<VetProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetch(`/api/veterinarians/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Not found');
                    return res.json();
                })
                .then(data => setVet(data))
                .catch(() => setVet(null))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const whatsappLink = vet?.whatsapp
        ? `https://wa.me/${vet.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vi seu perfil no ClickPet e gostaria de agendar uma consulta.')}`
        : '#';

    const fullAddress = vet?.address
        ? [
            vet.address.street,
            vet.address.number,
            vet.address.complement,
            vet.address.neighborhood,
            `${vet.address.city || ''}/${vet.address.state || ''}`,
            vet.address.zip ? `CEP: ${vet.address.zip}` : ''
        ].filter(Boolean).join(', ')
        : null;

    const memberSince = vet?.createdAt
        ? new Date(vet.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : null;

    if (loading) {
        return (
            <div className={styles.profilePage}>
                <div className={styles.loading}>Carregando perfil...</div>
            </div>
        );
    }

    if (!vet) {
        return (
            <div className={styles.profilePage}>
                <div className={styles.notFound}>
                    <h2>Veterinário não encontrado</h2>
                    <p>O perfil que você está procurando não existe ou foi removido.</p>
                    <Link href="/veterinarios" style={{ color: '#3BB77E', fontWeight: 600, marginTop: '10px' }}>
                        ← Voltar para a lista
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.profilePage}>
            {/* Back button */}
            <div className={styles.topBar}>
                <Link href="/veterinarios" className={styles.backButton}>
                    <ArrowLeft size={18} />
                    Voltar para a lista
                </Link>
            </div>

            {/* Profile Card - contains everything including banner */}
            <div className={styles.profileContainer}>
                <div className={styles.profileCard}>
                    {/* Banner INSIDE card */}
                    <div className={styles.bannerSection}>
                        {vet.bannerImage ? (
                            <Image src={vet.bannerImage} alt="Banner" fill className={styles.bannerImage} priority />
                        ) : null}
                    </div>

                    {/* Header with avatar */}
                    <div className={styles.profileHeader}>
                        <div className={styles.avatarWrapper}>
                            {vet.image ? (
                                <Image src={vet.image} alt={vet.name} fill className={styles.avatarImage} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <User size={50} />
                                </div>
                            )}
                        </div>
                        <div className={styles.headerInfo}>
                            <h1 className={styles.vetName}>{vet.name}</h1>
                            <div className={styles.specialization}>
                                {vet.specialization || 'Médico(a) Veterinário(a)'}
                            </div>
                            {vet.crmv && (
                                <div className={styles.crmvBadge}>
                                    <Award size={14} />
                                    CRMV: {vet.crmv}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className={styles.profileBody}>
                        {/* Bio */}
                        {vet.bio && (
                            <>
                                <h3 className={styles.sectionTitle}>
                                    <FileText size={20} />
                                    Sobre o profissional
                                </h3>
                                <p className={styles.bioText}>{vet.bio}</p>
                                <hr className={styles.divider} />
                            </>
                        )}

                        {/* Info Grid */}
                        <h3 className={styles.sectionTitle}>
                            <Award size={20} />
                            Informações
                        </h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <div className={`${styles.infoIcon} ${styles.green}`}>
                                    <Award size={22} />
                                </div>
                                <div>
                                    <div className={styles.infoLabel}>Especialidade</div>
                                    <div className={styles.infoValue}>{vet.specialization || 'Clínica Geral'}</div>
                                </div>
                            </div>

                            {vet.crmv && (
                                <div className={styles.infoItem}>
                                    <div className={`${styles.infoIcon} ${styles.blue}`}>
                                        <FileText size={22} />
                                    </div>
                                    <div>
                                        <div className={styles.infoLabel}>CRMV</div>
                                        <div className={styles.infoValue}>{vet.crmv}</div>
                                    </div>
                                </div>
                            )}

                            {vet.whatsapp && (
                                <div className={styles.infoItem}>
                                    <div className={`${styles.infoIcon} ${styles.orange}`}>
                                        <Phone size={22} />
                                    </div>
                                    <div>
                                        <div className={styles.infoLabel}>Contato</div>
                                        <div className={styles.infoValue}>{vet.whatsapp}</div>
                                    </div>
                                </div>
                            )}

                            {memberSince && (
                                <div className={styles.infoItem}>
                                    <div className={`${styles.infoIcon} ${styles.purple}`}>
                                        <Calendar size={22} />
                                    </div>
                                    <div>
                                        <div className={styles.infoLabel}>Membro desde</div>
                                        <div className={styles.infoValue}>{memberSince}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Address */}
                        {fullAddress && (
                            <>
                                <hr className={styles.divider} />
                                <h3 className={styles.sectionTitle}>
                                    <MapPin size={20} />
                                    Localização
                                </h3>
                                <div className={styles.addressSection}>
                                    <p className={styles.addressText}>{fullAddress}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* CTA - WhatsApp */}
                    <div className={styles.ctaSection}>
                        <h3 className={styles.ctaTitle}>Entre em contato</h3>
                        <p className={styles.ctaSubtitle}>
                            Agende uma consulta ou tire suas dúvidas diretamente pelo WhatsApp.
                        </p>
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.whatsappButton}
                        >
                            <MessageCircle size={22} />
                            Falar no WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
