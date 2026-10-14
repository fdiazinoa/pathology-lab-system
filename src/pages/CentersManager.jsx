import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Building, Save, X, MapPin, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const CentersManager = () => {
    const { centers, addCenter, updateCenter, deleteCenter, can } = useData();
    const [search, setSearch] = useState('');
    const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    const filteredCenters = centers.filter(center => {
        const text = normalize([center.id, center.name, center.address, center.phone, center.main_route].join(' '));
        return terms.every(term => text.includes(term));
    });
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
                    <Button permission={['centers', 'create']} onClick={() => setShowForm(true)}>
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

            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div className="relative w-full sm:max-w-lg">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                        <input
                            type="search"
                            aria-label="Buscar centros"
                            placeholder="Buscar por nombre, código, dirección, teléfono o ruta..."
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            className="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <p className="text-sm text-text-secondary whitespace-nowrap" role="status">
                        {filteredCenters.length} de {centers.length} centros
                    </p>
                </div>
                <div className="overflow-auto max-h-[70vh] rounded-lg border border-border bg-white shadow-sm">
                    <table className="w-full min-w-[900px] text-sm text-left">
                        <caption className="sr-only">Listado de centros de origen</caption>
                        <thead className="sticky top-0 z-10 bg-gray-50 text-text-secondary">
                            <tr>
                                {['Código', 'Centro', 'Dirección', 'Teléfono', 'Ruta', 'Acciones'].map(title => (
                                    <th key={title} scope="col" className="px-4 py-3 font-semibold border-b border-border">{title}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredCenters.map(center => (
                                <tr key={center.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{center.id}</td>
                                    <th scope="row" className="px-4 py-3 font-semibold text-text-main">{center.name}</th>
                                    <td className="px-4 py-3 text-text-secondary max-w-xs">{center.address || '—'}</td>
                                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{center.phone || '—'}</td>
                                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{center.main_route || '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            {center.location && <a href={center.location} target="_blank" rel="noopener noreferrer"
                                                aria-label={`Ver ${center.name} en el mapa`} title="Ver en mapa"
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md">
                                                <MapPin size={16} />
                                            </a>}
                                            <button disabled={!can('centers', 'edit')} onClick={() => handleEdit(center)} aria-label={`Editar ${center.name}`} title="Editar"
                                                className="p-2 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-md">
                                                <Edit2 size={16} />
                                            </button>
                                            <button disabled={!can('centers', 'delete')} onClick={() => handleDelete(center.id)} aria-label={`Eliminar ${center.name}`} title="Eliminar"
                                                className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCenters.length === 0 && (
                                <tr><td colSpan={6} className="py-12 text-center text-text-secondary">
                                    {centers.length === 0 ? <>
                                        <Building size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No hay centros registrados.</p>
                                        <Button variant="ghost" permission={['centers', 'create']} onClick={() => setShowForm(true)} className="mt-2">Crear el primero</Button>
                                    </> : <>
                                        <p>No se encontraron centros con esos datos.</p>
                                        <Button variant="ghost" onClick={() => setSearch('')} className="mt-2">Limpiar búsqueda</Button>
                                    </>}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CentersManager;
