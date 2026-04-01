"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { User, Phone, Upload, Trash2, Plus, LogOut, Pencil, MapPin, Camera, Mail, AlertCircle } from 'lucide-react';
import { maskPhone, maskZip, maskCPF } from '@/utils/masks';
import Image from 'next/image';
import MapPicker from '@/components/ui/MapPicker';
import styles from './Profile.module.css';

export default function ProfilePage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [pets, setPets] = useState<any[]>([]);
    const [showPetForm, setShowPetForm] = useState(false);
    const [formData, setFormData] = useState({
        cpf: '',
        phone: '',
        image: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zip: '',
        },
        deliveryAddresses: [] as any[]
    });
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressForm, setAddressForm] = useState({
        street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '', lat: '', lng: ''
    });
    const [editingPetId, setEditingPetId] = useState<string | null>(null);
    const [petForm, setPetForm] = useState({
        name: '',
        species: 'dog',
        breed: '',
        age: '',
        photo: '',
        gender: '',
        size: '',
        temperament: '',
        medicalNotes: '',
        isVaccinated: false,
    });

    const fetchInitialData = async () => {
        try {
            const profileRes = await fetch('/api/profile');
            const profileData = await profileRes.json();
            setUserData(profileData);
            setFormData({
                cpf: profileData.cpf ? maskCPF(profileData.cpf) : '',
                phone: profileData.phone || '',
                image: profileData.image || '',
                address: profileData.address || { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' },
                deliveryAddresses: Array.isArray(profileData.deliveryAddresses) && profileData.deliveryAddresses.length > 0 
                  ? profileData.deliveryAddresses 
                  : (profileData.address?.street ? [profileData.address] : []),
            });

            const petsRes = await fetch('/api/pets');
            const petsData = await petsRes.json();
            setPets(Array.isArray(petsData) ? petsData : []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Failed to invalidate session remotely", error);
        }
        signOut({ callbackUrl: '/' });
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, phone: maskPhone(e.target.value) });
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, cpf: maskCPF(e.target.value) });
    };

    const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, address: { ...formData.address, zip: maskZip(e.target.value) } });
    };

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast('A imagem deve ter no máximo 2MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setFormData(prev => ({ ...prev, image: base64 }));
                setUploadingImage(true);

                try {
                    const res = await fetch('/api/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64 }),
                    });

                    if (res.ok) {
                        const updatedUser = await res.json();
                        setUserData(updatedUser);
                        showToast('Foto de perfil salva com sucesso!');
                    } else {
                        showToast('Erro ao salvar foto', 'error');
                    }
                } catch (error) {
                    showToast('Erro ao conectar com o servidor', 'error');
                } finally {
                    setUploadingImage(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const bodyData = { 
                ...formData, 
                cpf: formData.cpf.replace(/\D/g, '') 
            };

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUserData(updatedUser);
                setFormData({
                    cpf: updatedUser.cpf ? maskCPF(updatedUser.cpf) : '',
                    phone: updatedUser.phone || '',
                    image: updatedUser.image || '',
                    address: updatedUser.address || { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' },
                    deliveryAddresses: Array.isArray(updatedUser.deliveryAddresses) && updatedUser.deliveryAddresses.length > 0 
                      ? updatedUser.deliveryAddresses 
                      : (updatedUser.address?.street ? [updatedUser.address] : []),
                });
                showToast('Informações atualizadas com sucesso!');
            } else {
                showToast('Erro ao atualizar informações', 'error');
            }
        } catch (error) {
            showToast('Erro ao atualizar informações', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data.address) {
                setAddressForm(prev => ({
                    ...prev,
                    street: data.address.road || data.address.pedestrian || prev.street || '',
                    number: data.address.house_number || prev.number || '',
                    city: data.address.city || data.address.town || data.address.village || prev.city || '',
                    zip: data.address.postcode || prev.zip || '',
                    lat: lat.toString(),
                    lng: lng.toString()
                }));
                showToast('Endereço preenchido automaticamente!');
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        }
    };

    const handleAddAddress = () => {
        if (!addressForm.street || !addressForm.city || !addressForm.zip) {
            showToast('Preencha os campos obrigatórios do endereço (Rua, Cidade, CEP)', 'error');
            return;
        }

        const newAddressEntry = {
            street: addressForm.street,
            number: addressForm.number,
            complement: addressForm.complement,
            neighborhood: addressForm.neighborhood,
            city: addressForm.city,
            state: addressForm.state,
            zip: addressForm.zip,
            coordinates: {
                type: 'Point',
                coordinates: [parseFloat(addressForm.lng || '0'), parseFloat(addressForm.lat || '0')]
            }
        };
        
        const newAddrs = [...formData.deliveryAddresses, newAddressEntry];
        setFormData({ ...formData, deliveryAddresses: newAddrs, address: newAddrs[0] });
        setShowAddressForm(false);
        setAddressForm({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '', lat: '', lng: '' });
    };

    const handleDeleteAddress = (index: number) => {
        const newAddrs = formData.deliveryAddresses.filter((_, i) => i !== index);
        setFormData({ ...formData, deliveryAddresses: newAddrs, address: newAddrs[0] || { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' } });
    };

    const handlePetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                showToast('A imagem deve ter no máximo 1MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPetForm({ ...petForm, photo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddPet = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingPetId ? `/api/pets?id=${editingPetId}` : '/api/pets';
            const method = editingPetId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(petForm),
            });

            if (res.ok) {
                const savedPet = await res.json();
                if (editingPetId) {
                    setPets(pets.map((p: any) => p._id === editingPetId ? savedPet : p));
                    showToast('Pet atualizado com sucesso!');
                } else {
                    setPets([...pets, savedPet]);
                    showToast('Pet cadastrado com sucesso!');
                }
                setPetForm({
                    name: '', species: 'dog', breed: '', age: '', photo: '',
                    gender: '', size: '', temperament: '', medicalNotes: '', isVaccinated: false
                });
                setShowPetForm(false);
                setEditingPetId(null);
            }
        } catch (error) {
            showToast('Erro ao salvar pet', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditPet = (pet: any) => {
        setPetForm({
            name: pet.name,
            species: pet.species,
            breed: pet.breed || '',
            age: pet.age || '',
            photo: pet.photo || '',
            gender: pet.gender || '',
            size: pet.size || '',
            temperament: pet.temperament || '',
            medicalNotes: pet.medicalNotes || '',
            isVaccinated: pet.isVaccinated || false,
        });
        setEditingPetId(pet._id);
        setShowPetForm(true);
        const formElement = document.getElementById('pet-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeletePet = async (petId: string) => {
        try {
            await fetch(`/api/pets?id=${petId}`, { method: 'DELETE' });
            setPets(pets.filter(p => p._id !== petId));
            showToast('Pet removido');
        } catch (error) {
            showToast('Erro ao remover pet', 'error');
        }
    };

    if (!userData) {
        return <div className={styles.container}>Carregando...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Meu Perfil</h1>

            {/* Header Card */}
            <div className={`${styles.card} ${styles.headerCard}`}>
                <div className={styles.userInfo}>
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatar}>
                            {uploadingImage ? (
                                <div className={styles.spinner}></div>
                            ) : formData.image ? (
                                <Image
                                    src={formData.image}
                                    alt="Profile"
                                    width={100}
                                    height={100}
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <User size={40} color="#3BB77E" />
                            )}
                        </div>
                        <label className={styles.avatarOverlay}>
                            <Camera size={24} color="white" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfileImageChange}
                                style={{ display: 'none' }}
                                disabled={uploadingImage}
                            />
                        </label>
                    </div>
                    <div className={styles.userDetails}>
                        <h2>{userData.name}</h2>
                        <p><Mail size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> {userData.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className={styles.logoutBtn}
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </div>

            {/* Personal Info Form */}
            <div className={styles.card}>
                <h3 className={styles.sectionTitle}><User size={20} color="#3BB77E" /> Informações Pessoais</h3>

                <form onSubmit={handleSubmit}>
                    <div className={styles.grid2Col}>
                        <div className={styles.formGroup}>
                            <label>CPF</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    className={styles.formInput}
                                    style={{ borderColor: !formData.cpf ? '#FF4D4D' : '' }}
                                    value={formData.cpf || ''}
                                    onChange={handleCpfChange}
                                    maxLength={14}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Telefone</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#BCE3C9' }}>
                                    <Phone size={18} />
                                </span>
                                <input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    className={styles.formInput}
                                    style={{ paddingLeft: '45px', borderColor: !formData.phone ? '#FF4D4D' : '' }}
                                    value={formData.phone || ''}
                                    onChange={handlePhoneChange}
                                    maxLength={15}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.8rem' }}>
                            <h4 style={{ margin: 0, color: '#333', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={20} color="#3BB77E" /> Meus Locais de Entrega
                            </h4>
                            {!showAddressForm && (
                                <button
                                    type="button"
                                    onClick={() => setShowAddressForm(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#3BB77E', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}
                                >
                                    <Plus size={16} /> Adicionar Endereço
                                </button>
                            )}
                        </div>

                        {formData.deliveryAddresses.length === 0 && !showAddressForm && (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #ddd' }}>
                                <MapPin size={40} color="#b0bec5" style={{ margin: '0 auto 1rem' }} />
                                <p style={{ color: '#555', marginBottom: '1.2rem', fontWeight: 500 }}>
                                    Você ainda não possui nenhum endereço para entrega salvo.
                                </p>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddressForm(true)}
                                    style={{ background: '#253D4E', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s' }}
                                >
                                    Cadastrar Meu Endereço
                                </button>
                            </div>
                        )}
                        
                        {!showAddressForm && formData.deliveryAddresses.length > 0 && (
                            <div style={{ display: 'grid', gap: '1rem', marginBottom: '20px' }}>
                                {formData.deliveryAddresses.map((addr, idx) => (
                                    <div key={idx} style={{ 
                                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', padding: '1.2rem', 
                                        border: '1px solid #E5E7EB', borderRadius: '10px', background: 'white',
                                        transition: 'all 0.2s ease', position: 'relative'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#333', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                                                {addr.street}, {addr.number}
                                                {idx === 0 && <span style={{ marginLeft: '10px', fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Principal</span>}
                                            </div>
                                            <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '0.2rem' }}>{addr.neighborhood} - {addr.city}/{addr.state}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#888' }}>CEP: {maskZip(addr.zip)} {addr.complement ? `| Cpl: ${addr.complement}` : ''}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAddress(idx)}
                                            style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', padding: '0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showAddressForm && (
                            <div style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <h4 style={{ margin: 0, color: '#253D4E', fontSize: '1.1rem' }}>Novo Endereço</h4>
                                    {formData.deliveryAddresses.length > 0 && (
                                        <button type="button" onClick={() => setShowAddressForm(false)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem', border: 'none' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Rua *</label>
                                            <input
                                                required
                                                placeholder="Nome da rua"
                                                value={addressForm.street}
                                                onChange={e => setAddressForm({ ...addressForm, street: e.target.value })}
                                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', width: '100%', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Número *</label>
                                            <input
                                                type="text"
                                                required
                                                value={addressForm.number}
                                                onChange={e => setAddressForm({ ...addressForm, number: e.target.value })}
                                                placeholder="Ex: 123"
                                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', width: '100%', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Complemento</label>
                                            <input
                                                type="text"
                                                value={addressForm.complement}
                                                onChange={e => setAddressForm({ ...addressForm, complement: e.target.value })}
                                                placeholder="Apto, bloco"
                                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', width: '100%', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Bairro</label>
                                            <input
                                                value={addressForm.neighborhood}
                                                onChange={e => setAddressForm({ ...addressForm, neighborhood: e.target.value })}
                                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', width: '100%', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Estado (UF)</label>
                                            <input
                                                maxLength={2}
                                                placeholder="UF"
                                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', width: '100%', fontSize: '0.95rem', textTransform: 'uppercase' }}
                                                value={addressForm.state}
                                                onChange={e => setAddressForm({ ...addressForm, state: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Cidade *</label>
                                            <input
                                                required
                                                placeholder="Sua cidade"
                                                value={addressForm.city}
                                                onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', width: '100%', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>CEP *</label>
                                            <input
                                                required
                                                placeholder="00000-000"
                                                value={addressForm.zip}
                                                onChange={e => setAddressForm({ ...addressForm, zip: maskZip(e.target.value) })}
                                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #D1D5DB', width: '100%', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontWeight: 600, color: '#374151' }}>
                                        <MapPin size={18} color="#3BB77E" /> Localização no Mapa (Recomendado)
                                    </label>
                                    <MapPicker
                                        lat={addressForm.lat ? parseFloat(addressForm.lat) : -23.550520}
                                        lng={addressForm.lng ? parseFloat(addressForm.lng) : -46.633308}
                                        onLocationChange={(lat: number, lng: number) => {
                                            setAddressForm(prev => ({
                                                ...prev,
                                                lat: lat.toString(),
                                                lng: lng.toString(),
                                            }));
                                            fetchAddressFromCoordinates(lat, lng);
                                        }}
                                        height="250px"
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <AlertCircle size={14} /> Confirme o pino exato para evitar erros em entregas parceiras.
                                    </p>
                                </div>
                                
                                <button 
                                    type="button" 
                                    onClick={handleAddAddress} 
                                    style={{ background: '#253D4E', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.2s' }}
                                >
                                    Adicionar à Lista
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Informações'}
                    </button>
                </form>
            </div>

            {/* Pets Section */}
            <div className={styles.card}>
                <div id="pet-form" className={styles.petHeader}>
                    <h3 className={styles.sectionTitle}>Meus Pets 🐾</h3>
                    <button
                        onClick={() => {
                            if (showPetForm && editingPetId) {
                                setEditingPetId(null);
                                setPetForm({
                                    name: '', species: 'dog', breed: '', age: '', photo: '',
                                    gender: '', size: '', temperament: '', medicalNotes: '', isVaccinated: false
                                });
                            } else {
                                setShowPetForm(!showPetForm);
                            }
                        }}
                        className={styles.addPetBtn}
                    >
                        {showPetForm && editingPetId ? 'Cancelar Edição' : (
                            <>
                                <Plus size={16} />
                                Adicionar Pet
                            </>
                        )}
                    </button>
                </div>

                {showPetForm && (
                    <div className={styles.petForm}>
                        <form onSubmit={handleAddPet}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                <label className={styles.avatarWrapper} style={{ cursor: 'pointer' }}>
                                    <div className={styles.avatar} style={{ borderStyle: petForm.photo ? 'solid' : 'dashed', borderColor: '#D4D7E3' }}>
                                        {petForm.photo ? (
                                            <Image src={petForm.photo} alt="Pet" width={100} height={100} className={styles.petImage} />
                                        ) : (
                                            <div style={{ textAlign: 'center' }}>
                                                <Upload size={24} color="#3BB77E" />
                                                <p style={{ fontSize: '12px', color: '#3BB77E', marginTop: '5px' }}>Foto</p>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handlePetImageChange} style={{ display: 'none' }} />
                                </label>
                            </div>

                            <div className={styles.grid2Col}>
                                <div className={styles.formGroup}>
                                    <label>Nome</label>
                                    <input
                                        type="text"
                                        required
                                        className={styles.formInput}
                                        value={petForm.name || ''}
                                        onChange={e => setPetForm({ ...petForm, name: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Espécie</label>
                                    <select
                                        className={styles.formInput}
                                        value={petForm.species || 'dog'}
                                        onChange={e => setPetForm({ ...petForm, species: e.target.value })}
                                    >
                                        <option value="dog">Cachorro</option>
                                        <option value="cat">Gato</option>
                                        <option value="bird">Pássaro</option>
                                        <option value="fish">Peixe</option>
                                        <option value="reptile">Réptil</option>
                                        <option value="hamster">Hamster</option>
                                        <option value="rabbit">Coelho</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.grid2Col}>
                                <div className={styles.formGroup}>
                                    <label>Raça</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={petForm.breed || ''}
                                        onChange={e => setPetForm({ ...petForm, breed: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Idade (anos)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={petForm.age || ''}
                                        onChange={e => setPetForm({ ...petForm, age: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.grid2Col}>
                                <div className={styles.formGroup}>
                                    <label>Gênero</label>
                                    <select
                                        className={styles.formInput}
                                        value={petForm.gender || ''}
                                        onChange={e => setPetForm({ ...petForm, gender: e.target.value })}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="male">Macho</option>
                                        <option value="female">Fêmea</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Porte</label>
                                    <select
                                        className={styles.formInput}
                                        value={petForm.size || ''}
                                        onChange={e => setPetForm({ ...petForm, size: e.target.value })}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="mini">Mini</option>
                                        <option value="small">Pequeno</option>
                                        <option value="medium">Médio</option>
                                        <option value="large">Grande</option>
                                        <option value="giant">Gigante</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Temperamento</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Dócil, Agitado, Medroso..."
                                    className={styles.formInput}
                                    value={petForm.temperament || ''}
                                    onChange={e => setPetForm({ ...petForm, temperament: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Notas Médicas / Alergias</label>
                                <textarea
                                    placeholder="Ex: Alergia a tal shampoo, problemas cardíacos..."
                                    className={styles.formInput}
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                    value={petForm.medicalNotes || ''}
                                    onChange={e => setPetForm({ ...petForm, medicalNotes: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="isVaccinated"
                                    style={{ width: '18px', height: '18px', accentColor: '#3BB77E' }}
                                    checked={petForm.isVaccinated}
                                    onChange={e => setPetForm({ ...petForm, isVaccinated: e.target.checked })}
                                />
                                <label htmlFor="isVaccinated" style={{ fontWeight: 500, cursor: 'pointer' }}>Possui todas as vacinas em dia?</label>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {editingPetId ? 'Atualizar Pet' : 'Salvar Pet'}
                            </button>
                        </form>
                    </div>
                )}

                {pets.length === 0 ? (
                    <div className={styles.emptyPets}>Nenhum pet cadastrado ainda.</div>
                ) : (
                    <div className={styles.petGrid}>
                        {pets.map(pet => (
                            <div key={pet._id} className={styles.petCard}>
                                <div className={styles.petActions}>
                                    <button
                                        onClick={() => handleEditPet(pet)}
                                        className={`${styles.actionBtn} ${styles.editBtn}`}
                                        title="Editar"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePet(pet._id)}
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        title="Excluir"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className={styles.petImageFrame}>
                                    {pet.photo ? (
                                        <Image src={pet.photo} alt={pet.name} width={90} height={90} className={styles.petImage} />
                                    ) : (
                                        <div style={{ fontSize: '2.5rem' }}>
                                            {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : pet.species === 'bird' ? '🐦' : '🐾'}
                                        </div>
                                    )}
                                </div>
                                <h4 className={styles.petName}>{pet.name}</h4>
                                <p className={styles.petInfo}>{pet.breed || 'Sem raça'}</p>
                                {pet.age && <p className={styles.petInfo} style={{ color: '#BCE3C9', fontWeight: 600 }}>{pet.age} anos</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
