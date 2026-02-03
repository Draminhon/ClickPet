"use client";

import { useEffect, useState } from 'react';
import { Plus, Bike, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { maskPhone, maskLicensePlate } from '@/utils/masks';

export default function DeliveryPersonsPage() {
    const { showToast } = useToast();
    const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        vehicleType: 'motorcycle',
        licensePlate: '',
        photo: '',
    });

    useEffect(() => {
        fetchDeliveryPersons();
    }, []);

    const fetchDeliveryPersons = () => {
        fetch('/api/delivery-persons')
            .then(res => res.json())
            .then(data => setDeliveryPersons(data));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                showToast('A imagem deve ter no máximo 1MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('/api/delivery-persons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast('Entregador cadastrado com sucesso!');
                setFormData({ name: '', phone: '', email: '', vehicleType: 'motorcycle', licensePlate: '', photo: '' });
                setShowForm(false);
                fetchDeliveryPersons();
            } else {
                showToast('Erro ao cadastrar entregador', 'error');
            }
        } catch (error) {
            showToast('Erro ao cadastrar entregador', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este entregador?')) return;

        try {
            await fetch(`/api/delivery-persons?id=${id}`, { method: 'DELETE' });
            showToast('Entregador excluído');
            fetchDeliveryPersons();
        } catch (error) {
            showToast('Erro ao excluir entregador', 'error');
        }
    };

    const getVehicleLabel = (type: string) => {
        const labels: any = {
            bike: 'Bicicleta',
            motorcycle: 'Moto',
            car: 'Carro'
        };
        return labels[type] || type;
    };

    const getVehicleIcon = (type: string) => {
        const icons: any = {
            bike: '🚲',
            motorcycle: '🏍️',
            car: '🚗'
        };
        return icons[type] || '🚚';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Meus Entregadores</h1>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    <Plus size={20} style={{ marginRight: '0.5rem' }} />
                    Novo Entregador
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
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
                            {formData.photo ? (
                                <img src={formData.photo} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Upload size={24} color="#ccc" />
                            )}
                            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome Completo</label>
                            <input
                                type="text"
                                required
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Telefone</label>
                            <input
                                type="tel"
                                required
                                placeholder="(00) 00000-0000"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email (opcional)</label>
                        <input
                            type="email"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tipo de Veículo</label>
                            <select
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                value={formData.vehicleType}
                                onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                            >
                                <option value="bike">Bicicleta</option>
                                <option value="motorcycle">Moto</option>
                                <option value="car">Carro</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Placa (opcional)</label>
                            <input
                                type="text"
                                placeholder="ABC-1234"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', textTransform: 'uppercase' }}
                                value={formData.licensePlate}
                                onChange={e => setFormData({ ...formData, licensePlate: maskLicensePlate(e.target.value) })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Cadastrar Entregador
                    </button>
                </form>
            )}

            {deliveryPersons.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <Bike size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: '#666' }}>Nenhum entregador cadastrado ainda.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {deliveryPersons.map(person => (
                        <div key={person._id} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative' }}>
                            <button
                                onClick={() => handleDelete(person._id)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Trash2 size={16} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {person.photo ? (
                                        <img src={person.photo} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2.5rem' }}>👤</span>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem', textAlign: 'center' }}>{person.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0f0f0', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{getVehicleIcon(person.vehicleType)}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{getVehicleLabel(person.vehicleType)}</span>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                <p style={{ marginBottom: '0.5rem' }}>📱 {person.phone}</p>
                                {person.email && <p style={{ marginBottom: '0.5rem' }}>📧 {person.email}</p>}
                                {person.licensePlate && <p>🚗 {person.licensePlate}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
