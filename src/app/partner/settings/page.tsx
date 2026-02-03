"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/context/ToastContext';
import { Building2, Phone, MapPin, Truck, DollarSign } from 'lucide-react';
import MapPicker from '@/components/ui/MapPicker';
import { maskPhone, maskZip } from '@/utils/masks';


export default function PartnerSettings() {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [formData, setFormData] = useState({
        phone: '',
        minimumOrderValue: '0',
        deliveryRadius: '10',
        deliveryFeePerKm: '2',
        freeDeliveryMinimum: '0',
        address: {
            street: '',
            number: '',
            city: '',
            zip: '',
            coordinates: {
                lat: '',
                lng: '',
            },
        }
    });

    useEffect(() => {
        fetch('/api/profile')
            .then(res => res.json())
            .then(data => {
                setUserData(data);
                setFormData({
                    phone: data.phone || '',
                    minimumOrderValue: data.minimumOrderValue?.toString() || '0',
                    deliveryRadius: data.deliveryRadius?.toString() || '10',
                    deliveryFeePerKm: data.deliveryFeePerKm?.toString() || '2',
                    freeDeliveryMinimum: data.freeDeliveryMinimum?.toString() || '0',
                    address: {
                        street: data.address?.street || '',
                        number: data.address?.number || '',
                        city: data.address?.city || '',
                        zip: data.address?.zip || '',
                        coordinates: {
                            lat: data.address?.coordinates?.coordinates?.[1]?.toString() || '',
                            lng: data.address?.coordinates?.coordinates?.[0]?.toString() || '',
                        },
                    }
                });
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    minimumOrderValue: parseFloat(formData.minimumOrderValue),
                    deliveryRadius: parseFloat(formData.deliveryRadius),
                    deliveryFeePerKm: parseFloat(formData.deliveryFeePerKm),
                    freeDeliveryMinimum: parseFloat(formData.freeDeliveryMinimum),
                    address: {
                        ...formData.address,
                        coordinates: {
                            type: 'Point',
                            coordinates: [
                                formData.address.coordinates.lng ? parseFloat(formData.address.coordinates.lng) : 0,
                                formData.address.coordinates.lat ? parseFloat(formData.address.coordinates.lat) : 0
                            ]
                        },
                    },
                }),
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

    return (
        <div>
            <h1 className="section-title">Configurações</h1>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
                {/* Business Info */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Building2 size={24} />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Informações do Negócio</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Telefone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Valor Mínimo do Pedido (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.minimumOrderValue}
                                onChange={e => setFormData({ ...formData, minimumOrderValue: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <MapPin size={24} />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Endereço</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Rua</label>
                            <input
                                value={formData.address.street}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Número</label>
                            <input
                                value={formData.address.number}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, number: e.target.value } })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cidade</label>
                            <input
                                value={formData.address.city}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>CEP</label>
                            <input
                                value={formData.address.zip}
                                onChange={e => setFormData({ ...formData, address: { ...formData.address, zip: maskZip(e.target.value) } })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>


                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Localização no Mapa</label>
                        <MapPicker
                            lat={formData.address.coordinates.lat ? parseFloat(formData.address.coordinates.lat) : -23.550520}
                            lng={formData.address.coordinates.lng ? parseFloat(formData.address.coordinates.lng) : -46.633308}
                            onLocationChange={(lat, lng) => setFormData({
                                ...formData,
                                address: {
                                    ...formData.address,
                                    coordinates: {
                                        lat: lat.toString(),
                                        lng: lng.toString(),
                                    }
                                }
                            })}
                            height="350px"
                        />
                    </div>

                </div>

                {/* Delivery Settings */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Truck size={24} />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Configurações de Entrega</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Raio de Entrega (km)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.deliveryRadius}
                                onChange={e => setFormData({ ...formData, deliveryRadius: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.3rem' }}>
                                Distância máxima para entregas a partir do seu endereço
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Taxa por Km (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.deliveryFeePerKm}
                                onChange={e => setFormData({ ...formData, deliveryFeePerKm: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.3rem' }}>
                                Valor cobrado por quilômetro de distância
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Frete Grátis Acima de (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.freeDeliveryMinimum}
                                onChange={e => setFormData({ ...formData, freeDeliveryMinimum: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.3rem' }}>
                                Pedidos acima deste valor têm frete grátis (0 = desabilitado)
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: 'fit-content' }}
                >
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </form>
        </div>
    );
}
