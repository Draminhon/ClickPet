"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MapPicker from '@/components/ui/MapPicker';
import VetSidebar from '@/components/layout/VetSidebar';
import ImageCropModal from '@/components/modals/ImageCropModal';
import { Camera, MapPin, MessageCircle, FileText, User, Tag, Image as ImageIcon, CheckCircle, Settings } from 'lucide-react';
import Image from 'next/image';
import { maskPhone } from '@/utils/masks';
import styles from './VetDashboard.module.css';

export default function VetDashboard() {
    const { data: session, update: updateSession } = useSession();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    
    // Cropping state
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropTarget, setCropTarget] = useState<'image' | 'bannerImage'>('image');
    const [tempImage, setTempImage] = useState<string>('');
    const [cropAspect, setCropAspect] = useState(1);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        whatsapp: '',
        crmv: '',
        specialization: '',
        image: '',
        bannerImage: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zip: '',
            lat: -23.550520,
            lng: -46.633308
        }
    });

    useEffect(() => {
        if (session && loading) {
            fetchProfile();
        }
    }, [session, loading]);

    // Warning for unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Check for incomplete profile to show welcome modal
    useEffect(() => {
        if (!loading && session?.user) {
            const isComplete = (session.user as any).isProfileComplete;
            const hasSeenModal = sessionStorage.getItem('vet_welcome_modal_seen');
            
            // Local check to see if current formData is also complete
            const isLocalComplete = !!(
                formData.crmv && 
                formData.specialization && 
                formData.whatsapp && 
                formData.address.street && 
                formData.address.city && 
                formData.address.zip
            );

            if (isComplete === false && !isLocalComplete && !hasSeenModal) {
                setShowWelcomeModal(true);
            } else if (isLocalComplete) {
                // If they just filled everything, hide it
                setShowWelcomeModal(false);
            }
        }
    }, [loading, session, formData]);

    const handleCloseWelcomeModal = () => {
        setShowWelcomeModal(false);
        sessionStorage.setItem('vet_welcome_modal_seen', 'true');
    };

    const fetchProfile = async () => {
        if (!loading && !isDirty) setLoading(true);
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            
            setFormData({
                name: data.name || '',
                bio: data.bio || '',
                whatsapp: data.whatsapp || '',
                crmv: data.crmv || '',
                specialization: data.specialization || '',
                image: data.image || '',
                bannerImage: data.bannerImage || '',
                address: {
                    street: data.address?.street || '',
                    number: data.address?.number || '',
                    complement: data.address?.complement || '',
                    neighborhood: data.address?.neighborhood || '',
                    city: data.address?.city || '',
                    state: data.address?.state || '',
                    zip: data.address?.zip || '',
                    lat: data.address?.coordinates?.coordinates?.[1] || -23.550520,
                    lng: data.address?.coordinates?.coordinates?.[0] || -46.633308
                }
            });
            setIsDirty(false);
        } catch (error) {
            showToast('Erro ao carregar perfil', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMapLocationChange = async (lat: number, lng: number) => {
        // Update coordinates first
        handleInputChange('address.lat', lat);
        handleInputChange('address.lng', lng);

        // Reverse geocoding
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pt-BR`);
            const data = await response.json();

            if (data.address) {
                const newFields = {
                    'address.street': data.address.road || data.address.pedestrian || '',
                    'address.neighborhood': data.address.suburb || data.address.neighbourhood || '',
                    'address.city': data.address.city || data.address.town || data.address.village || '',
                    'address.state': data.address.state || '',
                    'address.zip': data.address.postcode || ''
                };

                setFormData(prev => {
                    let updated = { ...prev };
                    Object.entries(newFields).forEach(([key, val]) => {
                        if (val) { // Only update if we found something
                            const [parent, child] = key.split('.');
                            (updated as any)[parent] = {
                                ...(updated as any)[parent],
                                [child]: val
                            };
                        }
                    });
                    return updated;
                });
                setIsDirty(true);
                showToast('Endereço atualizado pelo mapa', 'success');
            }
        } catch (error) {
            console.error('Error in reverse geocoding:', error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'bannerImage') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('A imagem deve ter no máximo 5MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setCropTarget(field);
                setCropAspect(field === 'image' ? 1 : 3 / 1);
                setCropModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropConfirm = (croppedImage: string) => {
        setFormData(prev => ({ ...prev, [cropTarget]: croppedImage }));
        setIsDirty(true);
        setCropModalOpen(false);
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return {
                    ...prev,
                    [parent]: {
                        ...(prev as any)[parent],
                        [child]: value
                    }
                };
            }
            return { ...prev, [field]: value };
        });
        setIsDirty(true);
        // Remove from validation errors as the user types
        if (validationErrors.includes(field)) {
            setValidationErrors(prev => prev.filter(err => err !== field));
        }
    };

    const validateForm = () => {
        const errors: string[] = [];
        if (!formData.name) errors.push('name');
        if (!formData.crmv) errors.push('crmv');
        if (!formData.specialization) errors.push('specialization');
        if (!formData.whatsapp) errors.push('whatsapp');
        if (!formData.address.street) errors.push('address.street');
        if (!formData.address.number) errors.push('address.number');
        if (!formData.address.neighborhood) errors.push('address.neighborhood');
        if (!formData.address.city) errors.push('address.city');
        if (!formData.address.zip) errors.push('address.zip');
        
        setValidationErrors(errors);
        return errors;
    };

    const handleSave = async () => {
        const errors = validateForm();
        
        if (errors.length > 0) {
            showToast('Preencha os campos obrigatórios marcados em vermelho.', 'error');
            
            // Switch to the correct tab for the first error
            const firstError = errors[0];
            if (firstError.startsWith('address')) {
                setActiveTab('location');
            } else {
                setActiveTab('profile');
            }
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                address: {
                    ...formData.address,
                    coordinates: {
                        type: 'Point',
                        coordinates: [formData.address.lng, formData.address.lat]
                    }
                }
            };

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                showToast('Perfil atualizado com sucesso!', 'success');
                setIsDirty(false);
                // Refresh session to update isProfileComplete status
                updateSession();
            } else {
                const errData = await res.json();
                throw new Error(errData.message || 'Falha ao salvar');
            }
        } catch (error: any) {
            showToast(error.message || 'Erro ao salvar alterações', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>Carregando seu consultório...</div>;

    return (
        <div className={styles.layoutContainer}>
            <VetSidebar 
                user={{
                    name: formData.name || session?.user?.name || 'Veterinário',
                    image: formData.image || session?.user?.image || undefined,
                    role: 'veterinarian'
                }}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <main className={styles.mainContent}>
                <div className={styles.dashboardContainer}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <div>
                            <h1 className={styles.title}>
                                {activeTab === 'overview' && 'Painel Geral'}
                                {activeTab === 'profile' && 'Meu Perfil Profissional'}
                                {activeTab === 'location' && 'Localização do Consultório'}
                            </h1>
                            <p style={{ color: '#7E7E7E', fontSize: '14px', marginTop: '5px' }}>
                                Gerencie suas informações e visibilidade na plataforma.
                            </p>
                        </div>
                        {isDirty && <span className={styles.unsavedBadge}>Alterações não salvas</span>}
                    </div>

                    <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
                        <div className={styles.overviewGrid}>
                            <div className={styles.profileSection} style={{ marginBottom: '60px' }}>
                                {/* Banner AREA */}
                                <div className={styles.bannerWrapper}>
                                    {formData.bannerImage ? (
                                        <Image 
                                            src={formData.bannerImage} 
                                            alt="Banner da Clínica" 
                                            fill 
                                            className={styles.bannerImage}
                                            priority
                                        />
                                    ) : (
                                        <div className={styles.bannerPlaceholder}>
                                            <ImageIcon size={48} strokeWidth={1.5} />
                                            <span className={styles.placeholderTitle}>Banner da Clínica</span>
                                            <span className={styles.placeholderSubtitle}>Ideal: 1200x400 (3:1)</span>
                                        </div>
                                    )}
                                </div>

                                {/* Avatar AREA */}
                                <div className={styles.avatarWrapper} style={{ cursor: 'default' }}>
                                    {formData.image ? (
                                        <Image 
                                            src={formData.image} 
                                            alt="Sua Foto" 
                                            fill 
                                            className={styles.avatarImage} 
                                        />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            <User size={40} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.card} style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Resumo Profissional</h3>
                                    <button className={styles.saveButton} style={{ width: 'auto', marginTop: 0, padding: '10px 20px' }} onClick={() => setActiveTab('profile')}>
                                        Editar Perfil
                                    </button>
                                </div>
                                <div className={styles.infoList}>
                                    <div className={styles.infoBox}>
                                        <label className={styles.label}>Nome/Clínica</label>
                                        <p>{formData.name || 'Não informado'}</p>
                                    </div>
                                    <div className={styles.infoBox}>
                                        <label className={styles.label}>CRMV</label>
                                        <p>{formData.crmv || 'Não informado'}</p>
                                    </div>
                                    <div className={styles.infoBox}>
                                        <label className={styles.label}>Especialidade</label>
                                        <p>{formData.specialization || 'Não informado'}</p>
                                    </div>
                                    <div className={styles.infoBox}>
                                        <label className={styles.label}>WhatsApp</label>
                                        <p>{formData.whatsapp || 'Não informado'}</p>
                                    </div>
                                </div>
                                <div className={styles.infoBox} style={{ marginTop: '15px' }}>
                                    <label className={styles.label}>Biografia</label>
                                    <p style={{ fontWeight: 'normal', color: '#7E7E7E', lineHeight: '1.6' }}>{formData.bio || 'Biografia não cadastrada.'}</p>
                                </div>
                            </div>

                            <div className={styles.card} style={{ marginTop: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Localização Cadastrada</h3>
                                    <button className={styles.saveButton} style={{ width: 'auto', marginTop: 0, padding: '10px 20px', backgroundColor: '#F8F9FA', color: '#253D4E', border: '1px solid #ECECEC' }} onClick={() => setActiveTab('location')}>
                                        Alterar Endereço
                                    </button>
                                </div>
                                <div className={styles.infoBox}>
                                    <label className={styles.label}>Endereço Completo</label>
                                    <p>
                                        {formData.address.street}, {formData.address.number}
                                        {formData.address.complement && ` - ${formData.address.complement}`}
                                        <br />
                                        {formData.address.neighborhood} - {formData.address.city} / {formData.address.state}
                                        <br />
                                        CEP: {formData.address.zip}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
                        <div className={styles.formGrid}>
                            <div className={styles.leftCol}>
                                <div className={styles.card}>
                                    <h3 className={styles.sectionTitle}><FileText size={20} /> Sobre Você</h3>
                                    
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Nome Profissional/Clínica</label>
                                        <input 
                                            className={`${styles.input} ${validationErrors.includes('name') ? styles.inputError : ''}`} 
                                            value={formData.name}
                                            onChange={e => handleInputChange('name', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>CRMV</label>
                                        <input 
                                            className={`${styles.input} ${validationErrors.includes('crmv') ? styles.inputError : ''}`} 
                                            placeholder="Ex: 12345-SP"
                                            value={formData.crmv}
                                            onChange={e => handleInputChange('crmv', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Especialidade Principal</label>
                                        <input 
                                            className={`${styles.input} ${validationErrors.includes('specialization') ? styles.inputError : ''}`} 
                                            placeholder="Ex: Dermatologia, Ortopedia"
                                            value={formData.specialization}
                                            onChange={e => handleInputChange('specialization', e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Mini Biografia</label>
                                        <textarea 
                                            className={styles.textarea}
                                            placeholder="Conte um pouco sobre sua formação..."
                                            value={formData.bio}
                                            onChange={e => handleInputChange('bio', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.rightCol}>
                                <div className={styles.card}>
                                    <h3 className={styles.sectionTitle}><ImageIcon size={20} /> Fotos do Perfil</h3>
                                    <div className={styles.settingsImageGrid} style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
                                        <div className={styles.imageEditCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px' }}>
                                            <label className={styles.label}>Foto de Perfil</label>
                                            <div className={styles.avatarPreviewGroup} style={{ flexDirection: 'column', gap: '10px' }}>
                                                <div className={styles.avatarCircle} style={{ width: '100px', height: '100px' }}>
                                                    {formData.image ? <Image src={formData.image} alt="Avatar" fill /> : <User size={50} />}
                                                </div>
                                                <label className={styles.uploadBtn} style={{ padding: '6px 15px', fontSize: '12px' }}>
                                                    Alterar Foto
                                                    <input type="file" hidden accept="image/*" onChange={e => handleImageChange(e, 'image')} />
                                                </label>
                                            </div>
                                        </div>

                                        <div className={styles.imageEditCard} style={{ padding: '15px' }}>
                                            <label className={styles.label}>Banner da Clínica</label>
                                            <div className={styles.bannerPreviewGroup} style={{ marginTop: '10px' }}>
                                                <div className={styles.bannerRect} style={{ height: '80px' }}>
                                                    {formData.bannerImage ? <Image src={formData.bannerImage} alt="Banner" fill /> : <ImageIcon size={30} />}
                                                </div>
                                                <label className={styles.uploadBtn} style={{ padding: '6px 15px', fontSize: '12px' }}>
                                                    Alterar Banner
                                                    <input type="file" hidden accept="image/*" onChange={e => handleImageChange(e, 'bannerImage')} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.card}>
                                    <h3 className={styles.sectionTitle}><MessageCircle size={20} /> Contato</h3>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>WhatsApp Professional</label>
                                        <input 
                                            className={`${styles.input} ${validationErrors.includes('whatsapp') ? styles.inputError : ''}`} 
                                            placeholder="(11) 99999-9999"
                                            value={formData.whatsapp}
                                            onChange={e => handleInputChange('whatsapp', maskPhone(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <button 
                                    className={styles.saveButton}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: activeTab === 'location' ? 'block' : 'none' }}>
                        <div className={styles.formGrid}>
                            <div className={styles.leftCol}>
                                <div className={styles.card}>
                                    <h3 className={styles.sectionTitle}><MapPin size={20} /> Endereço do Consultório</h3>
                                    
                                    <div className={styles.addressGrid}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>CEP</label>
                                            <input 
                                                className={`${styles.input} ${validationErrors.includes('address.zip') ? styles.inputError : ''}`} 
                                                placeholder="00000-000"
                                                value={formData.address.zip}
                                                onChange={e => handleInputChange('address.zip', e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Estado (UF)</label>
                                            <input 
                                                className={styles.input} 
                                                placeholder="SP"
                                                value={formData.address.state}
                                                onChange={e => handleInputChange('address.state', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.addressGrid}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Logradouro (Rua/Av)</label>
                                            <input 
                                                className={`${styles.input} ${validationErrors.includes('address.street') ? styles.inputError : ''}`} 
                                                placeholder="Rua, Av..."
                                                value={formData.address.street}
                                                onChange={e => handleInputChange('address.street', e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Número</label>
                                            <input 
                                                className={`${styles.input} ${validationErrors.includes('address.number') ? styles.inputError : ''}`} 
                                                placeholder="123"
                                                value={formData.address.number}
                                                onChange={e => handleInputChange('address.number', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.addressGrid}>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Bairro</label>
                                            <input 
                                                className={`${styles.input} ${validationErrors.includes('address.neighborhood') ? styles.inputError : ''}`} 
                                                placeholder="Bairro"
                                                value={formData.address.neighborhood}
                                                onChange={e => handleInputChange('address.neighborhood', e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Cidade</label>
                                            <input 
                                                className={`${styles.input} ${validationErrors.includes('address.city') ? styles.inputError : ''}`} 
                                                placeholder="Cidade"
                                                value={formData.address.city}
                                                onChange={e => handleInputChange('address.city', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Complemento</label>
                                        <input 
                                            className={styles.input} 
                                            placeholder="Ex: Sala 2, Bloco A"
                                            value={formData.address.complement}
                                            onChange={e => handleInputChange('address.complement', e.target.value)}
                                        />
                                    </div>
                                    
                                    <button 
                                        className={styles.saveButton}
                                        onClick={handleSave}
                                        disabled={saving}
                                        style={{ marginTop: '10px' }}
                                    >
                                        {saving ? 'SALVANDO...' : 'SALVAR LOCALIZAÇÃO'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.rightCol}>
                                <div className={styles.card} style={{ padding: '15px' }}>
                                    <p style={{ fontSize: '13px', color: '#7E7E7E', marginBottom: '10px' }}>
                                        <CheckCircle size={14} style={{ color: '#3BB77E', verticalAlign: 'middle', marginRight: '5px' }} />
                                        Clique no mapa para preencher o endereço automaticamente.
                                    </p>
                                    <MapPicker 
                                        lat={formData.address.lat}
                                        lng={formData.address.lng}
                                        onLocationChange={handleMapLocationChange}
                                        height="400px"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {cropModalOpen && (
                <ImageCropModal
                    image={tempImage}
                    aspect={cropAspect}
                    title={`Ajustar ${cropTarget === 'image' ? 'Foto de Perfil' : 'Banner da Clínica'}`}
                    onClose={() => setCropModalOpen(false)}
                    onConfirm={handleCropConfirm}
                />
            )}

            {showWelcomeModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.welcomeModal}>
                        <div className={styles.welcomeIcon}>
                            <User size={40} />
                        </div>
                        <h2>Bem-vindo ao ClickPet!</h2>
                        <p>
                            Ficamos felizes em ter você conosco. Para começar a aparecer para os clientes próximos a você, 
                            <strong> você precisa completar o seu cadastro profissional e de localização.</strong>
                        </p>
                        <div className={styles.welcomeSteps}>
                            <div className={styles.step}>
                                <div className={styles.stepNum}>1</div>
                                <span>Preencha seus dados profissionais (CRMV, Bio, WhatsApp)</span>
                            </div>
                            <div className={styles.step}>
                                <div className={styles.stepNum}>2</div>
                                <span>Configure o endereço do seu consultório no mapa</span>
                            </div>
                        </div>
                        <button 
                            className={styles.welcomeBtn}
                            onClick={() => {
                                handleCloseWelcomeModal();
                                setActiveTab('profile');
                            }}
                        >
                            Completar Meu Cadastro
                        </button>
                        <button 
                            className={styles.welcomeSecondaryBtn}
                            onClick={handleCloseWelcomeModal}
                        >
                            Fazer isso mais tarde
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
