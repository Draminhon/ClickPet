"use client";

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function PetsPage() {
    const { showToast } = useToast();
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        species: 'dog',
        breed: '',
        age: '',
        weight: '',
        notes: '',
    });

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = () => {
        fetch('/api/pets')
            .then(res => res.json())
            .then(data => {
                setPets(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/pets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    age: formData.age ? parseInt(formData.age) : undefined,
                    weight: formData.weight ? parseFloat(formData.weight) : undefined,
                }),
            });

            if (res.ok) {
                showToast('Pet cadastrado com sucesso!');
                setShowForm(false);
                setFormData({ name: '', species: 'dog', breed: '', age: '', weight: '', notes: '' });
                fetchPets();
            } else {
                showToast('Erro ao cadastrar pet', 'error');
            }
        } catch (error) {
            showToast('Erro ao cadastrar pet', 'error');
        }
    };

    const handleDelete = async (petId: string) => {
        if (!confirm('Tem certeza que deseja excluir este pet?')) return;

        try {
            const res = await fetch(`/api/pets?id=${petId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                showToast('Pet excluído');
                fetchPets();
            } else {
                showToast('Erro ao excluir pet', 'error');
            }
        } catch (error) {
            showToast('Erro ao excluir pet', 'error');
        }
    };

    const getSpeciesEmoji = (species: string) => {
        const emojis: Record<string, string> = {
            dog: '🐕',
            cat: '🐈',
            bird: '🦜',
            other: '🐾',
        };
        return emojis[species] || '🐾';
    };

    if (loading) {
        return <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>Carregando...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Meus Pets</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} />
                    Cadastrar Pet
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Novo Pet</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nome *</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Espécie *</label>
                            <select
                                value={formData.species}
                                onChange={e => setFormData({ ...formData, species: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="dog">🐕 Cachorro</option>
                                <option value="cat">🐈 Gato</option>
                                <option value="bird">🦜 Pássaro</option>
                                <option value="other">🐾 Outro</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Raça</label>
                            <input
                                value={formData.breed}
                                onChange={e => setFormData({ ...formData, breed: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Idade (anos)</label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Peso (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            maxLength={500}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            style={{ padding: '0.8rem 1.5rem', background: '#ddd', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Pets List */}
            {pets.length === 0 ? (
                <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '4rem' }}>🐾</span>
                    <p style={{ color: '#666', marginTop: '1rem' }}>Você ainda não cadastrou nenhum pet</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {pets.map(pet => (
                        <div key={pet._id} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '2.5rem' }}>{getSpeciesEmoji(pet.species)}</span>
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.2rem' }}>{pet.name}</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#666' }}>{pet.breed || 'Sem raça definida'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(pet._id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                                {pet.age && (
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666' }}>Idade</p>
                                        <p style={{ fontWeight: 600 }}>{pet.age} {pet.age === 1 ? 'ano' : 'anos'}</p>
                                    </div>
                                )}
                                {pet.weight && (
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666' }}>Peso</p>
                                        <p style={{ fontWeight: 600 }}>{pet.weight} kg</p>
                                    </div>
                                )}
                            </div>

                            {pet.notes && (
                                <div style={{ padding: '0.8rem', background: '#e8f5e9', borderRadius: '8px', fontSize: '0.9rem', color: '#666' }}>
                                    <p style={{ fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Observações:</p>
                                    {pet.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
