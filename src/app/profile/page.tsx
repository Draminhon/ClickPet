"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { User, Phone, Upload, Trash2, Plus, LogOut, Pencil } from 'lucide-react';
import { maskPhone, maskZip } from '@/utils/masks';

export default function ProfilePage() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [pets, setPets] = useState<any[]>([]);
    const [showPetForm, setShowPetForm] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        address: {
            street: '',
            number: '',
            complement: '',
            city: '',
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

    useEffect(() => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => {
                setUserData(data);
                setFormData({
                    phone: data.phone || '',
                    address: data.address || { street: '', number: '', complement: '', city: '', zip: '' }
                });
            });

        fetch('/api/pets')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPets(data);
                } else {
                    setPets([]);
                }
            })
            .catch(() => setPets([]));
    }, []);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, phone: maskPhone(e.target.value) });
    };

    const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, address: { ...formData.address, zip: maskZip(e.target.value) } });
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
        // Deslocar para o formulário de pet
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
        return <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="section-title">Meu Perfil</h1>

            {/* User Info */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#6CC551', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={30} color="white" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.3rem' }}>{userData.name}</h2>
                        <p style={{ color: '#666' }}>{userData.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#ffebee',
                        color: '#d32f2f',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        marginLeft: '1rem'
                    }}
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </div>


            {/* Personal Info Form */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Informações Pessoais</h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Telefone</label>
                        <input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            maxLength={15}
                        />
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>Endereço de Entrega</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Rua</label>
                            <input
                                type="text"
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.address.street}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Número</label>
                            <input
                                type="text"
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.address.number}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, number: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Complemento</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.address.complement || ''}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, complement: e.target.value } })}
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Cidade</label>
                            <input
                                type="text"
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.address.city}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>CEP</label>
                            <input
                                type="text"
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.address.zip}
                                onChange={handleZipChange}
                                maxLength={9}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Informações'}
                    </button>
                </form>
            </div>

            {/* Pets Section */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div id="pet-form" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Meus Pets 🐾</h3>
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
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                        {showPetForm && editingPetId ? 'Cancelar Edição' : (
                            <>
                                <Plus size={16} style={{ marginRight: '0.3rem' }} />
                                Adicionar Pet
                            </>
                        )}
                    </button>
                </div>

                {showPetForm && (
                    <form onSubmit={handleAddPet} style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                            <label style={{
                                width: '100px',
                                height: '100px',
                                border: '2px dashed #ddd',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden'
                            }}>
                                {petForm.photo ? (
                                    <img src={petForm.photo} alt="Pet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Upload size={24} color="#ccc" />
                                )}
                                <input type="file" accept="image/*" onChange={handlePetImageChange} style={{ display: 'none' }} />
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Nome</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    value={petForm.name}
                                    onChange={e => setPetForm({ ...petForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Espécie</label>
                                <select
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    value={petForm.species}
                                    onChange={e => setPetForm({ ...petForm, species: e.target.value })}
                                >
                                    <option value="dog">Cachorro</option>
                                    <option value="cat">Gato</option>
                                    <option value="bird">Pássaro</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Raça</label>
                                <input
                                    type="text"
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    value={petForm.breed}
                                    onChange={e => setPetForm({ ...petForm, breed: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Idade (anos)</label>
                                <input
                                    type="number"
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    value={petForm.age}
                                    onChange={e => setPetForm({ ...petForm, age: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Gênero</label>
                                <select
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    value={petForm.gender}
                                    onChange={e => setPetForm({ ...petForm, gender: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="male">Macho</option>
                                    <option value="female">Fêmea</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Porte</label>
                                <select
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    value={petForm.size}
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

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Temperamento</label>
                            <input
                                type="text"
                                placeholder="Ex: Dócil, Agitado, Medroso..."
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                value={petForm.temperament}
                                onChange={e => setPetForm({ ...petForm, temperament: e.target.value })}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Notas Médicas / Alergias</label>
                            <textarea
                                placeholder="Ex: Alergia a tal shampoo, problemas cardíacos..."
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ddd', minHeight: '80px' }}
                                value={petForm.medicalNotes}
                                onChange={e => setPetForm({ ...petForm, medicalNotes: e.target.value })}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="isVaccinated"
                                checked={petForm.isVaccinated}
                                onChange={e => setPetForm({ ...petForm, isVaccinated: e.target.checked })}
                            />
                            <label htmlFor="isVaccinated" style={{ fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer' }}>Possui todas as vacinas em dia?</label>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.6rem' }}>
                            {editingPetId ? 'Atualizar Pet' : 'Salvar Pet'}
                        </button>
                    </form>
                )}

                {pets.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>Nenhum pet cadastrado ainda.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {pets.map(pet => (
                            <div key={pet._id} style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1rem', textAlign: 'center', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.3rem' }}>
                                    <button
                                        onClick={() => handleEditPet(pet)}
                                        style={{ background: '#6CC551', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Editar"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePet(pet._id)}
                                        style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Excluir"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.5rem', background: '#ddd' }}>
                                    {pet.photo ? (
                                        <img src={pet.photo} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                            {pet.species === 'dog' ? '🐶' : pet.species === 'cat' ? '🐱' : pet.species === 'bird' ? '🐦' : '🐾'}
                                        </div>
                                    )}
                                </div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem' }}>{pet.name}</h4>
                                <p style={{ fontSize: '0.8rem', color: '#666' }}>{pet.breed || 'Sem raça definida'}</p>
                                {pet.age && <p style={{ fontSize: '0.8rem', color: '#999' }}>{pet.age} anos</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
