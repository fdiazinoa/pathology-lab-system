import React, { useState, useMemo } from 'react';
import { useData } from '../services/DataContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Search, History, FileText, Trash2, User, Calendar, Clock, BarChart3, ShieldAlert, Activity, ArrowRight, Monitor, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const AuditLog = () => {
    const { globalAuditLog, cases, configHistory, users } = useData();
    const [activeTab, setActiveTab] = useState('logs'); // logs, traceability, performance, security
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedCaseId, setSelectedCaseId] = useState('');

    // --- DATA PREPARATION ---
    const caseLogs = useMemo(() => cases.flatMap(c => (c.auditLogs || []).map(log => ({
        ...log,
        caseId: c.id,
        patientName: c.patientName,
        type: 'Caso'
    }))), [cases]);

    const unifiedLogs = useMemo(() => [
        ...globalAuditLog.map(log => ({ ...log, type: 'Global' })),
        ...caseLogs
    ].sort((a, b) => new Date(b.date) - new Date(a.date)), [globalAuditLog, caseLogs]);

    const filteredLogs = useMemo(() => unifiedLogs.filter(log => {
        const matchesSearch =
            (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.caseId || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' ||
            (filterType === 'global' && log.type === 'Global') ||
            (filterType === 'cases' && log.type === 'Caso');

        return matchesSearch && matchesType;
    }), [unifiedLogs, searchTerm, filterType]);

    // Performance Data: Average time per stage
    const stagePerformanceData = useMemo(() => {
        const stages = ['Recepción', 'Macroscopía', 'Procesamiento', 'Microscopía', 'Diagnóstico', 'Finalizado'];
        return stages.map(stage => ({
            name: stage,
            duration: Math.floor(Math.random() * 24) + 5 // Simulated hours
        }));
    }, []);

    // Courier Efficiency
    const courierData = useMemo(() => {
        const couriers = users.filter(u => u.roleId === '4');
        return couriers.map(c => ({
            name: c.name,
            deliveries: Math.floor(Math.random() * 50) + 10,
            onTime: Math.floor(Math.random() * 20) + 80 // Percentage
        }));
    }, [users]);

    const failedAttempts = useMemo(() => unifiedLogs.filter(log =>
        log.action.toLowerCase().includes('error') || log.action.toLowerCase().includes('fallido')
    ), [unifiedLogs]);

    // --- RENDERERS ---
    const renderLogs = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar por acción, usuario, detalle o ID de caso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={18} />}
                    />
                </div>
                <select
                    className="px-4 py-2 border border-border rounded-md bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">Todos los registros</option>
                    <option value="global">Eventos Globales</option>
                    <option value="cases">Actividad de Casos</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border text-text-secondary text-sm">
                            <th className="py-3 px-4 font-medium">Fecha / Hora</th>
                            <th className="py-3 px-4 font-medium">Usuario / Rol</th>
                            <th className="py-3 px-4 font-medium">Acción</th>
                            <th className="py-3 px-4 font-medium">Dispositivo</th>
                            <th className="py-3 px-4 font-medium">Referencia</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredLogs.map((log, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-text-main flex items-center gap-1">
                                            <Calendar size={12} className="text-text-secondary" />
                                            {new Date(log.date).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-text-secondary flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(log.date).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                                            {log.user ? log.user.substring(0, 2).toUpperCase() : 'S'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{log.user || 'Sistema'}</p>
                                            <p className="text-xs text-text-secondary">{log.role || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="space-y-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.action.includes('Error') ? 'bg-red-100 text-red-700' :
                                            log.action.includes('Recepción') ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-text-main'
                                            }`}>
                                            {log.action}
                                        </span>
                                        <p className="text-xs text-text-secondary max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </p>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="text-xs text-text-secondary flex items-center gap-1">
                                        <Monitor size={12} />
                                        {log.device || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    {log.caseId ? (
                                        <Link to={`/cases/${log.caseId}`} className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                                            <FileText size={14} />
                                            {log.caseId}
                                        </Link>
                                    ) : (
                                        <span className="text-xs text-text-secondary italic">Sistema</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderTraceability = () => {
        const selectedCase = cases.find(c => c.id === selectedCaseId);
        const timeline = selectedCase ? [...(selectedCase.auditLogs || [])].reverse() : [];

        return (
            <div className="space-y-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Seleccionar Caso para Trazabilidad</label>
                        <select
                            className="w-full p-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
                            value={selectedCaseId}
                            onChange={(e) => setSelectedCaseId(e.target.value)}
                        >
                            <option value="">Seleccione un caso...</option>
                            {cases.map(c => (
                                <option key={c.id} value={c.id}>{c.id} - {c.patientName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedCase ? (
                    <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                        {timeline.map((event, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary z-10" />
                                <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-text-main">{event.action}</h4>
                                        <span className="text-xs text-text-secondary">{new Date(event.date).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-3">{event.details}</p>
                                    <div className="flex items-center gap-4 text-xs text-text-secondary border-t border-gray-50 pt-2">
                                        <span className="flex items-center gap-1"><User size={12} /> {event.user} ({event.role})</span>
                                        <span className="flex items-center gap-1"><Monitor size={12} /> {event.device}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-text-secondary">Seleccione un caso para ver su línea de tiempo de trazabilidad inmutable.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderPerformance = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Tiempo Promedio por Etapa (Horas)">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stagePerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="duration" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card title="Eficiencia de Repartidores (% a Tiempo)">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={courierData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} fontSize={12} />
                            <YAxis dataKey="name" type="category" fontSize={10} width={100} />
                            <Tooltip />
                            <Bar dataKey="onTime" radius={[0, 4, 4, 0]}>
                                {courierData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.onTime > 90 ? '#10b981' : '#f59e0b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Intentos Fallidos de Despacho" className="border-red-100">
                    <div className="space-y-4">
                        {failedAttempts.length > 0 ? failedAttempts.map((log, idx) => (
                            <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-100 flex gap-3">
                                <ShieldAlert className="text-red-600 shrink-0" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-red-800">{log.action}</p>
                                    <p className="text-xs text-red-700">{log.details}</p>
                                    <p className="text-[10px] text-red-600 mt-1">{new Date(log.date).toLocaleString()} - {log.user}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-text-secondary text-center py-4">No hay alertas de seguridad recientes.</p>
                        )}
                    </div>
                </Card>

                <Card title="Cambios en Configuración del Sistema">
                    <div className="space-y-4">
                        {configHistory.length > 0 ? configHistory.map((change, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-blue-800 uppercase">{change.key}</span>
                                    <span className="text-[10px] text-blue-600">{new Date(change.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-blue-700">
                                    <span className="line-through opacity-50">{JSON.stringify(change.oldValue)}</span>
                                    <ArrowRight size={12} />
                                    <span className="font-bold">{JSON.stringify(change.newValue)}</span>
                                </div>
                                <p className="text-[10px] text-blue-500 mt-2 flex items-center gap-1">
                                    <User size={10} /> Modificado por {change.user}
                                </p>
                            </div>
                        )) : (
                            <p className="text-sm text-text-secondary text-center py-4">No hay cambios registrados.</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <ShieldCheck className="text-primary" /> Auditoría y Reportes de Trazabilidad
                    </h1>
                    <p className="text-text-secondary">Control inmutable de eventos, rendimiento y seguridad del sistema.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border overflow-x-auto">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'logs' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                >
                    <History size={16} /> Registros de Actividad
                </button>
                <button
                    onClick={() => setActiveTab('traceability')}
                    className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'traceability' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                >
                    <Activity size={16} /> Trazabilidad por Caso
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'performance' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                >
                    <BarChart3 size={16} /> Reportes de Rendimiento
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'security' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                >
                    <ShieldAlert size={16} /> Seguridad y Configuración
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'logs' && renderLogs()}
                {activeTab === 'traceability' && renderTraceability()}
                {activeTab === 'performance' && renderPerformance()}
                {activeTab === 'security' && renderSecurity()}
            </div>
        </div>
    );
};

export default AuditLog;
