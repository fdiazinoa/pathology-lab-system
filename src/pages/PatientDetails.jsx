import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, FileText, Calendar, Activity, Edit2, Save, X } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const PatientDetails = () => {
    const { id } = useParams();
    const { patients, cases, updatePatient } = useData();
    const [isEditing, setIsEditing] = useState(false);

    const patient = patients.find(p => p.id === id);
    const patientCases = cases.filter(c => c.patientId === id);

    // Form State
    const [formData, setFormData] = useState({});

    if (!patient) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold text-text-main">Paciente no encontrado</h2>
                <Link to="/patients" className="text-primary hover:underline mt-4 block">Volver a la lista</Link>
            </div>
        );
    }

    const handleEditClick = () => {
        setFormData({ ...patient });
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setFormData({});
    };

    const handleSaveClick = () => {
        updatePatient(formData);
        setIsEditing(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getStatusColor = (status) => {
        return status === 'Finalizado' ? 'text-success bg-green-50 border-green-200' : 'text-warning bg-yellow-50 border-yellow-200';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/patients">
                        <Button variant="ghost">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Ficha del Paciente</h1>
                        <p className="text-text-secondary">Información personal e historial clínico.</p>
                    </div>
                </div>
                <div>
                    {!isEditing ? (
                        <Button onClick={handleEditClick} variant="outline">
                            <Edit2 size={18} className="mr-2" /> Editar Ficha
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button onClick={handleCancelClick} variant="ghost" className="text-danger">
                                <X size={18} className="mr-2" /> Cancelar
                            </Button>
                            <Button onClick={handleSaveClick}>
                                <Save size={18} className="mr-2" /> Guardar Cambios
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient Info Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <div className="flex flex-col items-center text-center p-4 border-b border-border">
                            <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center text-primary mb-4">
                                <User size={48} />
                            </div>
                            {!isEditing ? (
                                <>
                                    <h2 className="text-xl font-bold text-text-main">{patient.name}</h2>
                                    <p className="text-sm text-text-secondary">ID: {patient.id}</p>
                                    <p className="text-sm font-medium text-primary mt-1">{patient.cedula || 'Sin Documento'}</p>
                                </>
                            ) : (
                                <div className="w-full space-y-2">
                                    <Input label="Nombre Completo" name="name" value={formData.name} onChange={handleChange} />
                                    <Input label="Cédula / ID" name="cedula" value={formData.cedula || ''} onChange={handleChange} />
                                </div>
                            )}
                        </div>
                        <div className="p-4 space-y-4">
                            {!isEditing ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Edad</span>
                                        <span className="font-medium">{patient.age} años</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Sexo</span>
                                        <span className="font-medium">{patient.sex === 'F' ? 'Femenino' : 'Masculino'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Ciudad</span>
                                        <span className="font-medium">{patient.city || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Región</span>
                                        <span className="font-medium">{patient.region || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Registrado</span>
                                        <span className="font-medium">{patient.createdAt}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="Edad" name="age" type="number" value={formData.age} onChange={handleChange} />
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-text-main">Sexo</label>
                                            <select
                                                name="sex"
                                                value={formData.sex}
                                                onChange={handleChange}
                                                className="px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary outline-none bg-white"
                                            >
                                                <option value="F">Femenino</option>
                                                <option value="M">Masculino</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Input label="Ciudad" name="city" value={formData.city || ''} onChange={handleChange} />
                                    <Input label="Región" name="region" value={formData.region || ''} onChange={handleChange} />
                                </>
                            )}
                        </div>
                    </Card>

                    <Card title="Antecedentes Clínicos">
                        {!isEditing ? (
                            <p className="text-sm text-text-main leading-relaxed">
                                {patient.history || "No se han registrado antecedentes."}
                            </p>
                        ) : (
                            <textarea
                                name="history"
                                value={formData.history || ''}
                                onChange={handleChange}
                                className="w-full h-32 px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary outline-none resize-none"
                                placeholder="Describa los antecedentes clínicos..."
                            />
                        )}
                    </Card>
                </div>

                {/* Exam History */}
                <div className="lg:col-span-2">
                    <Card title={`Historial de Exámenes (${patientCases.length})`}>
                        {patientCases.length > 0 ? (
                            <div className="space-y-4">
                                {patientCases.map((c) => (
                                    <div key={c.id} className="border border-border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold bg-gray-100 text-text-secondary`}>
                                                    {c.type}
                                                </span>
                                                <span className="text-sm text-text-secondary flex items-center gap-1">
                                                    <Calendar size={14} /> {c.createdAt}
                                                </span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-lg text-primary mb-1">{c.organ}</h3>

                                        {c.diagnosis && (
                                            <div className="flex items-start gap-2 mt-2 bg-white p-2 rounded border border-gray-100">
                                                <Activity size={16} className="text-info shrink-0 mt-0.5" />
                                                <p className="text-sm text-text-main font-medium">{c.diagnosis}</p>
                                            </div>
                                        )}

                                        <div className="mt-4 flex justify-end">
                                            <Link to={`/cases/${c.id}`}>
                                                <Button variant="secondary" size="sm">
                                                    <FileText size={16} className="mr-2" />
                                                    Ver Informe
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-text-secondary">
                                <p>Este paciente no tiene exámenes registrados.</p>
                                <Link to="/cases/new">
                                    <Button variant="ghost" className="mt-2 text-primary">
                                        + Crear Nuevo Caso
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PatientDetails;
