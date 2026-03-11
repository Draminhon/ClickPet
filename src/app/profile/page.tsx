"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { User, Phone, Upload, Trash2, Plus, LogOut, Pencil, MapPin, Camera, Mail } from 'lucide-react';
import { maskPhone, maskZip } from '@/utils/masks';
import Image from 'next/image';
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
        }
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
                phone: profileData.phone || '',
                image: profileData.image || '',
                address: profileData.address || { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' }
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
        signOut({ callbackUrl: '/login' });
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, phone: maskPhone(e.target.value) });
    };

    const fetchAddressFromCEP = async (cep: string) => {
        const cleanedCep = cep.replace(/\D/g, '');
        if (cleanedCep.length !== 8) return;

        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
            const data = await res.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    address: {
                        ...prev.address,
                        street: data.logradouro || '',
                        neighborhood: data.bairro || '',
                        city: data.localidade || '',
                        state: data.uf || '',
                    }
                }));
                showToast('Endereço preenchido automaticamente pelo CEP!');
            }
        } catch (error) {
            console.error('Error fetching CEP:', error);
        }
    };

    const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const zip = maskZip(e.target.value);
        setFormData({ ...formData, address: { ...formData.address, zip } });
        if (zip.length === 9) { // 00000-000
            fetchAddressFromCEP(zip);
        }
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
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUserData(updatedUser);
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
                                style={{ paddingLeft: '45px' }}
                                value={formData.phone || ''}
                                onChange={handlePhoneChange}
                                maxLength={15}
                            />
                        </div>
                    </div>

                    <h4 className={styles.sectionTitle} style={{ marginTop: '30px', fontSize: '18px' }}>
                        <MapPin size={20} color="#3BB77E" /> Endereço de Entrega
                    </h4>

                    <div className={styles.grid3Col}>
                        <div className={styles.formGroup}>
                            <label>Rua</label>
                            <input
                                type="text"
                                required
                                className={styles.formInput}
                                value={formData.address.street || ''}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Número</label>
                            <input
                                type="text"
                                required
                                className={styles.formInput}
                                value={formData.address.number || ''}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, number: e.target.value } })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Complemento</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={formData.address.complement || ''}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, complement: e.target.value } })}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    <div className={styles.grid3Col}>
                        <div className={styles.formGroup}>
                            <label>Bairro</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={formData.address.neighborhood || ''}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, neighborhood: e.target.value } })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Cidade</label>
                            <input
                                type="text"
                                required
                                className={styles.formInput}
                                value={formData.address.city || ''}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Estado (UF)</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                maxLength={2}
                                placeholder="CE"
                                style={{ textTransform: 'uppercase' }}
                                value={formData.address.state || ''}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value.toUpperCase() } })}
                            />
                        </div>
                    </div>

                    <div className={styles.grid2Col}>
                        <div className={styles.formGroup}>
                            <label>CEP</label>
                            <input
                                type="text"
                                required
                                className={styles.formInput}
                                value={formData.address.zip || ''}
                                onChange={handleZipChange}
                                maxLength={9}
                            />
                        </div>
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
