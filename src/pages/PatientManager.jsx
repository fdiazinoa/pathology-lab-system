import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, User } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const PatientManager = () => {
    const { patients, addPatient, insurers } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newPatient, setNewPatient] = useState({ name: '', age: '', sex: 'F', history: '', cedula: '', arsName: '', policyNumber: '' });

    const handleCreatePatient = (e) => {
        e.preventDefault();

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

        const patient = {
            id: `P-${1000 + patients.length + 1}`,
            ...newPatient,
            cedula: finalCedula,
            createdAt: new Date().toISOString().split('T')[0]
        };
        addPatient(patient);
        setShowForm(false);
        setNewPatient({ name: '', age: '', sex: 'F', history: '', cedula: '', arsName: '', policyNumber: '' });
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit">Guardar Paciente</Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card>
                <div className="mb-6">
                    <Input
                        placeholder="Buscar paciente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={18} />}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map(p => (
                        <Link key={p.id} to={`/patients/${p.id}`} className="block group">
                            <div className="p-4 border border-border rounded-lg group-hover:border-primary transition-colors bg-white flex items-start gap-4 h-full shadow-sm group-hover:shadow-md">
                                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">{p.name}</h3>
                                    <p className="text-xs text-text-secondary mb-2">ID: {p.id} • {p.age} años • {p.sex}</p>
                                    <p className="text-sm text-text-secondary line-clamp-2">{p.history}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default PatientManager;
