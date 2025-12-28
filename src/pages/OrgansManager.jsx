import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Activity, Save, X } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const OrgansManager = () => {
    const { organs, addOrgan, updateOrgan, deleteOrgan } = useData();
    const [isEditing, setIsEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            updateOrgan({ ...formData, id: isEditing });
            setIsEditing(null);
        } else {
            addOrgan(formData);
        }
        setFormData({ name: '' });
        setShowForm(false);
    };

    const handleEdit = (organ) => {
        setFormData({ name: organ.name });
        setIsEditing(organ.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este órgano?')) {
            deleteOrgan(id);
        }
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setShowForm(false);
        setFormData({ name: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Órganos</h1>
                    <p className="text-text-secondary">Administra la lista de órganos y localizaciones.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)}>
                        <Plus size={18} className="mr-2" />
                        Nuevo Órgano
                    </Button>
                )}
            </div>

            {showForm && (
                <Card title={isEditing ? "Editar Órgano" : "Nuevo Órgano"} className="animate-fade-in border-primary/20 ring-4 ring-primary/5">
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Input
                                label="Nombre del Órgano / Localización"
                                placeholder="Ej. Piel, Mama, Estómago"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                {organs.map((organ) => (
                    <div key={organ.id} className="bg-white p-4 rounded-lg border border-border shadow-sm flex justify-between items-center hover:border-primary transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-main">{organ.name}</h3>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(organ)}
                                className="p-2 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-md transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(organ.id)}
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

export default OrgansManager;
