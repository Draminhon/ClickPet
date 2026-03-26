"use client";

import { useEffect, useState, useMemo } from 'react';
import { 
    Plus, 
    Trash2, 
    Upload, 
    Search, 
    Filter, 
    Calendar, 
    ChevronDown, 
    AlertCircle,
    UserCircle,
    Pencil
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import { maskPhone, maskLicensePlate } from '@/utils/masks';
import styles from './Delivery.module.css';

export default function DeliveryPersonsPage() {
    const { showToast } = useToast();
    const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [sortBy, setSortBy] = useState('NEWEST'); // NEWEST, OLDEST

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        vehicleType: 'motorcycle',
        licensePlate: '',
        photo: '',
        entryDate: new Date().toISOString().split('T')[0],
        cnhCategory: 'A',
    });

    const [editFormData, setEditFormData] = useState<any>(null);

    useEffect(() => {
        fetchDeliveryPersons();
    }, []);

    const fetchDeliveryPersons = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/delivery-persons');
            const data = await res.json();
            if (Array.isArray(data)) {
                setDeliveryPersons(data);
            }
        } catch (error) {
            showToast('Erro ao carregar entregadores', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                showToast('A imagem deve ter no máximo 1MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isEdit) {
                    setEditFormData({ ...editFormData, photo: reader.result as string });
                } else {
                    setFormData({ ...formData, photo: reader.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.phone) {
            showToast('Nome e Telefone são obrigatórios', 'error');
            return;
        }

        try {
            const res = await fetch('/api/delivery-persons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                showToast('Entregador cadastrado com sucesso!');
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    vehicleType: 'motorcycle',
                    licensePlate: '',
                    photo: '',
                    entryDate: new Date().toISOString().split('T')[0],
                    cnhCategory: 'A',
                });
                fetchDeliveryPersons();
            } else {
                showToast('Erro ao cadastrar entregador', 'error');
            }
        } catch (error) {
            showToast('Erro ao cadastrar entregador', 'error');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditing || !editFormData) return;

        try {
            const res = await fetch(`/api/delivery-persons?id=${isEditing._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
            });

            if (res.ok) {
                showToast('Entregador atualizado com sucesso!');
                setIsEditing(null);
                setEditFormData(null);
                fetchDeliveryPersons();
            } else {
                showToast('Erro ao atualizar entregador', 'error');
            }
        } catch (error) {
            showToast('Erro ao atualizar entregador', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!isDeleting) return;

        try {
            const res = await fetch(`/api/delivery-persons?id=${isDeleting}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Entregador excluído permanentemente');
                setIsDeleting(null);
                fetchDeliveryPersons();
            } else {
                showToast('Erro ao excluir entregador', 'error');
            }
        } catch (error) {
            showToast('Erro ao excluir entregador', 'error');
        }
    };

    const startEdit = (person: any) => {
        setIsEditing(person);
        const entryDate = person.entryDate ? new Date(person.entryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setEditFormData({
            ...person,
            entryDate
        });
    };

    // Filter and Search Logic
    const filteredDeliveryPersons = useMemo(() => {
        let result = [...deliveryPersons];

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(query) || 
                (p.licensePlate && p.licensePlate.toLowerCase().includes(query)) ||
                p.phone.includes(query)
            );
        }

        // Category Filter
        if (filterCategory !== 'ALL') {
            result = result.filter(p => p.cnhCategory === filterCategory);
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.entryDate || a.createdAt).getTime();
            const dateB = new Date(b.entryDate || b.createdAt).getTime();
            return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [deliveryPersons, searchQuery, filterCategory, sortBy]);

    const cnhCategories = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'];

    return (
        <div className={styles.container}>
            <div className={styles.headerText}>CADASTRO DE ENTREGADORES</div>

            <form onSubmit={handleSubmit} className={styles.formContainer}>
                {/* Left: Photo Upload */}
                <div className={styles.photoUploadSection}>
                    <label className={styles.photoCircle}>
                        {formData.photo ? (
                            <img src={formData.photo} alt="Preview" className={styles.photoPreview} />
                        ) : (
                            <Upload size={40} color="#757575" />
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} style={{ display: 'none' }} />
                    </label>
                    <span className={styles.uploadLabel}>ENVIE UMA FOTO</span>
                </div>

                {/* Right: Form Fields */}
                <div style={{ flex: 1 }}>
                    <div className={styles.formGrid}>
                        {/* 1. Nome Completo */}
                        <div className={styles.formGroup}>
                            <label className={styles.fieldLabel}>NOME COMPLETO</label>
                            <div className={styles.inputContainer}>
                                <input 
                                    className={styles.input} 
                                    placeholder="Digite o nome completo"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 2. Contato */}
                        <div className={styles.formGroup}>
                            <label className={styles.fieldLabel}>CONTATO</label>
                            <div className={styles.inputContainer}>
                                <input 
                                    className={styles.input} 
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* 3. Placa do Veículo */}
                        <div className={styles.formGroup}>
                            <label className={styles.fieldLabel}>PLACA DO VEÍCULO</label>
                            <div className={styles.inputContainer}>
                                <input 
                                    className={styles.input} 
                                    placeholder="ABC-1234 ou BRA2E19"
                                    value={formData.licensePlate}
                                    onChange={e => setFormData({ ...formData, licensePlate: maskLicensePlate(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* 4. Email */}
                        <div className={styles.formGroup}>
                            <label className={styles.fieldLabel}>EMAIL</label>
                            <div className={styles.inputContainer}>
                                <input 
                                    type="email"
                                    className={styles.input} 
                                    placeholder="exemplo@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 5. Data de Entrada */}
                        <div className={styles.formGroup}>
                            <label className={styles.fieldLabel}>DATA DE ENTRADA</label>
                            <div className={styles.inputContainer}>
                                <input 
                                    type="date"
                                    className={styles.input} 
                                    value={formData.entryDate}
                                    onChange={e => setFormData({ ...formData, entryDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 6. Categora CNH */}
                        <div className={styles.formGroup}>
                            <label className={styles.fieldLabel}>CATEGORIA CNH</label>
                            <div className={styles.inputContainer}>
                                <select 
                                    className={styles.select}
                                    value={formData.cnhCategory}
                                    onChange={e => setFormData({ ...formData, cnhCategory: e.target.value })}
                                >
                                    {cnhCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={styles.submitBtnContainer}>
                        <button type="submit" className={styles.submitBtn}>
                            CADASTRAR ENTREGADOR
                        </button>
                    </div>
                </div>
            </form>

            <div className={styles.listHeader}>
                <div className={styles.listTitle}>ENTREGADORES</div>
                
                <div className={styles.searchAndFilter}>
                    <div className={styles.searchContainer}>
                        <Search size={18} className={styles.searchIcon} />
                        <input 
                            placeholder="Buscar entregador..." 
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                        <select 
                            className={styles.filterBtn}
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="ALL">Categoria CNH (Todas)</option>
                            {cnhCategories.map(cat => (
                                <option key={cat} value={cat}>Categoria {cat}</option>
                            ))}
                        </select>
                        
                        <select 
                            className={styles.filterBtn}
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                        >
                            <option value="NEWEST">Novos primeiro</option>
                            <option value="OLDEST">Antigos primeiro</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>
            ) : filteredDeliveryPersons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#757575' }}>
                    Nenhum entregador encontrado.
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredDeliveryPersons.map((person) => (
                        <div key={person._id} className={styles.card}>
                            <button 
                                className={styles.deleteBtn}
                                onClick={() => setIsDeleting(person._id)}
                                title="Excluir entregador"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button 
                                className={styles.editBtn}
                                onClick={() => startEdit(person)}
                                title="Editar entregador"
                            >
                                <Pencil size={16} />
                            </button>

                            {person.photo ? (
                                <img src={person.photo} alt={person.name} className={styles.cardPhoto} />
                            ) : (
                                <div className={styles.cardPhoto} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UserCircle size={40} color="#D1D9E2" />
                                </div>
                            )}

                            <div className={styles.cardContent}>
                                <div className={styles.cardName}>{person.name}</div>
                                <div className={styles.cardInfo}>{person.phone || 'Sem contato'}</div>
                                <div className={styles.cardInfo}>{person.licensePlate ? `PLACA: ${person.licensePlate}` : 'SEM PLACA'}</div>
                                <div className={styles.cardInfo}>CNH: {person.cnhCategory || 'N/A'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {isEditing && editFormData && (
                <div className={styles.modalOverlay}>
                    <div className={styles.editModalContent}>
                        <h3 className={styles.modalTitle} style={{ marginBottom: '24px' }}>Editar Entregador</h3>
                        
                        <div style={{ display: 'flex', gap: '32px' }}>
                            <div className={styles.photoUploadSection}>
                                <label className={styles.photoCircle}>
                                    {editFormData.photo ? (
                                        <img src={editFormData.photo} alt="Preview" className={styles.photoPreview} />
                                    ) : (
                                        <Upload size={40} color="#757575" />
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} style={{ display: 'none' }} />
                                </label>
                                <span className={styles.uploadLabel}>ALTERAR FOTO</span>
                            </div>

                            <form onSubmit={handleEditSubmit} style={{ flex: 1 }}>
                                <div className={styles.formGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>NOME COMPLETO</label>
                                        <div className={styles.inputContainer}>
                                            <input 
                                                className={styles.input} 
                                                value={editFormData.name}
                                                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>CONTATO</label>
                                        <div className={styles.inputContainer}>
                                            <input 
                                                className={styles.input} 
                                                value={editFormData.phone}
                                                onChange={e => setEditFormData({ ...editFormData, phone: maskPhone(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>PLACA DO VEÍCULO</label>
                                        <div className={styles.inputContainer}>
                                            <input 
                                                className={styles.input} 
                                                value={editFormData.licensePlate}
                                                onChange={e => setEditFormData({ ...editFormData, licensePlate: maskLicensePlate(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>EMAIL</label>
                                        <div className={styles.inputContainer}>
                                            <input 
                                                type="email"
                                                className={styles.input} 
                                                value={editFormData.email}
                                                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>DATA DE ENTRADA</label>
                                        <div className={styles.inputContainer}>
                                            <input 
                                                type="date"
                                                className={styles.input} 
                                                value={editFormData.entryDate}
                                                onChange={e => setEditFormData({ ...editFormData, entryDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.fieldLabel}>CATEGORIA CNH</label>
                                        <div className={styles.inputContainer}>
                                            <select 
                                                className={styles.select}
                                                value={editFormData.cnhCategory}
                                                onChange={e => setEditFormData({ ...editFormData, cnhCategory: e.target.value })}
                                            >
                                                {cnhCategories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.modalActions} style={{ marginTop: '32px', justifyContent: 'flex-end' }}>
                                    <button type="button" className={styles.cancelBtn} onClick={() => setIsEditing(null)}>
                                        CANCELAR
                                    </button>
                                    <button type="submit" className={styles.saveEditBtn}>
                                        SALVAR ALTERAÇÕES
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleting && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <AlertCircle size={48} color="#dc3545" />
                        </div>
                        <h3 className={styles.modalTitle}>Excluir Entregador?</h3>
                        <p className={styles.modalText}>
                            Esta ação é irreversível. Todas as informações deste entregador serão removidas permanentemente do sistema.
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setIsDeleting(null)}>
                                CANCELAR
                            </button>
                            <button className={styles.confirmDeleteBtn} onClick={confirmDelete}>
                                EXCLUIR DEFINITIVAMENTE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
