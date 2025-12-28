import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Clock, CheckCircle, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const Dashboard = () => {
    const { cases, deleteCase } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [sortBy, setSortBy] = useState('date'); // date, priority

    const handleDelete = (id) => {
        if (window.confirm(`¿Está seguro de que desea eliminar el caso ${id}? Esta acción es irreversible.`)) {
            deleteCase(id);
        }
    };

    const filteredCases = cases.filter(c => {
        const patientName = c.patientName || '';
        const caseId = c.id || '';
        const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            caseId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (sortBy === 'priority') {
            // Sort by probability descending (Malignant first)
            const probA = a.aiClassification ? a.aiClassification.probability : 0;
            const probB = b.aiClassification ? b.aiClassification.probability : 0;
            return probB - probA;
        }
        // Default: Date descending
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const getStatusColor = (status) => {
        if (!status) return 'text-gray-500 bg-gray-50 border-gray-200';
        return status === 'Finalizado' ? 'text-success bg-green-50 border-green-200' : 'text-warning bg-yellow-50 border-yellow-200';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Panel Principal</h1>
                    <p className="text-text-secondary">Resumen de casos recientes y actividad.</p>
                </div>
                <Link to="/cases/new">
                    <Button>
                        <Plus size={18} className="mr-2" />
                        Nuevo Caso
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-primary">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-light rounded-full text-primary">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Casos Totales</p>
                            <p className="text-2xl font-bold">{cases.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-l-4 border-l-warning">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-full text-warning">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Pendientes</p>
                            <p className="text-2xl font-bold">{cases.filter(c => c.status === 'Borrador').length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-l-4 border-l-success">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-full text-success">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Finalizados</p>
                            <p className="text-2xl font-bold">{cases.filter(c => c.status === 'Finalizado').length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card title="Casos Recientes">
                <div className="mb-6 flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por paciente o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={18} />}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-border rounded-md bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="Borrador">Borrador</option>
                        <option value="Finalizado">Finalizado</option>
                    </select>
                    <select
                        className="px-4 py-2 border border-border rounded-md bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="date">Más Recientes</option>
                        <option value="priority">Prioridad (IA)</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-text-secondary text-sm">
                                <th className="py-3 px-4 font-medium">ID Caso</th>
                                <th className="py-3 px-4 font-medium">Paciente</th>
                                <th className="py-3 px-4 font-medium">Tipo</th>
                                <th className="py-3 px-4 font-medium">Órgano</th>
                                <th className="py-3 px-4 font-medium">Estado</th>
                                <th className="py-3 px-4 font-medium">Fecha</th>
                                <th className="py-3 px-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCases.map((c) => (
                                <tr key={c.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-primary">{c.id}</td>
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{c.patientName}</div>
                                        <div className="text-xs text-text-secondary">{c.patientId}</div>
                                        {c.aiClassification && (
                                            <div className="mt-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${c.aiClassification.nature === 'Maligno' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    c.aiClassification.nature === 'Sospechoso' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                        'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                    {c.aiClassification.nature.toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{c.type}</span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">{c.organ}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>
                                            {c.status || 'Sin Estado'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-text-secondary">{c.createdAt}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link to={`/cases/${c.id}`}>
                                                <Button variant="ghost" size="sm">Ver</Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(c.id)}
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCases.length === 0 && (
                        <div className="text-center py-8 text-text-secondary">
                            No se encontraron casos.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
