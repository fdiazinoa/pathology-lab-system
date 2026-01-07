import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Building, Save, X, MapPin, Phone } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const CentersManager = () => {
    const { centers, addCenter, updateCenter, deleteCenter } = useData();
    const [isEditing, setIsEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', address: '', phone: '', location: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting center form...", formData);
        try {
            if (isEditing) {
                console.log("Updating center...", isEditing);
                await updateCenter(isEditing, formData);
                setIsEditing(null);
            } else {
                console.log("Adding new center...");
                await addCenter(formData);
            }
            console.log("Center saved successfully.");
            setFormData({ name: '', address: '', phone: '', location: '' });
            setShowForm(false);
        } catch (error) {
            console.error("Error saving center:", error);
            alert("Error al guardar el centro. Revisa la consola.");
        }
    };

    const handleEdit = (center) => {
        setFormData({
            name: center.name,
            address: center.address || '',
            phone: center.phone || '',
            location: center.location || ''
        });
        setIsEditing(center.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este centro?')) {
            await deleteCenter(id);
        }
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setShowForm(false);
        setFormData({ name: '', address: '', phone: '', location: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Centros de Origen</h1>
                    <p className="text-text-secondary">Administra los hospitales y clínicas de procedencia.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)}>
                        <Plus size={18} className="mr-2" />
                        Nuevo Centro
                    </Button>
                )}
            </div>

            {showForm && (
                <Card title={isEditing ? "Editar Centro" : "Nuevo Centro"} className="animate-fade-in border-primary/20 ring-4 ring-primary/5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre del Centro"
                                placeholder="Ej. Hospital Central"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Teléfono"
                                placeholder="Ej. (555) 123-4567"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <Input
                                label="Dirección"
                                placeholder="Ej. Av. Principal 123"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="md:col-span-2"
                            />
                            <Input
                                label="Ubicación (Google Maps URL)"
                                placeholder="Ej. https://maps.google.com/?q=..."
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="md:col-span-2"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={cancelEdit}>
                                <X size={18} className="mr-2" />
                                Cancelar
                            </Button>
                            <Button type="submit">
                                <Save size={18} className="mr-2" />
                                Guardar
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {centers.map((center) => (
                    <div key={center.id} className="bg-white p-5 rounded-lg border border-border shadow-sm hover:border-primary transition-colors group relative">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                <Building size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-text-main text-lg truncate" title={center.name}>{center.name}</h3>

                                <div className="mt-2 space-y-1">
                                    {center.address && (
                                        <div className="flex items-start gap-2 text-sm text-text-secondary">
                                            <MapPin size={14} className="mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{center.address}</span>
                                        </div>
                                    )}
                                    {center.phone && (
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Phone size={14} className="shrink-0" />
                                            <span>{center.phone}</span>
                                        </div>
                                    )}
                                    {center.location && (
                                        <a
                                            href={center.location}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                                        >
                                            <MapPin size={12} />
                                            Ver en Mapa
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-md">
                            <button
                                onClick={() => handleEdit(center)}
                                className="p-2 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-md transition-colors"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(center.id)}
                                className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {centers.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <Building size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No hay centros registrados.</p>
                        <Button variant="ghost" onClick={() => setShowForm(true)} className="mt-2">
                            Crear el primero
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CentersManager;
