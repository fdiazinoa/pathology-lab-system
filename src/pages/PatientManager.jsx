import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, User } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { matchesPatientSearch, normalizePatientDocument } from '../services/patientSearch';
import { useData } from '../services/DataContext';

const PatientManager = () => {
    const navigate = useNavigate();
    const { patients, addPatient, insurers, exams, loading } = useData();
    const [selectedExamId, setSelectedExamId] = useState('');
    const caseUrl = (patientId) => `/cases/new?${new URLSearchParams({ patientId, ...(selectedExamId ? { examId: selectedExamId } : {}) })}`;
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [showNoResults, setShowNoResults] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [newPatient, setNewPatient] = useState({ name: '', age: '', sex: 'F', history: '', cedula: '', arsName: '', policyNumber: '' });

    const handleCreatePatient = async (e) => {
        e.preventDefault();
        if (saving) return;
        const continueToCase = e.nativeEvent.submitter?.value === 'create-case';
        setFormError('');

        const age = parseInt(newPatient.age);
        let finalCedula = newPatient.cedula;

        // Validation Logic
        if (age >= 18) {
            if (!finalCedula || finalCedula.trim() === '') {
                alert("La cédula es obligatoria para pacientes mayores de 18 años.");
                return;
            }
        } else {
            // Minor
            if (!finalCedula || finalCedula.trim() === '') {
                finalCedula = `M-${Date.now().toString().slice(-6)}`; // Auto-generate code
            }
        }

        if (patients.some(p => normalizePatientDocument(p.cedula || p.identification_number) === normalizePatientDocument(finalCedula))) {
            setFormError('Ya existe un paciente con esta cédula o documento. Búsquelo antes de crear otro.');
            return;
        }

        const patient = {
            id: `P-${1000 + patients.length + 1}`,
            ...newPatient,
            cedula: finalCedula,
            identification_number: finalCedula,
            createdAt: new Date().toISOString().split('T')[0]
        };
        setSaving(true);
        try {
            const savedPatient = await addPatient(patient);
            if (!savedPatient?.id) throw new Error('Patient was not saved');
            if (continueToCase) {
                navigate(caseUrl(savedPatient.id));
                return;
            }
            setShowForm(false);
            setSearchTerm('');
            setNewPatient({ name: '', age: '', sex: 'F', history: '', cedula: '', arsName: '', policyNumber: '' });
        } catch (error) {
            setFormError(error.code === '23505' ? 'Ya existe un paciente con este documento.' : 'No se pudo guardar el paciente. Intente nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    const filteredPatients = patients.filter(p => matchesPatientSearch(p, searchTerm));
    const handleSearch = (event) => {
        event.preventDefault();
        if (!loading && searchTerm.trim() && filteredPatients.length === 0) setShowNoResults(true);
    };
    const createFromSearch = () => {
        const query = searchTerm.trim();
        const isDocument = /^[\d\s-]+$/.test(query);
        setNewPatient({ name: isDocument ? '' : query, age: '', sex: 'F', history: '', cedula: isDocument ? query : '', arsName: '', policyNumber: '' });
        setFormError('');
        setShowNoResults(false);
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Pacientes</h1>
                    <p className="text-text-secondary">Administra el registro de pacientes.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} className="mr-2" />
                    Nuevo Paciente
                </Button>
            </div>

            {showForm && (
                <Card title="Registrar Nuevo Paciente" className="animate-fade-in border-primary/20 ring-4 ring-primary/5">
                    <form onSubmit={handleCreatePatient} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Nombre Completo"
                                value={newPatient.name}
                                onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Edad"
                                type="number"
                                value={newPatient.age}
                                onChange={e => setNewPatient({ ...newPatient, age: e.target.value })}
                                required
                            />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text-main">Sexo</label>
                                <select
                                    className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={newPatient.sex}
                                    onChange={e => setNewPatient({ ...newPatient, sex: e.target.value })}
                                >
                                    <option value="F">Femenino</option>
                                    <option value="M">Masculino</option>
                                </select>
                            </div>
                            <Input
                                label="Cédula / Documento"
                                placeholder={newPatient.age && parseInt(newPatient.age) < 18 ? "Opcional (se generará código)" : "Obligatorio si > 18 años"}
                                value={newPatient.cedula}
                                onChange={e => setNewPatient({ ...newPatient, cedula: e.target.value })}
                            />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text-main">ARS / Seguro (Opcional)</label>
                                <select
                                    className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={newPatient.arsName}
                                    onChange={e => setNewPatient({ ...newPatient, arsName: e.target.value })}
                                >
                                    <option value="">Ninguno / Privado</option>
                                    {insurers && insurers.map(ins => (
                                        <option key={ins.id} value={ins.name}>{ins.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="No. de Póliza"
                                placeholder="Opcional"
                                value={newPatient.policyNumber}
                                onChange={e => setNewPatient({ ...newPatient, policyNumber: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Antecedentes / Historia Clínica"
                            textarea
                            value={newPatient.history}
                            onChange={e => setNewPatient({ ...newPatient, history: e.target.value })}
                        />
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" variant="ghost" disabled={saving} onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit" isLoading={saving}>Guardar Paciente</Button>
                            <Button type="submit" value="create-case" isLoading={saving}>Guardar y crear caso</Button>
                        </div>
                        {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
                    </form>
                </Card>
            )}

            <Card>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label htmlFor="patient-case-exam" className="text-sm font-medium text-text-main">Tipo de caso / Examen a realizar</label>
                    <select id="patient-case-exam" className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                        <option value="">Seleccionar al completar el caso...</option>
                        {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.code} - {ex.name}</option>)}
                    </select>
                </div>
                <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row gap-3">
                    <Input
                        className="flex-1"
                        aria-label="Buscar por nombre, apellidos o cédula"
                        placeholder="Buscar por nombre, apellidos o cédula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" disabled={loading || !searchTerm.trim()}><Search size={18} className="mr-2" />Buscar</Button>
                </form>
                {!loading && filteredPatients.length === 0 && (
                    <div className="text-center py-6 space-y-3" role="status">
                        <p className="text-text-secondary">{searchTerm.trim() ? 'No se encontraron pacientes con estos datos.' : 'Todavía no hay pacientes registrados.'}</p>
                        {searchTerm.trim() && <Button variant="secondary" onClick={() => setShowNoResults(true)}>Crear paciente con estos datos</Button>}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map(p => (
                        <div key={p.id} className="flex flex-col gap-2">
                        <Link to={`/patients/${p.id}`} className="block group flex-1">
                            <div className="p-4 border border-border rounded-lg group-hover:border-primary transition-colors bg-white flex items-start gap-4 h-full shadow-sm group-hover:shadow-md">
                                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">{p.name || p.full_name}</h3>
                                    <p className="text-xs text-text-secondary">Cédula / Documento: {p.cedula || p.identification_number || 'Sin documento'}</p>
                                    <p className="text-xs text-text-secondary mb-2">ID: {p.id} • {p.age} años • {p.sex}</p>
                                    <p className="text-sm text-text-secondary line-clamp-2">{p.history || p.medical_history}</p>
                                </div>
                            </div>
                        </Link>
                        <Link to={caseUrl(p.id)} className="inline-flex justify-center items-center rounded-md bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-hover">Crear caso</Link>
                        </div>
                    ))}
                </div>
            </Card>
            <Modal isOpen={showNoResults} onClose={() => setShowNoResults(false)} title="Paciente no encontrado" onConfirm={createFromSearch} confirmText="Crear paciente">
                No encontramos un paciente con “{searchTerm.trim()}”. ¿Desea crear uno? Podrá revisar y completar sus datos antes de guardarlo.
            </Modal>
        </div>
    );
};

export default PatientManager;
