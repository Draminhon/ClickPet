"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { Minus, Plus, ChevronUp, ChevronDown, QrCode, Upload } from 'lucide-react';
import { maskPhone, maskPrice, maskCPF, maskCNPJ, maskZip } from '@/utils/masks';
import MapPicker from '@/components/ui/MapPicker';
import ImageCropModal from '@/components/modals/ImageCropModal';

// ... (InputContainer, WorkingHoursToggle, TimeSelector omitted)
// I'll re-add the imports correctly

const InputContainer = ({ label, value, onChange, type = "text", selector = false, onIncrement, onDecrement, placeholder = "", width = '450px', error = false }: any) => (
    <div style={{ marginBottom: '24px', width: width === '100%' ? '100%' : 'auto' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#757575', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 500 }}>{label}</label>
        <div style={{ 
            width: width, 
            height: '52px', 
            borderRadius: '8px', 
            border: error ? '1.5px solid #FF4D4D' : '1px solid #D1D9E2', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 16px',
            position: 'relative',
            background: 'white',
            transition: 'all 0.2s',
            boxShadow: error ? '0 0 0 1px rgba(255, 77, 77, 0.1)' : 'none'
        }}>
            <input 
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{ 
                    border: 'none', 
                    outline: 'none', 
                    width: selector ? 'calc(100% - 70px)' : '100%',
                    fontSize: '14px', 
                    color: '#253D4E',
                    background: 'transparent'
                }} 
            />
            {selector && (
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                    <button 
                        type="button"
                        onClick={onDecrement}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                        <Minus size={16} color="#757575" />
                    </button>
                    <button 
                        type="button"
                        onClick={onIncrement}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                        <Plus size={16} color="#757575" />
                    </button>
                </div>
            )}
        </div>
        {error && <span style={{ color: '#FF4D4D', fontSize: '11px', marginTop: '6px', display: 'block', fontWeight: 500, letterSpacing: '0.02em' }}>CAMPO OBRIGATÓRIO</span>}
    </div>
);

const WorkingHoursToggle = ({ active, onToggle }: any) => (
    <button 
        onClick={onToggle}
        type="button"
        style={{ 
            width: '44px', 
            height: '24px', 
            borderRadius: '12px', 
            background: active ? '#3BB77E' : '#D1D9E2', 
            border: 'none', 
            cursor: 'pointer', 
            position: 'relative',
            transition: 'background 0.3s',
            display: 'flex',
            alignItems: 'center',
            padding: '2px'
        }}
    >
        <div style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            background: 'white', 
            position: 'absolute',
            left: active ? '22px' : '2px',
            transition: 'left 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }} />
    </button>
);

const TimeSelector = ({ value, onChange }: any) => {
    const handleIncrement = () => {
        let [hours, minutes] = value.split(':').map(Number);
        let newMinutes = minutes + 15;
        let newHours = hours;
        if (newMinutes >= 60) {
            newMinutes = 0;
            newHours = (hours + 1) % 24;
        }
        onChange(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
    };

    const handleDecrement = () => {
        let [hours, minutes] = value.split(':').map(Number);
        let newMinutes = minutes - 15;
        let newHours = hours;
        if (newMinutes < 0) {
            newMinutes = 45;
            newHours = (hours - 1 + 24) % 24;
        }
        onChange(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
    };

    return (
        <div style={{ 
            width: '180px', 
            height: '46px', 
            borderRadius: '8px', 
            border: '1px solid #D1D9E2', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 12px',
            background: 'none',
            position: 'relative'
        }}>
            <input 
                type="time" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                style={{ 
                    border: 'none', 
                    outline: 'none', 
                    width: 'calc(100% - 30px)', 
                    fontSize: '13px', 
                    fontWeight: 400,
                    color: '#253D4E',
                    background: 'transparent'
                }}
            />
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginLeft: 'auto',
                height: '100%',
                gap: '2px'
            }}>
                <button 
                    type="button"
                    onClick={handleIncrement}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                    <ChevronUp size={14} color="#757575" />
                </button>
                <button 
                    type="button"
                    onClick={handleDecrement}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                    <ChevronDown size={14} color="#757575" />
                </button>
            </div>
        </div>
    );
};

const WelcomeModal = ({ onClose }: { onClose: () => void }) => (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease'
    }}>
        <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '48px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: '#253D4E', 
                marginBottom: '16px' 
            }}>
                Bem-vindo ao ClickPet!
            </h2>
            <p style={{ 
                fontSize: '16px', 
                color: '#757575', 
                lineHeight: '1.6', 
                marginBottom: '32px' 
            }}>
                Para que seu petshop seja completamente registrado e apareça para os clientes, 
                precisamos que você informe alguns dados básicos de localização e contato.
            </p>
            <button 
                onClick={onClose}
                style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '10px',
                    backgroundColor: '#3BB77E',
                    color: 'white',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#35a570')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#3BB77E')}
            >
                VAMOS COMEÇAR
            </button>
        </div>
        <style jsx>{`
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
);

export default function PartnerSettings() {
    const pathname = usePathname();
    const { data: session, update } = useSession();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<any>(null);
    const [showKeyTypeDropdown, setShowKeyTypeDropdown] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [formData, setFormData] = useState({
        // ... (state preserved)
        cnpj: '',
        phone: '',
        specialization: '',
        shopLogo: '',
        bannerImage: '',
        minimumOrderValue: '0',
        deliveryRadius: '10',
        deliveryFeePerKm: '2',
        freeDeliveryMinimum: '0',
        workingHours: [
            { day: 'Segunda-feira', active: true, open: '08:00', close: '18:00' },
            { day: 'Terça-feira', active: true, open: '08:00', close: '18:00' },
            { day: 'Quarta-feira', active: true, open: '08:00', close: '18:00' },
            { day: 'Quinta-feira', active: true, open: '08:00', close: '18:00' },
            { day: 'Sexta-feira', active: true, open: '08:00', close: '18:00' },
            { day: 'Sábado', active: true, open: '08:00', close: '12:00' },
            { day: 'Domingo', active: false, open: '08:00', close: '12:00' },
        ],
        paymentConfig: {
            creditCard: true,
            debitCard: true,
            cash: true,
        },
        paymentMethodsTable: [
            { method: 'CARTÃO DE CRÉDITO', fee: '2,50', term: '30 DIAS' },
            { method: 'CARTÃO DE DÉBITO', fee: '1,50', term: '1 DIA' },
            { method: 'PIX', fee: '0,00', term: 'IMEDIATO' },
        ],
        pixConfig: {
            keyType: 'CPF',
            key: '',
            beneficiary: '',
            dynamicPix: false
        },
        address: {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            zip: '',
            coordinates: {
                lat: -23.550520,
                lng: -46.633308
            }
        }
    });

    const [cropConfig, setCropConfig] = useState<{ 
        isOpen: boolean; 
        image: string; 
        type: 'shopLogo' | 'bannerImage'; 
        aspect: number;
        title: string;
    }>({
        isOpen: false,
        image: '',
        type: 'shopLogo',
        aspect: 1,
        title: ''
    });

    useEffect(() => {
        // Toggle welcome modal if profile is incomplete AND not dismissed for THIS user
        if (session?.user?.id) {
            const isDismissed = localStorage.getItem(`clickpet_welcome_dismissed_${session.user.id}`) === 'true';
            if (!session.user.isProfileComplete && !isDismissed) {
                setShowWelcomeModal(true);
            }
        }

        if (hasLoaded) return;

        fetch('/api/profile')
            .then(res => res.json())
            .then(data => {
                const formatted = {
                    cnpj: data.cnpj ? maskCNPJ(data.cnpj) : '',
                    phone: data.phone ? maskPhone(data.phone) : '',
                    specialization: data.specialization || '',
                    shopLogo: data.shopLogo || '',
                    bannerImage: data.bannerImage || '',
                    minimumOrderValue: data.minimumOrderValue?.toFixed(2).replace('.', ',') || '0,00',
                    deliveryRadius: data.deliveryRadius?.toString() || '10',
                    deliveryFeePerKm: data.deliveryFeePerKm?.toFixed(2).replace('.', ',') || '2,00',
                    freeDeliveryMinimum: data.freeDeliveryMinimum?.toFixed(2).replace('.', ',') || '0,00',
                    workingHours: data.workingHours?.length > 0 ? data.workingHours : formData.workingHours,
                    paymentConfig: {
                        creditCard: data.paymentConfig?.creditCard ?? formData.paymentConfig.creditCard,
                        debitCard: data.paymentConfig?.debitCard ?? formData.paymentConfig.debitCard,
                        cash: data.paymentConfig?.cash ?? formData.paymentConfig.cash
                    },
                    paymentMethodsTable: data.paymentMethods?.length > 0 
                        ? data.paymentMethods.map((m: any) => ({
                             method: m.method,
                             fee: (m.fee || 0).toFixed(2).replace('.', ','),
                             term: m.term
                          })) 
                        : formData.paymentMethodsTable,
                    pixConfig: {
                        keyType: data.pixConfig?.keyType || formData.pixConfig.keyType,
                        key: data.pixConfig?.key || '',
                        beneficiary: data.pixConfig?.beneficiary || '',
                        dynamicPix: data.pixConfig?.dynamicPix ?? formData.pixConfig.dynamicPix
                    },
                    address: {
                        street: data.address?.street || '',
                        number: data.address?.number || '',
                        neighborhood: data.address?.neighborhood || '',
                        city: data.address?.city || '',
                        state: data.address?.state || '',
                        zip: data.address?.zip ? maskZip(data.address.zip) : '',
                        coordinates: {
                            lat: data.address?.coordinates?.coordinates?.[1] ?? -23.550520,
                            lng: data.address?.coordinates?.coordinates?.[0] ?? -46.633308
                        }
                    },
                };
                setInitialData(formatted);
                setFormData(formatted);
                setHasLoaded(true);
            });
    }, [session, hasLoaded]);

    // Draft persistence
    useEffect(() => {
        if (!hasLoaded) return;
        const draft = localStorage.getItem('partner_settings_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                // Only load draft if it's more recent than the database load or if we want to restore incomplete work
                // For simplicity, we'll ask later or just merge. Let's just save for now.
            } catch (e) {}
        }
    }, [hasLoaded]);

    useEffect(() => {
        if (hasLoaded) {
            localStorage.setItem('partner_settings_draft', JSON.stringify(formData));
        }
    }, [formData, hasLoaded]);

    const handleDiscard = () => {
        if (initialData) {
            setFormData(initialData);
            showToast('Alterações descartadas');
        }
    };

    const handleLocalImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'shopLogo' | 'bannerImage') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Increased to 2MB to allow original high-res before crop
                showToast('A imagem original deve ter no máximo 2MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setCropConfig({
                    isOpen: true,
                    image: reader.result as string,
                    type: field,
                    aspect: field === 'shopLogo' ? 1 : 1920 / 300,
                    title: field === 'shopLogo' ? 'Ajustar Foto de Perfil' : 'Ajustar Banner da Vitrine'
                });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropConfirm = (croppedImage: string) => {
        setFormData({ ...formData, [cropConfig.type]: croppedImage });
        setCropConfig({ ...cropConfig, isOpen: false });
        showToast('Imagem ajustada com sucesso!');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const errors: string[] = [];
        const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
        
        if (!cleanCNPJ) {
            errors.push('cnpj');
        } else if (cleanCNPJ.length < 14) {
            errors.push('cnpj');
        }

        if (!formData.phone || formData.phone.length < 14) errors.push('phone');
        if (!formData.specialization) errors.push('specialization');
        if (!formData.address.street) errors.push('street');
        if (!formData.address.number) errors.push('number');
        if (!formData.address.city) errors.push('city');
        if (!formData.address.neighborhood) errors.push('neighborhood');
        if (!formData.address.zip || formData.address.zip.length < 9) errors.push('zip');

        if (errors.length > 0) {
            setValidationErrors(errors);
            showToast('Por favor, preencha todos os campos obrigatórios', 'error');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setValidationErrors([]);
        setLoading(true);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cnpj: formData.cnpj.replace(/\D/g, ''),
                    phone: formData.phone,
                    specialization: formData.specialization,
                    shopLogo: formData.shopLogo,
                    bannerImage: formData.bannerImage,
                    minimumOrderValue: parseFloat(formData.minimumOrderValue.replace(',', '.')),
                    deliveryRadius: parseFloat(formData.deliveryRadius),
                    deliveryFeePerKm: parseFloat(formData.deliveryFeePerKm.replace(',', '.')),
                    freeDeliveryMinimum: parseFloat(formData.freeDeliveryMinimum.replace(',', '.')),
                    workingHours: formData.workingHours,
                    paymentConfig: formData.paymentConfig,
                    paymentMethodsTable: formData.paymentMethodsTable,
                    pixConfig: formData.pixConfig,
                    address: {
                        ...formData.address,
                        coordinates: {
                            type: 'Point',
                            coordinates: [formData.address.coordinates.lng, formData.address.coordinates.lat]
                        }
                    },
                }),
            });

            if (res.ok) {
                showToast('Informações atualizadas com sucesso!');
                localStorage.removeItem('partner_settings_draft');
                setInitialData(formData);
                await update();
            } else {
                showToast('Erro ao atualizar informações', 'error');
            }
        } catch (error) {
            showToast('Erro ao atualizar informações', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateValue = (field: keyof typeof formData, delta: number, isPrice = false) => {
        setFormData(prev => {
            if (field === 'workingHours') return prev;
            let valStr = prev[field].toString().replace(',', '.');
            let val = parseFloat(valStr) || 0;
            val = Math.max(0, val + delta);
            return {
                ...prev,
                [field]: isPrice ? val.toFixed(2).replace('.', ',') : val.toString()
            };
        });
    };

    const toggleDay = (index: number) => {
        const newHours = [...formData.workingHours];
        newHours[index].active = !newHours[index].active;
        setFormData({ ...formData, workingHours: newHours });
    };

    const updateTime = (index: number, field: 'open' | 'close', value: string) => {
        const newHours = [...formData.workingHours];
        newHours[index][field] = value;
        setFormData({ ...formData, workingHours: newHours });
    };

    return (
        <div style={{ padding: '32px', background: 'white', minHeight: '100vh' }}>
            {showWelcomeModal && (
                <WelcomeModal 
                    onClose={() => {
                        if (session?.user?.id) {
                            localStorage.setItem(`clickpet_welcome_dismissed_${session.user.id}`, 'true');
                        }
                        setShowWelcomeModal(false);
                    }} 
                />
            )}
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <h1 style={{ fontSize: '14px', color: '#253D4E', fontWeight: 400, margin: 0, letterSpacing: '0.05em' }}>CONFIGURAÇÕES</h1>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                        onClick={handleDiscard}
                        style={{ 
                            width: '200px', 
                            height: '48px', 
                            borderRadius: '8px', 
                            border: '1px solid #D1D9E2', 
                            background: 'white', 
                            color: '#253D4E', 
                            fontSize: '14px', 
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        DESCARTAR
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ 
                            width: '280px', 
                            height: '48px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            background: '#3BB77E', 
                            color: '#F9FBFD', 
                            fontSize: '14px', 
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'SALVANDO...' : 'SALVAR INFORMAÇÕES'}
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '64px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#253D4E', marginBottom: '32px' }}>IDENTIDADE VISUAL</h2>
                <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
                    {/* Logo Upload */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#757575', marginBottom: '12px' }}>FOTO DE PERFIL (200X200)</label>
                        <label style={{
                            width: '150px',
                            height: '150px',
                            border: '2px dashed #D1D9E2',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#F9FBFD'
                        }}>
                            {formData.shopLogo ? (
                                <img src={formData.shopLogo} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <Upload size={24} color="#757575" />
                                    <span style={{ fontSize: '11px', color: '#757575', marginTop: '8px', fontWeight: 500 }}>UPLOAD LOGO</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleLocalImageChange(e, 'shopLogo')} style={{ display: 'none' }} />
                        </label>
                    </div>

                    {/* Banner Upload */}
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#757575', marginBottom: '12px' }}>BANNER DA VITRINE (1920X300)</label>
                        <label style={{
                            width: '100%',
                            height: '150px',
                            border: '2px dashed #D1D9E2',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#F9FBFD'
                        }}>
                            {formData.bannerImage ? (
                                <img src={formData.bannerImage} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <Upload size={24} color="#757575" />
                                    <span style={{ fontSize: '11px', color: '#757575', marginTop: '8px', fontWeight: 500 }}>UPLOAD BANNER</span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleLocalImageChange(e, 'bannerImage')} style={{ display: 'none' }} />
                        </label>
                        <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>Padrão wide recomendado para melhor visualização em computadores.</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '64px', marginBottom: '64px' }}>
                {/* Left Column: Business Info */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#253D4E', marginBottom: '32px' }}>INFORMAÇÕES DO NEGÓCIO</h2>
                    
                    <InputContainer 
                        label={<>TELEFONE <span style={{ color: '#FF4D4D' }}>*</span></>}
                        value={formData.phone}
                        onChange={(e: any) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        error={validationErrors.includes('phone')}
                    />

                    <InputContainer 
                        label={<>ESPECIFICAÇÃO DA LOJA <span style={{ color: '#FF4D4D' }}>*</span></>}
                        value={formData.specialization}
                        onChange={(e: any) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="Ex: Casa da Ração, Petshop, Aquarismo, etc."
                        error={validationErrors.includes('specialization')}
                    />

                    <InputContainer 
                        label={<>CNPJ DA LOJA <span style={{ color: '#FF4D4D' }}>*</span></>}
                        value={formData.cnpj}
                        onChange={(e: any) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                        placeholder="00.000.000/0000-00"
                        error={validationErrors.includes('cnpj')}
                    />

                    <InputContainer 
                        label="VALOR MÍNIMO DO PEDIDO (R$)"
                        value={formData.minimumOrderValue}
                        onChange={(e: any) => setFormData({ ...formData, minimumOrderValue: maskPrice(e.target.value) })}
                        selector={true}
                        onIncrement={() => updateValue('minimumOrderValue', 1, true)}
                        onDecrement={() => updateValue('minimumOrderValue', -1, true)}
                        placeholder="0,00"
                    />
                </div>

                {/* Right Column: Delivery Config */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#253D4E', marginBottom: '32px' }}>CONFIGURAÇÃO DE ENTREGA</h2>

                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <InputContainer 
                                label="RAIO DE ENTREGA (KM)"
                                value={formData.deliveryRadius}
                                onChange={(e: any) => setFormData({ ...formData, deliveryRadius: e.target.value.replace(/\D/g, '') })}
                                selector={true}
                                onIncrement={() => updateValue('deliveryRadius', 1)}
                                onDecrement={() => updateValue('deliveryRadius', -1)}
                                width="100%"
                                placeholder="0"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <InputContainer 
                                label="TAXA POR KM (R$)"
                                value={formData.deliveryFeePerKm}
                                onChange={(e: any) => setFormData({ ...formData, deliveryFeePerKm: maskPrice(e.target.value) })}
                                selector={true}
                                onIncrement={() => updateValue('deliveryFeePerKm', 0.5, true)}
                                onDecrement={() => updateValue('deliveryFeePerKm', -0.5, true)}
                                width="100%"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <InputContainer 
                        label="FRETE GRÁTIS ACIMA DE (R$)"
                        value={formData.freeDeliveryMinimum}
                        onChange={(e: any) => setFormData({ ...formData, freeDeliveryMinimum: maskPrice(e.target.value) })}
                        selector={true}
                        onIncrement={() => updateValue('freeDeliveryMinimum', 5, true)}
                        onDecrement={() => updateValue('freeDeliveryMinimum', -5, true)}
                        width="100%"
                        placeholder="0,00"
                    />
                </div>
            </div>

            {/* Working Hours Section */}
            <div>
                <h3 style={{ fontSize: '12px', fontWeight: 400, color: '#253D4E', marginBottom: '24px' }}>HORÁRIO DE FUNCIONAMENTO</h3>
                
                <div style={{ 
                    border: '1px solid #D1D9E2', 
                    borderRadius: '10px', 
                    background: '#F9FBFD', 
                    overflow: 'hidden',
                    padding: '0 24px'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D9E2' }}>
                                <th style={{ padding: '24px 0', fontSize: '12px', fontWeight: 700, color: '#757575' }}>DIA DA SEMANA</th>
                                <th style={{ padding: '24px 0', fontSize: '12px', fontWeight: 700, color: '#757575', width: '120px' }}>STATUS</th>
                                <th style={{ padding: '24px 0', fontSize: '12px', fontWeight: 700, color: '#757575', width: '200px' }}>ABERTURA</th>
                                <th style={{ padding: '24px 0', fontSize: '12px', fontWeight: 700, color: '#757575', width: '200px' }}>FECHAMENTO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.workingHours.map((row, index) => (
                                <tr key={row.day} style={{ borderBottom: index === formData.workingHours.length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                                    <td style={{ 
                                        padding: '24px 0', 
                                        fontSize: '12px', 
                                        fontWeight: 400, 
                                        color: row.active ? '#253D4E' : '#909090' 
                                    }}>
                                        {row.day.toUpperCase()}
                                    </td>
                                    <td style={{ padding: '24px 0' }}>
                                        <WorkingHoursToggle 
                                            active={row.active} 
                                            onToggle={() => toggleDay(index)} 
                                        />
                                    </td>
                                    <td style={{ padding: '24px 0' }}>
                                        <TimeSelector 
                                            value={row.open} 
                                            onChange={(val: string) => updateTime(index, 'open', val)} 
                                        />
                                    </td>
                                    <td style={{ padding: '24px 0' }}>
                                        <TimeSelector 
                                            value={row.close} 
                                            onChange={(val: string) => updateTime(index, 'close', val)} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Options Section */}
            <div style={{ marginTop: '64px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 400, color: '#253D4E', marginBottom: '32px' }}>OPÇÕES DE PAGAMENTO</h3>
                
                <div style={{ display: 'flex', gap: '64px', alignItems: 'flex-start' }}>
                    {/* Column 1: Accepted Methods */}
                    <div style={{ width: '450px' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#253D4E', marginBottom: '24px' }}>MÉTODOS ACEITOS</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            {[
                                { id: 'creditCard', label: 'CARTÃO DE CRÉDITO' },
                                { id: 'debitCard', label: 'CARTÃO DE DÉBITO' },
                                { id: 'cash', label: 'DINHEIRO' }
                            ].map((method) => (
                                <div key={method.id} style={{ 
                                    width: '450px', 
                                    height: '64px', 
                                    borderRadius: '10px', 
                                    border: '1px solid #D1D9E2', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '0 20px',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontSize: '14px', fontWeight: 400, color: '#253D4E' }}>{method.label}</span>
                                    <WorkingHoursToggle 
                                        active={(formData.paymentConfig as any)[method.id]} 
                                        onToggle={() => setFormData({
                                            ...formData,
                                            paymentConfig: {
                                                ...formData.paymentConfig,
                                                [method.id]: !(formData.paymentConfig as any)[method.id]
                                            }
                                        })} 
                                    />
                                </div>
                            ))}
                        </div>

                        <div style={{ 
                            width: '450px', 
                            height: '238px', 
                            borderRadius: '10px', 
                            border: '1px solid #D1D9E2', 
                            background: 'white',
                            overflow: 'hidden'
                        }}>
                            <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D9E2' }}>
                                        <th style={{ padding: '24px', fontSize: '13px', fontWeight: 700, color: '#253D4E' }}>MÉTODO</th>
                                        <th style={{ padding: '24px', fontSize: '13px', fontWeight: 700, color: '#253D4E' }}>TAXA</th>
                                        <th style={{ padding: '24px', fontSize: '13px', fontWeight: 700, color: '#253D4E' }}>PRAZO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.paymentMethodsTable.map((row, index) => (
                                        <tr key={row.method} style={{ borderBottom: index === formData.paymentMethodsTable.length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                                            <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 400, color: '#253D4E' }}>{row.method}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 400, color: '#253D4E' }}>{row.fee}%</td>
                                            <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 400, color: '#253D4E' }}>{row.term}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Column 2: Receipt Config */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#253D4E', marginBottom: '32px' }}>CONFIGURAÇÃO DE RECEBIMENTO</h4>
                        
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 400, color: '#757575', marginBottom: '8px' }}>TIPO DE CHAVE</label>
                                <div 
                                    onClick={() => setShowKeyTypeDropdown(!showKeyTypeDropdown)}
                                    style={{ 
                                        height: '52px', 
                                        borderRadius: '8px', 
                                        border: '1px solid #D1D9E2', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0 16px',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        background: 'white'
                                    }}
                                >
                                    <span style={{ fontSize: '14px', fontWeight: 400, color: '#757575' }}>{formData.pixConfig.keyType}</span>
                                    <ChevronDown size={16} color="#757575" />
                                </div>
                                {showKeyTypeDropdown && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '100%', 
                                        left: 0, 
                                        right: 0, 
                                        background: 'white', 
                                        border: '1px solid #D1D9E2', 
                                        borderRadius: '8px', 
                                        marginTop: '4px', 
                                        zIndex: 10,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        {['CPF', 'CNPJ', 'TELEFONE', 'E-MAIL', 'CHAVE ALEATÓRIA'].map((type) => (
                                            <div 
                                                key={type}
                                                onClick={() => {
                                                    setFormData({ ...formData, pixConfig: { ...formData.pixConfig, keyType: type, key: '' } });
                                                    setShowKeyTypeDropdown(false);
                                                }}
                                                style={{ padding: '12px 16px', fontSize: '13px', color: '#757575', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FBFD')}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                {type}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 400, color: '#757575', marginBottom: '8px' }}>CHAVE PIX</label>
                                <div style={{ 
                                    height: '52px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #D1D9E2', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '0 16px'
                                }}>
                                    <input 
                                        type="text"
                                        value={formData.pixConfig.key}
                                        onChange={(e) => {
                                            const type = formData.pixConfig.keyType;
                                            let val = e.target.value;
                                            if (type === 'CPF') val = maskCPF(val);
                                            else if (type === 'CNPJ') val = maskCNPJ(val);
                                            else if (type === 'TELEFONE') val = maskPhone(val);
                                            
                                            setFormData({
                                                ...formData,
                                                pixConfig: { ...formData.pixConfig, key: val }
                                            });
                                        }}
                                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#757575', background: 'transparent' }}
                                        placeholder={
                                            formData.pixConfig.keyType === 'CPF' ? '000.000.000-00' :
                                            formData.pixConfig.keyType === 'CNPJ' ? '00.000.000/0000-00' :
                                            formData.pixConfig.keyType === 'TELEFONE' ? '(00) 00000-0000' :
                                            formData.pixConfig.keyType === 'E-MAIL' ? 'exemplo@email.com' : 'Sua Chave Aleatória'
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 400, color: '#757575', marginBottom: '8px' }}>NOME DO BENIFICIÁRIO (COMO APARECE NO BANCO)</label>
                            <div style={{ 
                                height: '52px', 
                                borderRadius: '8px', 
                                border: '1px solid #D1D9E2', 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '0 16px'
                            }}>
                                <input 
                                    type="text"
                                    value={formData.pixConfig.beneficiary}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        pixConfig: { ...formData.pixConfig, beneficiary: e.target.value }
                                    })}
                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#757575', background: 'transparent' }}
                                    placeholder="NOME COMPLETO OU RAZÃO SOCIAL"
                                />
                            </div>
                        </div>

                        {/* Dynamic Pix Integration Banner */}
                        <div style={{ 
                            width: '100%', 
                            height: '108px', 
                            borderRadius: '10px', 
                            border: '1px solid #D1D9E2', 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '0 24px',
                            gap: '24px'
                        }}>
                            <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <QrCode size={48} color="#253D4E" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#253D4E' }}>INTEGRAÇÃO PIX DINÂMICO</span>
                                    <WorkingHoursToggle 
                                        active={formData.pixConfig.dynamicPix} 
                                        onToggle={() => setFormData({
                                            ...formData,
                                            pixConfig: { ...formData.pixConfig, dynamicPix: !formData.pixConfig.dynamicPix }
                                        })} 
                                    />
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: 400, color: '#757575', margin: 0, textTransform: 'uppercase', lineHeight: '1.4' }}>
                                    QUANDO ATIVADO, O SISTEMA GERA UM QR CODE ÚNICO PARA CADA PEDIDO, 
                                    PERMITINDO A CONCILIAÇÃO AUTOMÁTICA DO PAGAMENTO SEM NECESSIDADE 
                                    DE ENVIO DE COMPROVANTE PELO CLIENTE
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address Section */}
                <div style={{ marginTop: '64px', marginBottom: '64px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 400, color: '#253D4E', marginBottom: '32px' }}>ENDEREÇO</h3>
                    
                    <div style={{ display: 'flex', gap: '64px' }}>
                        {/* Column 1: Form */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Row 1: Street and Number */}
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ flex: 3 }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 400, color: '#757575', marginBottom: '8px' }}>
                                        RUA <span style={{ color: '#FF4D4D' }}>*</span>
                                    </label>
                                    <div style={{ 
                                        height: '52px', 
                                        borderRadius: '8px', 
                                        border: validationErrors.includes('street') ? '1.5px solid #FF4D4D' : '1px solid #D1D9E2', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0 16px',
                                        background: 'white',
                                        boxShadow: validationErrors.includes('street') ? '0 0 0 1px rgba(255, 77, 77, 0.1)' : 'none'
                                    }}>
                                        <input 
                                            type="text"
                                            value={formData.address.street}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, street: e.target.value }
                                            })}
                                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#253D4E', background: 'transparent' }}
                                            placeholder="NOME DA RUA / AVENIDA"
                                        />
                                    </div>
                                    {validationErrors.includes('street') && <span style={{ color: '#FF4D4D', fontSize: '10px', marginTop: '4px', display: 'block', fontWeight: 500 }}>Campo Obrigatório</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 400, color: '#757575', marginBottom: '8px' }}>
                                        NÚMERO <span style={{ color: '#FF4D4D' }}>*</span>
                                    </label>
                                    <div style={{ 
                                        height: '52px', 
                                        borderRadius: '8px', 
                                        border: validationErrors.includes('number') ? '1.5px solid #FF4D4D' : '1px solid #D1D9E2', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0 16px',
                                        background: 'white',
                                        boxShadow: validationErrors.includes('number') ? '0 0 0 1px rgba(255, 77, 77, 0.1)' : 'none'
                                    }}>
                                        <input 
                                            type="text"
                                            value={formData.address.number}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, number: e.target.value }
                                            })}
                                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#253D4E', background: 'transparent' }}
                                            placeholder="S/N"
                                        />
                                    </div>
                                    {validationErrors.includes('number') && <span style={{ color: '#FF4D4D', fontSize: '10px', marginTop: '4px', display: 'block', fontWeight: 500 }}>Campo Obrigatório</span>}
                                </div>
                            </div>

                            {/* Row 2: Neighborhood and City */}
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 400, color: '#757575', marginBottom: '8px' }}>
                                        BAIRRO <span style={{ color: '#FF4D4D' }}>*</span>
                                    </label>
                                    <div style={{ 
                                        height: '52px', 
                                        borderRadius: '8px', 
                                        border: validationErrors.includes('neighborhood') ? '1.5px solid #FF4D4D' : '1px solid #D1D9E2', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0 16px',
                                        background: 'white',
                                        boxShadow: validationErrors.includes('neighborhood') ? '0 0 0 1px rgba(255, 77, 77, 0.1)' : 'none'
                                    }}>
                                        <input 
                                            type="text"
                                            value={formData.address.neighborhood}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, neighborhood: e.target.value }
                                            })}
                                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#253D4E', background: 'transparent' }}
                                            placeholder="NOME DO BAIRRO"
                                        />
                                    </div>
                                    {validationErrors.includes('neighborhood') && <span style={{ color: '#FF4D4D', fontSize: '10px', marginTop: '4px', display: 'block', fontWeight: 500 }}>Campo Obrigatório</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 400, color: '#757575', marginBottom: '8px' }}>
                                        CIDADE <span style={{ color: '#FF4D4D' }}>*</span>
                                    </label>
                                    <div style={{ 
                                        height: '52px', 
                                        borderRadius: '8px', 
                                        border: validationErrors.includes('city') ? '1.5px solid #FF4D4D' : '1px solid #D1D9E2', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0 16px',
                                        background: 'white',
                                        boxShadow: validationErrors.includes('city') ? '0 0 0 1px rgba(255, 77, 77, 0.1)' : 'none'
                                    }}>
                                        <input 
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, city: e.target.value }
                                            })}
                                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#253D4E', background: 'transparent' }}
                                            placeholder="NOME DA CIDADE"
                                        />
                                    </div>
                                    {validationErrors.includes('city') && <span style={{ color: '#FF4D4D', fontSize: '10px', marginTop: '4px', display: 'block', fontWeight: 500 }}>Campo Obrigatório</span>}
                                </div>
                            </div>

                            {/* Row 3: CEP */}
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 400, color: '#757575', marginBottom: '8px' }}>
                                        CEP <span style={{ color: '#FF4D4D' }}>*</span>
                                    </label>
                                    <div style={{ 
                                        height: '52px', 
                                        borderRadius: '8px', 
                                        border: validationErrors.includes('zip') ? '1.5px solid #FF4D4D' : '1px solid #D1D9E2', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0 16px',
                                        background: 'white',
                                        boxShadow: validationErrors.includes('zip') ? '0 0 0 1px rgba(255, 77, 77, 0.1)' : 'none'
                                    }}>
                                        <input 
                                            type="text"
                                            value={formData.address.zip}
                                            onChange={async (e) => {
                                                const zip = maskZip(e.target.value);
                                                
                                                setFormData(prev => ({
                                                    ...prev,
                                                    address: { ...prev.address, zip: zip }
                                                }));
 
                                                if (zip.length === 9) {
                                                    try {
                                                        const res = await fetch(`https://viacep.com.br/ws/${zip.replace(/\D/g, '')}/json/`);
                                                        const data = await res.json();
                                                        if (!data.erro) {
                                                            const street = data.logradouro;
                                                            const city = data.localidade;
                                                            const state = data.uf;
                                                            const neighborhood = data.bairro;
                                                            
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                address: {
                                                                    ...prev.address,
                                                                    street: street || prev.address.street,
                                                                    city: city || prev.address.city,
                                                                    state: state || prev.address.state,
                                                                    neighborhood: neighborhood || prev.address.neighborhood
                                                                }
                                                            }));
 
                                                            // Geocoding to center map
                                                            try {
                                                                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${street}, ${city}, ${state}, Brasil`)}`);
                                                                const geoData = await geoRes.json();
                                                                if (geoData && geoData.length > 0) {
                                                                    const { lat, lon } = geoData[0];
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        address: {
                                                                            ...prev.address,
                                                                            coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) }
                                                                        }
                                                                    }));
                                                                }
                                                            } catch (geoErr) {
                                                                console.error('Geocoding error:', geoErr);
                                                            }
                                                        } else {
                                                            showToast('CEP não encontrado', 'error');
                                                        }
                                                    } catch (error) {
                                                        console.error('Error fetching CEP:', error);
                                                        showToast('Erro ao buscar CEP', 'error');
                                                    }
                                                }
                                            }}
                                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#253D4E', background: 'transparent' }}
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    {validationErrors.includes('zip') && <span style={{ color: '#FF4D4D', fontSize: '10px', marginTop: '4px', display: 'block', fontWeight: 500 }}>Campo Obrigatório</span>}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Map */}
                        <div style={{ flex: 1 }}>
                            <MapPicker 
                                lat={formData.address.coordinates.lat}
                                lng={formData.address.coordinates.lng}
                                onLocationChange={async (lat, lng) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        address: {
                                            ...prev.address,
                                            coordinates: { lat, lng }
                                        }
                                    }));

                                    // Reverse Geocoding
                                    try {
                                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                                        const data = await res.json();
                                        
                                        if (data.address) {
                                            const street = data.address.road || data.address.pedestrian || data.address.suburb || '';
                                            const number = data.address.house_number || '';
                                            const city = data.address.city || data.address.town || data.address.village || data.address.municipality || '';
                                            let postcode = data.address.postcode || data.address.zip || '';
                                            
                                            // Fallback 1: Try to extract CEP from display_name if postcode is missing
                                            if (!postcode && data.display_name) {
                                                const cepMatch = data.display_name.match(/(\d{5}-\d{3})|(\d{8})/);
                                                if (cepMatch) postcode = cepMatch[0];
                                            }

                                            // Fallback 2: Viacep search by address (Brazil specific)
                                            if (!postcode) {
                                                const uf = data.address["ISO3166-2-lvl4"]?.split('-')[1];
                                                const streetSearch = data.address.road || data.address.pedestrian;
                                                const citySearch = data.address.city || data.address.town || data.address.village;

                                                if (uf && citySearch && streetSearch) {
                                                    try {
                                                        const viacepRes = await fetch(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(citySearch)}/${encodeURIComponent(streetSearch)}/json/`);
                                                        const viacepData = await viacepRes.json();
                                                        if (Array.isArray(viacepData) && viacepData.length > 0) {
                                                            postcode = viacepData[0].cep;
                                                        }
                                                    } catch (vErr) {
                                                        console.error('Viacep fallback error:', vErr);
                                                    }
                                                }
                                            }

                                            const zip = postcode ? maskZip(postcode) : '';
                                            const neighborhood = data.address.suburb || data.address.neighbourhood || data.address.city_district || '';
                                            console.log('Reverse Geocode Result:', { address: data.address, zip, neighborhood, postcodeSource: postcode ? 'found' : 'missing' });
 
                                            setFormData(prev => ({
                                                ...prev,
                                                address: {
                                                    ...prev.address,
                                                    street: street || prev.address.street,
                                                    number: number || prev.address.number,
                                                    city: city || prev.address.city,
                                                    state: data.address.state || prev.address.state,
                                                    zip: zip || prev.address.zip,
                                                    neighborhood: neighborhood || prev.address.neighborhood
                                                }
                                            }));
                                        }
                                    } catch (error) {
                                        console.error('Reverse geocoding error:', error);
                                    }
                                }}
                                height="250px"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Save Button */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    padding: '48px 0', 
                    marginTop: '48px',
                    borderTop: '1px solid #F0F0F0'
                }}>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ 
                            width: '280px', 
                            height: '48px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            background: '#3BB77E', 
                            color: '#F9FBFD', 
                            fontSize: '14px', 
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.7 : 1,
                            boxShadow: '0 4px 12px rgba(59, 183, 126, 0.2)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#35a570')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#3BB77E')}
                    >
                        {loading ? 'SALVANDO...' : 'SALVAR INFORMAÇÕES'}
                    </button>
                </div>
            {/* Image Crop Modal */}
            {cropConfig.isOpen && (
                <ImageCropModal
                    image={cropConfig.image}
                    aspect={cropConfig.aspect}
                    title={cropConfig.title}
                    onClose={() => setCropConfig({ ...cropConfig, isOpen: false })}
                    onConfirm={handleCropConfirm}
                />
            )}
            </div>
        </div>
    );
}

