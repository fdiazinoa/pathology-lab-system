import React, { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import { validateHistologyImage } from '../../services/aiService';
import { useData } from '../../services/DataContext';

const BiomarkerEditModal = ({ isOpen, onClose, marker, onSave }) => {
    const { settings } = useData();
    const [formData, setFormData] = useState({
        name: '',
        result: 'Pendiente',
        intensity: '',
        percentage: 0,
        pattern: '',
        control: 'Adecuado',
        notes: '',
        imageUrl: null
    });

    useEffect(() => {
        if (marker) {
            setFormData({
                name: marker.name || '',
                result: marker.result || 'Pendiente',
                intensity: marker.intensity || '',
                percentage: marker.percentage || 0,
                pattern: marker.pattern || '',
                control: marker.control || 'Adecuado',
                notes: marker.notes || '',
                imageUrl: marker.imageUrl || null
            });
        }
    }, [marker]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const validation = await validateHistologyImage(file, settings?.openaiApiKey);
            if (!validation.isValid) {
                alert(`Imagen rechazada: ${validation.reason}`);
                e.target.value = ''; // Clear input
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        onSave({
            ...marker,
            ...formData
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={marker?.id ? "Editar Biomarcador" : "Nuevo Biomarcador"}
            onConfirm={handleSubmit}
            confirmText="Guardar"
        >
            <div className="space-y-4">
                <Input
                    label="Nombre del Marcador"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Ki-67, ER, PR..."
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Resultado</label>
                        <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.result}
                            onChange={e => setFormData({ ...formData, result: e.target.value })}
                        >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Positivo">Positivo</option>
                            <option value="Negativo">Negativo</option>
                            <option value="Equívoco">Equívoco</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Intensidad</label>
                        <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.intensity}
                            onChange={e => setFormData({ ...formData, intensity: e.target.value })}
                            disabled={formData.result !== 'Positivo'}
                        >
                            <option value="">N/A</option>
                            <option value="1+">1+ (Débil)</option>
                            <option value="2+">2+ (Moderada)</option>
                            <option value="3+">3+ (Fuerte)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Porcentaje (%)"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.percentage}
                        onChange={e => setFormData({ ...formData, percentage: parseInt(e.target.value) || 0 })}
                        disabled={formData.result !== 'Positivo'}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Patrón</label>
                        <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.pattern}
                            onChange={e => setFormData({ ...formData, pattern: e.target.value })}
                        >
                            <option value="">Seleccionar...</option>
                            <option value="Nuclear">Nuclear</option>
                            <option value="Citoplasmático">Citoplasmático</option>
                            <option value="Membranal">Membranal</option>
                            <option value="Mixto">Mixto</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Control Interno</label>
                    <select
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.control}
                        onChange={e => setFormData({ ...formData, control: e.target.value })}
                    >
                        <option value="Adecuado">Adecuado</option>
                        <option value="Inadecuado">Inadecuado</option>
                        <option value="No evaluable">No evaluable</option>
                    </select>
                </div>

                <Input
                    label="Notas / Comentarios"
                    textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observaciones adicionales..."
                    className="h-20"
                />

                {/* Image Upload Section */}
                <div className="border-t border-gray-200 pt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Imagen del Marcador</label>

                    {formData.imageUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-gray-300 bg-gray-50 group">
                            <img src={formData.imageUrl} alt="Preview" className="w-full h-32 object-contain" />
                            <button
                                onClick={() => setFormData({ ...formData, imageUrl: null })}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <ImageIcon size={24} className="mb-2 text-gray-400" />
                            <span className="text-sm">Clic para subir imagen</span>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default BiomarkerEditModal;
