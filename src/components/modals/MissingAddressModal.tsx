"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, X, ArrowRight } from 'lucide-react';

interface MissingAddressModalProps {
    onClose: () => void;
}

const MissingAddressModal: React.FC<MissingAddressModalProps> = ({ onClose }) => {
    const router = useRouter();

    const handleGoToProfile = () => {
        router.push('/profile');
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '480px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                position: 'relative',
                animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: '#f5f5f5',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#eeeeee')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                >
                    <X size={18} color="#253D4E" />
                </button>

                {/* Icon Container */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'rgba(59, 183, 126, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                }}>
                    <MapPin size={40} color="#3BB77E" strokeWidth={2.5} />
                </div>

                <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    color: '#253D4E', 
                    marginBottom: '16px',
                    lineHeight: '1.2'
                }}>
                    Vamos encontrar o melhor para o seu pet!
                </h2>
                
                <p style={{ 
                    fontSize: '15px', 
                    color: '#757575', 
                    lineHeight: '1.6', 
                    marginBottom: '32px' 
                }}>
                    Para mostrar as lojas que entregam na sua região e calcular o frete corretamente, 
                    precisamos que você informe seu endereço de entrega.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                        onClick={handleGoToProfile}
                        style={{
                            width: '100%',
                            height: '52px',
                            borderRadius: '12px',
                            backgroundColor: '#3BB77E',
                            color: 'white',
                            border: 'none',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(59, 183, 126, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#35a570';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3BB77E';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        ADICIONAR ENDEREÇO AGORA
                        <ArrowRight size={18} />
                    </button>

                    <button 
                        onClick={onClose}
                        style={{
                            width: '100%',
                            height: '52px',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            color: '#757575',
                            border: '1px solid #D1D9E2',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                    >
                        PULAR POR ENQUANTO
                    </button>
                </div>
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
};

export default MissingAddressModal;
