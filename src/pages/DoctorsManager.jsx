import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Stethoscope } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import SignaturePad from '../components/SignaturePad';
import { useData } from '../services/DataContext';

const DoctorsManager = () => {
    const { doctors, addDoctor, updateDoctor, deleteDoctor } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [currentDoctor, setCurrentDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        license: '',
        email: '',
        signatureUrl: ''
    });

    const handleEdit = (doctor) => {
        setIsEditing(true);
        setCurrentDoctor(doctor);
        setFormData({
            name: doctor.name,
            license: doctor.license,
            email: doctor.email || '',
            signatureUrl: doctor.signatureUrl || ''
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este doctor?')) {
            deleteDoctor(id);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing && currentDoctor) {
            updateDoctor({ ...currentDoctor, ...formData });
        } else {
            addDoctor(formData);
        }
        resetForm();
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentDoctor(null);
        setFormData({ name: '', license: '', email: '', signatureUrl: '' });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Stethoscope size={32} className="text-primary" />
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Doctores</h1>
                    <p className="text-text-secondary">Administra el personal médico autorizado para firmar informes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form */}
                <div className="md:col-span-1">
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
                                label="Exequatur / Licencia"
                                placeholder="MP-12345"
                                value={formData.license}
                                onChange={e => setFormData({ ...formData, license: e.target.value })}
                                required
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
                                {isEditing && (
                                    <Button type="button" variant="secondary" onClick={resetForm}>
                                        <X size={16} />
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <Card title="Doctores Registrados">
                        <div className="space-y-3">
                            {doctors.length === 0 ? (
                                <p className="text-text-secondary text-center py-4">No hay doctores registrados.</p>
                            ) : (
                                doctors.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center p-3 border border-border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold">
                                                {doc.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-text-main">{doc.name}</h4>
                                                <p className="text-xs text-text-secondary">{doc.license}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(doc)}>
                                                <Edit2 size={16} className="text-text-secondary" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.id)}>
                                                <Trash2 size={16} className="text-danger" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DoctorsManager;
