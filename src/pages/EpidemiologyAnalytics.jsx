import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertTriangle, Map, TrendingUp, Activity, Info, Database } from 'lucide-react';
import { useData } from '../services/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { MOCK_CASES } from '../services/mockData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const EpidemiologyAnalytics = () => {
    const { cases, patients, organs, setCases, settings } = useData();
    const [showDebug, setShowDebug] = React.useState(false);
    const [renderError, setRenderError] = React.useState(null);

    const handleResetData = () => {
        if (window.confirm("¿Deseas cargar los datos de prueba para visualizar las estadísticas?")) {
            setCases(MOCK_CASES);
        }
    };

    // Diagnostic: Log to console every render
    console.log("EpidemiologyAnalytics Render:", { casesCount: cases?.length, patientsCount: patients?.length });

    if (renderError) {
        return (
            <div className="p-10 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <h2 className="text-xl font-bold mb-2">Error de Renderizado</h2>
                <pre className="text-xs overflow-auto">{renderError.stack}</pre>
                <Button className="mt-4" onClick={() => setRenderError(null)}>Reintentar</Button>
            </div>
        );
    }


    // 1. Incidence by Organ (Top 5)
    const incidenceData = useMemo(() => {
        const counts = {};
        cases.forEach(c => {
            const organ = c.organ || 'Sin Especificar';
            counts[organ] = (counts[organ] || 0) + 1;
        });
        return Object.keys(counts)
            .map(key => ({ name: key, value: counts[key] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [cases]);

    // 2. Regional Distribution (Based on Patient City/Region)
    const regionalData = useMemo(() => {
        const counts = {};
        cases.forEach(c => {
            const patient = patients.find(p => p.id === c.patientId);
            const region = patient && patient.region ? patient.region : 'Desconocido';
            counts[region] = (counts[region] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [cases, patients]);

    const trendData = useMemo(() => {
        const months = {};
        cases.forEach(c => {
            if (!c.createdAt) return;
            const date = new Date(c.createdAt);
            if (isNaN(date.getTime())) return;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months[monthKey] = (months[monthKey] || 0) + 1;
        });
        return Object.keys(months)
            .sort()
            .map(key => ({ name: key, casos: months[key] }));
    }, [cases]);

    console.log("Analytics Data:", { incidenceData, regionalData, trendData, casesCount: cases.length });

    // 4. AI Alerts Simulation
    const aiAlerts = useMemo(() => {
        if (!settings?.aiEnabled) return [];

        const alerts = [];
        // Simulate detection logic
        const thyroidCases = cases.filter(c => c.organ === 'Tiroides').length;
        if (thyroidCases > 2) {
            alerts.push({
                type: 'warning',
                title: 'Posible Brote Localizado',
                message: `Se ha detectado un aumento inusual del 15% en casos de Tiroides en la región Cibao Norte en el último mes.`,
                icon: TrendingUp
            });
        }

        const rareCases = cases.filter(c => c.diagnosis && c.diagnosis.toLowerCase().includes('sarcoma')).length;
        if (rareCases > 0) {
            alerts.push({
                type: 'danger',
                title: 'Hallazgo de Patología Infrecuente',
                message: `Detección de Sarcoma (Enfermedad Rara). Se recomienda notificar al Registro Nacional de Tumores.`,
                icon: AlertTriangle
            });
        }

        if (alerts.length === 0) {
            alerts.push({
                type: 'info',
                title: 'Vigilancia Activa',
                message: 'No se han detectado anomalías estadísticas significativas en las últimas 48 horas.',
                icon: Activity
            });
        }
        return alerts;
    }, [cases, settings?.aiEnabled]);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Inteligencia Epidemiológica</h1>
                    <p className="text-text-secondary">Análisis avanzado de tendencias, incidencias y riesgos poblacionales.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-blue-500/10 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-blue-100 shadow-sm">
                        <Activity size={14} />
                        {cases.length} Casos Detectados
                    </div>
                </div>
            </div>

            {/* AI Alerts Section */}
            <div className="grid grid-cols-1 gap-4">
                {!settings?.aiEnabled ? (
                    <Card className="bg-gray-50/50 border-gray-100">
                        <div className="flex items-center gap-4 text-gray-500">
                            <div className="p-2 rounded-full bg-white shadow-sm">
                                <Info size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Módulo de IA Desactivado</h3>
                                <p className="text-sm">Las alertas epidemiológicas basadas en IA están deshabilitadas en la configuración.</p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    aiAlerts.map((alert, idx) => (
                        <Card key={idx} className={`border-l-4 ${alert.type === 'warning' ? 'border-l-orange-400 bg-orange-50/30' :
                                alert.type === 'danger' ? 'border-l-red-500 bg-red-50/30' :
                                    'border-l-blue-500 bg-blue-50/30'
                            }`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-xl shadow-sm ${alert.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                        alert.type === 'danger' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                    }`}>
                                    <alert.icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-text-main">{alert.title}</h3>
                                    <p className="text-sm text-text-secondary mt-1">{alert.message}</p>
                                </div>
                                {cases.length === 0 && (
                                    <Button size="sm" variant="outline" onClick={handleResetData}>
                                        <Database size={16} className="mr-2" />
                                        Cargar Datos Demo
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {cases.length === 0 ? (
                <Card className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-inner">
                        <Activity size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-text-main mb-2">No hay datos suficientes</h3>
                    <p className="text-text-secondary max-w-md mb-6">
                        Para visualizar las estadísticas epidemiológicas, es necesario tener casos registrados en el sistema.
                    </p>
                    <Button onClick={handleResetData}>
                        <Database size={20} className="mr-2" />
                        Cargar Casos de Prueba
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Incidence Chart */}
                    <Card title="Incidencia por Órgano (Top 5)">
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg border border-blue-100/50">
                                <ul className="text-xs space-y-1">
                                    {incidenceData.map((d, i) => (
                                        <li key={i} className="flex justify-between items-center">
                                            <span className="font-medium text-text-secondary">{d.name}:</span>
                                            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{d.value} casos</span>
                                        </li>
                                    ))}
                                    {incidenceData.length === 0 && <li className="text-gray-400 italic">Sin datos de incidencia</li>}
                                </ul>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={incidenceData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="value" name="Casos" fill="#0D9488" radius={[0, 4, 4, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    {/* Regional Map/Chart */}
                    <Card title="Distribución Geográfica de Casos">
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-emerald-50 to-white p-3 rounded-lg border border-emerald-100/50">
                                <ul className="text-xs space-y-1">
                                    {regionalData.map((d, i) => (
                                        <li key={i} className="flex justify-between items-center">
                                            <span className="font-medium text-text-secondary">{d.name}:</span>
                                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{d.value} casos</span>
                                        </li>
                                    ))}
                                    {regionalData.length === 0 && <li className="text-gray-400 italic">Sin datos regionales</li>}
                                </ul>
                            </div>

                            <div className="h-64 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={regionalData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {regionalData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    {/* Trends Chart */}
                    <Card title="Tendencia Temporal de Casos" className="lg:col-span-2">
                        <div className="space-y-4">
                            <div className="h-72 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line type="monotone" dataKey="casos" name="Nuevos Casos" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Debug Footer */}
            {cases.length > 0 && (
                <div className="mt-10 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                            <Info size={14} /> Información de Depuración
                        </h4>
                        <Button size="xs" variant="ghost" onClick={() => setShowDebug(!showDebug)}>
                            {showDebug ? 'Ocultar Detalles' : 'Ver Detalles de Datos'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[10px] text-gray-600">
                        <div>Casos Totales: <strong>{cases.length}</strong></div>
                        <div>Casos Finalizados: <strong>{cases.filter(c => c.status === 'Finalizado').length}</strong></div>
                        <div>Datos Incidencia: <strong>{incidenceData.length} ítems</strong></div>
                        <div>Datos Regionales: <strong>{regionalData.length} ítems</strong></div>
                    </div>

                    {showDebug && (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-[10px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-1 border">ID</th>
                                        <th className="p-1 border">Órgano</th>
                                        <th className="p-1 border">Estado</th>
                                        <th className="p-1 border">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cases.map(c => (
                                        <tr key={c.id}>
                                            <td className="p-1 border">{c.id}</td>
                                            <td className="p-1 border">{c.organ || 'N/A'}</td>
                                            <td className="p-1 border">{c.status}</td>
                                            <td className="p-1 border">{c.createdAt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EpidemiologyAnalytics;
