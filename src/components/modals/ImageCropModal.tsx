"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/imageUtils';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropModalProps {
    image: string;
    aspect: number;
    title: string;
    onClose: () => void;
    onConfirm: (croppedImage: string) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ 
    image, 
    aspect, 
    title, 
    onClose, 
    onConfirm 
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setLoading(true);
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onConfirm(croppedImage);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                width: '90%',
                maxWidth: '800px',
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#253D4E', margin: 0 }}>{title}</h2>
                        <p style={{ fontSize: '13px', color: '#757575', margin: '4px 0 0 0' }}>Arraste para ajustar a posição da imagem</p>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#eeeeee')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                    >
                        <X size={20} color="#253D4E" />
                    </button>
                </div>

                {/* Cropper Container */}
                <div style={{ flex: 1, position: 'relative', backgroundColor: '#1a1a1a' }}>
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropComplete}
                        onZoomChange={onZoomChange}
                        showGrid={true}
                    />
                </div>

                {/* Controls */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <ZoomOut size={18} color="#757575" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            style={{
                                flex: 1,
                                height: '6px',
                                borderRadius: '3px',
                                appearance: 'none',
                                background: '#e0e0e0',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                        <ZoomIn size={18} color="#757575" />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                        <button 
                            onClick={onClose}
                            style={{ 
                                padding: '12px 24px', 
                                border: '1px solid #D1D9E2', 
                                background: 'white', 
                                borderRadius: '12px', 
                                fontSize: '14px', 
                                fontWeight: 600, 
                                color: '#253D4E', 
                                cursor: 'pointer' 
                            }}
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={loading}
                            style={{ 
                                padding: '12px 32px', 
                                background: '#3BB77E', 
                                border: 'none', 
                                borderRadius: '12px', 
                                fontSize: '14px', 
                                fontWeight: 700, 
                                color: 'white', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'PROCESSANDO...' : (
                                <>
                                    <Check size={18} />
                                    CONFIRMAR AJUSTE
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ImageCropModal;
