import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Clock, CheckCircle, Trash2, Eye, LayoutDashboard, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../services/DataContext';

const Dashboard = () => {
    const { cases, deleteCase } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const safeCases = cases || [];

    const stats = useMemo(() => {
        return {
            total: safeCases.length,
            pending: safeCases.filter(c => c.status === 'Borrador' || c.status === 'Pendiente').length,
            completed: safeCases.filter(c => c.status === 'Finalizado').length,
            urgent: safeCases.filter(c => c.priority === 'Urgente').length
        };
    }, [safeCases]);

    const handleDelete = (id) => {
        if (window.confirm(`¿Está seguro de que desea eliminar el caso ${id}? Esta acción es irreversible.`)) {
            deleteCase(id);
        }
    };

    const filteredCases = useMemo(() => {
        return safeCases.filter(c => {
            const patientName = c.patientName || '';
            const caseId = c.id || '';
            const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                caseId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [safeCases, searchTerm, filterStatus]);

    const getStatusColor = (status) => {
        if (!status) return 'text-slate-500 bg-slate-50 border-slate-200';
        switch (status) {
            case 'Finalizado': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'Borrador': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Pendiente': return 'text-blue-700 bg-blue-50 border-blue-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    {/* Header is visually hidden or simplified since Layout provides the main title, but we keep a sub-header context */}
                    <h2 className="text-lg font-medium text-slate-600 flex items-center gap-2">
                        <LayoutDashboard size={20} />
                        Resumen Operativo
                    </h2>
                </div>
                <Link to="/cases/new">
                    <Button className="shadow-lg shadow-teal-700/20 hover:shadow-teal-700/30 transition-all bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus size={18} className="mr-2" />
                        Nuevo Caso
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100">
                            <FileText size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Casos Totales</p>
                            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-100">
                            <Clock size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">En Proceso</p>
                            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.pending}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100">
                            <CheckCircle size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Finalizados</p>
                            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.completed}</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-sm border border-red-100">
                            <AlertTriangle size={24} strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Prioridad Alta</p>
                            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.urgent}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Cases Section */}
            <Card className="border-none shadow-sm overflow-hidden bg-white" title="Casos Recientes">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="relative w-full sm:w-72 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por ID o Paciente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                            />
                        </div>
                        <select
                            className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-sm cursor-pointer text-slate-600 font-medium"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Todos los estados</option>
                            <option value="Borrador">Borrador</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Finalizado">Finalizado</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-gray-100">
                                <tr className="text-text-tertiary text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Caso</th>
                                    <th className="py-3 px-4">Paciente</th>
                                    <th className="py-3 px-4">Origen</th>
                                    <th className="py-3 px-4">Estado</th>
                                    <th className="py-3 px-4">Fecha</th>
                                    <th className="py-3 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {filteredCases.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="p-3 bg-slate-50 rounded-full">
                                                    <Search size={24} className="opacity-20" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">No se encontraron casos</p>
                                                <p className="text-xs text-slate-400">Intenta ajustar los filtros de búsqueda</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCases.map((c) => (
                                        <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors duration-150">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-100">{c.id}</span>
                                                    {c.priority === 'Urgente' && (
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Urgente"></span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-slate-900 text-sm">{c.patientName}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{c.patientId}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-600">{c.type || 'Biopsia'}</span>
                                                    <span className="text-xs text-slate-400">{c.organ || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(c.status)}`}>
                                                    {c.status || 'SIN ESTADO'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600">
                                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/cases/${c.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg">
                                                            <Eye size={16} />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(c.id)}
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
