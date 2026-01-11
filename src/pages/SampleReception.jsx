import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Save, Printer, Plus, Search, User, Building, FileText, Tag, Clock } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useData } from '../services/DataContext';

const SampleReception = () => {
    const navigate = useNavigate();
    const { patients, doctors, centers: originCenters, insurers, addCase, addPatient, currentUser, addAuditLog } = useData();
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);

    // Patient Search State
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientResults, setShowPatientResults] = useState(false);
    const [showNewPatientModal, setShowNewPatientModal] = useState(false);
    const [newPatientData, setNewPatientData] = useState({ name: '', age: '', sex: 'F', history: '', cedula: '' });

    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        originCenterId: '',
        sampleType: 'Biopsia',
        priority: 'Normal', // Normal, Urgente
        description: '',
        collectionDate: new Date().toISOString().slice(0, 16),
        paymentType: 'Privado',
        arsName: '',
        policyNumber: ''
    });

    const [generatedSample, setGeneratedSample] = useState(null);
    const [showLabelModal, setShowLabelModal] = useState(false);

    // Patient Search Logic
    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        (p.cedula && p.cedula.includes(patientSearch)) ||
        p.id.toLowerCase().includes(patientSearch.toLowerCase())
    );

    const handleSelectPatient = (patient) => {
        setFormData({ ...formData, patientId: patient.id });
        setPatientSearch(patient.name);
        setShowPatientResults(false);
    };

    const handleCreatePatient = (e) => {
        e.preventDefault();
        const age = parseInt(newPatientData.age);
        let finalCedula = newPatientData.cedula;

        if (age >= 18 && (!finalCedula || finalCedula.trim() === '')) {
            alert("La cédula es obligatoria para mayores de 18 años.");
            return;
        }

        if (age < 18 && (!finalCedula || finalCedula.trim() === '')) {
            finalCedula = `M-${Date.now().toString().slice(-6)}`;
        }

        const patient = {
            id: `P-${1000 + patients.length + 1}`,
            ...newPatientData,
            cedula: finalCedula,
            createdAt: new Date().toISOString().split('T')[0]
        };

        addPatient(patient);
        handleSelectPatient(patient);
        setShowNewPatientModal(false);
        setNewPatientData({ name: '', age: '', sex: 'F', history: '', cedula: '' });
    };

    // Click outside search results
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowPatientResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Generate IDs
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const sampleId = `S-${year}-${randomSuffix}`;
        const caseId = `C-${year}-${randomSuffix}`; // In a real app, logic might differ

        const selectedPatient = patients.find(p => p.id === formData.patientId);
        const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
        const selectedCenter = originCenters.find(c => c.id === formData.originCenterId);

        const newCase = {
            id: caseId,
            sampleId: sampleId,
            patientId: formData.patientId,
            patientName: selectedPatient ? selectedPatient.name : 'Desconocido',
            age: selectedPatient ? selectedPatient.age : '?',
            sex: selectedPatient ? selectedPatient.sex : '?',
            doctorId: formData.doctorId,
            originCenter: selectedCenter ? selectedCenter.name : 'Desconocido',
            type: formData.sampleType,
            organ: 'Por definir (Macro)', // Will be defined in Macroscopy
            status: 'Recibida', // Initial status
            priority: formData.priority,
            clinicalData: formData.description,
            paymentType: formData.paymentType,
            arsName: formData.arsName,
            policyNumber: formData.policyNumber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            receivedBy: currentUser ? currentUser.name : 'Sistema',
            receivedAt: new Date().toISOString(),
            auditLogs: [
                {
                    date: new Date().toISOString(),
                    user: currentUser ? currentUser.name : 'Sistema',
                    action: 'Recepción de Muestra',
                    details: `Muestra ${sampleId} recibida.`
                }
            ]
        };

        // Simulate API call
        setTimeout(() => {
            addCase(newCase);
            setGeneratedSample({ ...newCase, patient: selectedPatient, doctor: selectedDoctor });
            setLoading(false);
            setShowLabelModal(true);
        }, 800);
    };

    const handlePrint = () => {
        window.print();
        if (generatedSample) {
            addAuditLog(generatedSample.id, 'Generación de QR', `Etiqueta de muestra impresa para el caso ${generatedSample.id}.`);
        }
    };

    const handleClose = () => {
        setShowLabelModal(false);
        navigate('/dashboard');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Recepción de Muestras</h1>
                <p className="text-text-secondary">Registro inicial y etiquetado de nuevas muestras.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card title="Datos de la Muestra">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Patient Search & Selection */}
                        <div className="flex flex-col gap-1.5 relative" ref={searchRef}>
                            <label className="text-sm font-medium text-text-main">Paciente (Nombre o Cédula)</label>
                            <div className="relative">
                                <Input
                                    placeholder="Buscar por nombre o cédula..."
                                    value={patientSearch}
                                    onChange={e => {
                                        setPatientSearch(e.target.value);
                                        setShowPatientResults(true);
                                        if (formData.patientId) setFormData({ ...formData, patientId: '' });
                                    }}
                                    onFocus={() => setShowPatientResults(true)}
                                    icon={<Search size={18} />}
                                />
                                {showPatientResults && patientSearch.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filteredPatients.length > 0 ? (
                                            filteredPatients.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-100 last:border-0"
                                                    onClick={() => handleSelectPatient(p)}
                                                >
                                                    <span className="font-bold text-sm">{p.name}</span>
                                                    <span className="text-xs text-text-secondary">ID: {p.id} • Cédula: {p.cedula || 'N/A'}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-center">
                                                <p className="text-sm text-text-secondary mb-2">No se encontró el paciente</p>
                                                <Button
                                                    size="sm"
                                                    type="button"
                                                    onClick={() => setShowNewPatientModal(true)}
                                                >
                                                    <Plus size={16} className="mr-1" />
                                                    Registrar Nuevo Paciente
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {formData.patientId && (
                                <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-100">
                                    <User size={14} />
                                    Paciente Seleccionado: {patients.find(p => p.id === formData.patientId)?.name}
                                </div>
                            )}
                        </div>

                        {/* Doctor */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Médico Remitente</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.doctorId}
                                onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Doctor...</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Origin Center */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Centro de Origen</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.originCenterId}
                                onChange={e => setFormData({ ...formData, originCenterId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Centro...</option>
                                {originCenters && originCenters.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Tipo de Pago / Cobertura</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.paymentType}
                                onChange={e => setFormData({ ...formData, paymentType: e.target.value })}
                            >
                                <option value="Privado">Privado</option>
                                <option value="Asegurado">Asegurado</option>
                            </select>
                        </div>

                        {/* Insurance Fields */}
                        {formData.paymentType === 'Asegurado' && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text-main">ARS / Seguro</label>
                                    <select
                                        className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.arsName}
                                        onChange={e => setFormData({ ...formData, arsName: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar ARS...</option>
                                        {insurers && insurers.map(ins => (
                                            <option key={ins.id} value={ins.name}>{ins.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="No. de Póliza"
                                    placeholder="Ej. 001-2345678-9"
                                    value={formData.policyNumber}
                                    onChange={e => setFormData({ ...formData, policyNumber: e.target.value })}
                                    required
                                />
                            </>
                        )}

                        {/* Sample Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Tipo de Muestra</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.sampleType}
                                onChange={e => setFormData({ ...formData, sampleType: e.target.value })}
                            >
                                <option value="Biopsia">Biopsia</option>
                                <option value="Citología">Citología</option>
                                <option value="Pieza Quirúrgica">Pieza Quirúrgica</option>
                                <option value="Revisión de Láminas">Revisión de Láminas</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Prioridad</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="Normal">Normal</option>
                                <option value="Urgente">Urgente</option>
                                <option value="Crítico">Crítico (Intraoperatoria)</option>
                            </select>
                        </div>

                        {/* Collection Date */}
                        <Input
                            label="Fecha/Hora de Recolección"
                            type="datetime-local"
                            value={formData.collectionDate}
                            onChange={e => setFormData({ ...formData, collectionDate: e.target.value })}
                            required
                        />

                        {/* Description */}
                        <div className="md:col-span-2">
                            <Input
                                label="Descripción / Observaciones"
                                textarea
                                placeholder="Detalles sobre la muestra, envase, estado..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        <Save size={20} className="mr-2" />
                        Registrar Muestra
                    </Button>
                </div>
            </form>

            {/* Label Printing Modal */}
            {showLabelModal && generatedSample && (
                <Modal
                    isOpen={showLabelModal}
                    onClose={handleClose}
                    title="Etiqueta de Muestra Generada"
                >
                    <div className="flex flex-col items-center space-y-6 p-4">
                        <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg bg-white w-full max-w-sm" id="printable-label">
                            <div className="flex gap-4 items-center">
                                <QRCodeCanvas value={generatedSample.id} size={80} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg truncate">{generatedSample.sampleId}</h3>
                                    <p className="text-xs font-mono text-gray-500">{generatedSample.id}</p>
                                    <p className="font-bold truncate mt-1">{generatedSample.patientName}</p>
                                    <p className="text-xs text-gray-600 truncate">{generatedSample.type} - {generatedSample.priority}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date().toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full">
                            <Button variant="secondary" onClick={handlePrint} className="flex-1">
                                <Printer size={18} className="mr-2" />
                                Imprimir Etiqueta
                            </Button>
                            <Button onClick={handleClose} className="flex-1">
                                Finalizar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
            {/* Quick Patient Registration Modal */}
            {showNewPatientModal && (
                <Modal
                    isOpen={showNewPatientModal}
                    onClose={() => setShowNewPatientModal(false)}
                    title="Registro Rápido de Paciente"
                >
                    <form onSubmit={handleCreatePatient} className="space-y-4 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre Completo"
                                value={newPatientData.name}
                                onChange={e => setNewPatientData({ ...newPatientData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Edad"
                                type="number"
                                value={newPatientData.age}
                                onChange={e => setNewPatientData({ ...newPatientData, age: e.target.value })}
                                required
                            />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text-main">Sexo</label>
                                <select
                                    className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={newPatientData.sex}
                                    onChange={e => setNewPatientData({ ...newPatientData, sex: e.target.value })}
                                >
                                    <option value="F">Femenino</option>
                                    <option value="M">Masculino</option>
                                </select>
                            </div>
                            <Input
                                label="Cédula / Documento"
                                value={newPatientData.cedula}
                                onChange={e => setNewPatientData({ ...newPatientData, cedula: e.target.value })}
                                placeholder={newPatientData.age && parseInt(newPatientData.age) < 18 ? "Opcional" : "Obligatorio"}
                            />
                        </div>
                        <Input
                            label="Antecedentes Relevantes"
                            textarea
                            value={newPatientData.history}
                            onChange={e => setNewPatientData({ ...newPatientData, history: e.target.value })}
                        />
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setShowNewPatientModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                Guardar y Seleccionar
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default SampleReception;
