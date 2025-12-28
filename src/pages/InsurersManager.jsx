import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Shield, Save, X } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const InsurersManager = () => {
    const { insurers, addInsurer, updateInsurer, deleteInsurer } = useData();
    const [isEditing, setIsEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', tariff: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            updateInsurer({ ...formData, id: isEditing });
            setIsEditing(null);
        } else {
            addInsurer(formData);
        }
        setFormData({ name: '', tariff: '' });
        setShowForm(false);
    };

    const handleEdit = (insurer) => {
        setFormData({ name: insurer.name, tariff: insurer.tariff });
        setIsEditing(insurer.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta aseguradora?')) {
            deleteInsurer(id);
        }
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setShowForm(false);
        setFormData({ name: '', tariff: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Aseguradoras</h1>
                    <p className="text-text-secondary">Administra las ARS y sus tarifas.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)}>
                        <Plus size={18} className="mr-2" />
                        Nueva Aseguradora
                    </Button>
                )}
            </div>

            {showForm && (
                <Card title={isEditing ? "Editar Aseguradora" : "Nueva Aseguradora"} className="animate-fade-in border-primary/20 ring-4 ring-primary/5">
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Input
                                label="Nombre de la ARS"
                                placeholder="Ej. ARS Humano"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <Input
                                label="Tarifa / Porcentaje"
                                placeholder="Ej. 80% o $1500"
                                value={formData.tariff}
                                onChange={e => setFormData({ ...formData, tariff: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex gap-2 pb-1">
                            <Button type="button" variant="ghost" onClick={cancelEdit}>
                                <X size={18} />
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
                {insurers.map((insurer) => (
                    <div key={insurer.id} className="bg-white p-4 rounded-lg border border-border shadow-sm flex justify-between items-center hover:border-primary transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-main">{insurer.name}</h3>
                                <p className="text-sm text-text-secondary">Tarifa: <span className="font-medium text-primary">{insurer.tariff}</span></p>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(insurer)}
                                className="p-2 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-md transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(insurer.id)}
                                className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InsurersManager;
