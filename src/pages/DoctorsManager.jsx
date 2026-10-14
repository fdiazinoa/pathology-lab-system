import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Stethoscope, Search } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import SignaturePad from '../components/SignaturePad';
import { useData } from '../services/DataContext';

const DoctorsManager = () => {
    const { centers, doctors, addDoctor, updateDoctor, deleteDoctor, can } = useData();
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const centerNames = new Map(centers.map(center => [center.id, center.name]));
    const centerLabel = (doctor) => centerNames.get(doctor.center_id) || doctor.source_center_id || '—';
    const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    const filteredDoctors = doctors.filter(doctor => {
        const text = normalize([doctor.id, doctor.lis_id, doctor.name, doctor.specialty, centerLabel(doctor), doctor.center_id, doctor.source_center_id, doctor.source_status, doctor.license, doctor.email, doctor.mobile, doctor.phone].join(' '));
        return terms.every(term => text.includes(term));
    });
    const [isEditing, setIsEditing] = useState(false);
    const [currentDoctor, setCurrentDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        license: '',
        email: '',
        signatureUrl: ''
    });

    const handleEdit = (doctor) => {
        setShowForm(true);
        setIsEditing(true);
        setCurrentDoctor(doctor);
        setFormData({
            name: doctor.name,
            license: doctor.license || '',
            email: doctor.email || '',
            signatureUrl: doctor.signatureUrl || ''
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este doctor?')) {
            deleteDoctor(id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing && currentDoctor) {
                await updateDoctor({ ...currentDoctor, ...formData });
            } else {
                await addDoctor(formData);
            }
            resetForm();
        } catch (error) {
            window.alert(error.message || 'No se pudo guardar el médico.');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setIsEditing(false);
        setCurrentDoctor(null);
        setFormData({ name: '', license: '', email: '', signatureUrl: '' });
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Stethoscope size={32} className="text-primary shrink-0" />
                    <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Doctores</h1>
                    <p className="text-text-secondary">Administra el maestro de médicos del laboratorio.</p>
                    </div>
                </div>
                {!showForm && <Button permission={['doctors', 'create']} onClick={() => setShowForm(true)}><Plus size={18} className="mr-2" />Nuevo Doctor</Button>}
            </div>

            <div className="space-y-6">
                {/* Form */}
                {showForm && <div className="max-w-2xl">
                    <Card title={isEditing ? 'Editar Doctor' : 'Nuevo Doctor'}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Nombre Completo"
                                placeholder="Dr. Juan Pérez"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Exequatur / Licencia (opcional)"
                                placeholder="MP-12345"
                                value={formData.license}
                                onChange={e => setFormData({ ...formData, license: e.target.value })}
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="doctor@lab.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-main">Firma Digital</label>
                                {formData.signatureUrl ? (
                                    <div className="border border-border rounded-lg p-4 bg-gray-50 flex flex-col items-center gap-3">
                                        <img src={formData.signatureUrl} alt="Firma" className="h-16 object-contain" />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, signatureUrl: '' })}
                                        >
                                            Cambiar Firma
                                        </Button>
                                    </div>
                                ) : (
                                    <SignaturePad onSave={(data) => setFormData({ ...formData, signatureUrl: data })} />
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="submit" className="flex-1">
                                    <Save size={16} className="mr-2" />
                                    {isEditing ? 'Actualizar' : 'Guardar'}
                                </Button>
                                {showForm && (
                                    <Button type="button" variant="secondary" onClick={resetForm} aria-label="Cancelar edición">
                                        <X size={16} />
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>}

                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="relative w-full sm:max-w-lg">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                            <input type="search" aria-label="Buscar doctores" value={search} onChange={event => setSearch(event.target.value)}
                                placeholder="Buscar por nombre, código, especialidad, centro o contacto..."
                                className="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <p className="text-sm text-text-secondary whitespace-nowrap" role="status">{filteredDoctors.length} de {doctors.length} doctores</p>
                    </div>
                    <div className="overflow-auto max-h-[70vh] rounded-lg border border-border bg-white shadow-sm">
                        <table className="w-full min-w-[1000px] text-sm text-left">
                            <caption className="sr-only">Listado de doctores</caption>
                            <thead className="sticky top-0 z-10 bg-gray-50 text-text-secondary"><tr>
                                {['Código', 'Doctor', 'Especialidad', 'Centro', 'Estado', 'Contacto', 'Acciones'].map(title => (
                                    <th key={title} scope="col" className="px-4 py-3 font-semibold border-b border-border">{title}</th>
                                ))}
                            </tr></thead>
                            <tbody className="divide-y divide-border">
                                {filteredDoctors.map(doctor => <tr key={doctor.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{doctor.id}</td>
                                    <th scope="row" className="px-4 py-3 font-semibold text-text-main">{doctor.name}</th>
                                    <td className="px-4 py-3 text-text-secondary">{doctor.specialty || '—'}</td>
                                    <td className="px-4 py-3 text-text-secondary">{centerLabel(doctor)}</td>
                                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{doctor.source_status || (doctor.is_active === false ? 'INACTIVO' : '—')}</td>
                                    <td className="px-4 py-3 text-text-secondary">
                                        <div className="whitespace-nowrap">{doctor.mobile || doctor.phone || '—'}</div>
                                        {doctor.email && <div className="text-xs mt-1">{doctor.email}</div>}
                                    </td>
                                    <td className="px-4 py-3"><div className="flex gap-1">
                                        <button disabled={!can('doctors', 'edit')} onClick={() => handleEdit(doctor)} aria-label={`Editar ${doctor.name}`} title="Editar"
                                            className="p-2 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-md"><Edit2 size={16} /></button>
                                        <button disabled={!can('doctors', 'delete')} onClick={() => handleDelete(doctor.id)} aria-label={`Eliminar ${doctor.name}`} title="Eliminar"
                                            className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
                                    </div></td>
                                </tr>)}
                                {filteredDoctors.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-text-secondary">
                                    <p>{doctors.length === 0 ? 'No hay doctores registrados.' : 'No se encontraron doctores con esos datos.'}</p>
                                    {search && <Button variant="ghost" onClick={() => setSearch('')} className="mt-2">Limpiar búsqueda</Button>}
                                </td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorsManager;
