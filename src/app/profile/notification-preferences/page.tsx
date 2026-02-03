'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';

interface NotificationPreferences {
    orderUpdates: boolean;
    appointmentReminders: boolean;
    promotions: boolean;
    messages: boolean;
    deliveryTracking: boolean;
}

export default function NotificationPreferencesPage() {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        orderUpdates: true,
        appointmentReminders: true,
        promotions: true,
        messages: true,
        deliveryTracking: true,
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
        setSaved(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // TODO: Save to backend
            await new Promise(resolve => setTimeout(resolve, 500));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-6 h-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            Preferências de Notificações
                        </h1>
                    </div>

                    <p className="text-gray-600 mb-8">
                        Escolha quais notificações você deseja receber
                    </p>

                    <div className="space-y-4">
                        <NotificationToggle
                            label="Atualizações de Pedidos"
                            description="Receba notificações quando o status do seu pedido mudar"
                            checked={preferences.orderUpdates}
                            onChange={() => handleToggle('orderUpdates')}
                        />

                        <NotificationToggle
                            label="Lembretes de Agendamentos"
                            description="Receba lembretes 24 horas antes dos seus agendamentos"
                            checked={preferences.appointmentReminders}
                            onChange={() => handleToggle('appointmentReminders')}
                        />

                        <NotificationToggle
                            label="Promoções e Ofertas"
                            description="Receba notificações sobre promoções e descontos especiais"
                            checked={preferences.promotions}
                            onChange={() => handleToggle('promotions')}
                        />

                        <NotificationToggle
                            label="Mensagens"
                            description="Receba notificações quando receber novas mensagens"
                            checked={preferences.messages}
                            onChange={() => handleToggle('messages')}
                        />

                        <NotificationToggle
                            label="Rastreamento de Entrega"
                            description="Receba atualizações em tempo real sobre sua entrega"
                            checked={preferences.deliveryTracking}
                            onChange={() => handleToggle('deliveryTracking')}
                        />
                    </div>

                    <div className="mt-8 flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : 'Salvar Preferências'}
                        </button>

                        {saved && (
                            <div className="flex items-center gap-2 text-green-600">
                                <Check className="w-5 h-5" />
                                <span className="font-medium">Salvo com sucesso!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface NotificationToggleProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
}

function NotificationToggle({ label, description, checked, onChange }: NotificationToggleProps) {
    return (
        <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
            <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{label}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
}
