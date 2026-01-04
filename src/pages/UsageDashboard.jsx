import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Users, Zap, AlertCircle, Clock, Filter, Info, Database, TrendingUp, MousePointer2 } from 'lucide-react';
import { useData } from '../services/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';

const UsageDashboard = () => {
    const { getUsageStats, currentUser, roles } = useData();
    const [period, setPeriod] = useState(30); // 7, 30, 0 (Total)

    const stats = useMemo(() => getUsageStats(period), [getUsageStats, period]);

    const isAdmin = roles.find(r => r.id === currentUser?.roleId)?.name === 'Administrador';

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-text-main mb-2">Acceso Denegado</h2>
                <p className="text-text-secondary max-w-md">
                    Este panel está reservado exclusivamente para administradores del sistema con fines de optimización y mejora continua.
                </p>
            </div>
        );
    }

    // Prepare data for charts
    const moduleData = Object.entries(stats.byModule).map(([name, value]) => ({ name, value }));
    const trendData = Object.entries(stats.trends).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

    return (
        <div className="space-y-6">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Dashboard Interno de Uso</h2>
                    <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
                        <Info size={14} />
                        Métricas agregadas y anónimas para la optimización del sistema.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-border">
                    {[
                        { label: '7 Días', value: 7 },
                        { label: '30 Días', value: 30 },
                        { label: 'Histórico', value: 0 }
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${period === opt.value
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-text-secondary hover:bg-gray-50'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<MousePointer2 size={20} />}
                    label="Interacciones Totales"
                    value={stats.totalEvents}
                    color="blue"
                />
                <StatCard
                    icon={<Zap size={20} />}
                    label="Asistencias IA"
                    value={stats.byModule['AI'] || 0}
                    color="purple"
                />
                <StatCard
                    icon={<Clock size={20} />}
                    label="Actividad Reciente"
                    value={trendData.length > 0 ? trendData[trendData.length - 1].count : 0}
                    color="green"
                    sublabel="Eventos hoy"
                />
                <StatCard
                    icon={<TrendingUp size={20} />}
                    label="Módulo Top"
                    value={moduleData.length > 0 ? moduleData.sort((a, b) => b.value - a.value)[0].name : 'N/A'}
                    color="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage by Module */}
                <Card title="Uso por Módulo">
                    <div className="h-[300px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={moduleData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Trends */}
                <Card title="Tendencia de Actividad">
                    <div className="h-[300px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Detailed Actions */}
            <Card title="Distribución de Acciones Clave">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
                    <div className="col-span-1">
                        <h4 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wider">Top Acciones</h4>
                        <div className="space-y-3">
                            {Object.entries(stats.byAction)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([action, count], idx) => (
                                    <div key={action} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-xs text-text-secondary truncate max-w-[150px]">{action}</span>
                                        </div>
                                        <span className="text-xs font-bold text-text-main">{count}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div className="col-span-2 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={moduleData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {moduleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>

            {/* Disclaimer */}
            <div className="p-4 bg-gray-50 rounded-lg border border-border flex gap-3">
                <Info className="text-text-secondary flex-shrink-0" size={20} />
                <p className="text-xs text-text-secondary leading-relaxed">
                    <strong>Nota de Privacidad:</strong> Este dashboard utiliza telemetría anónima. No se registran nombres de pacientes, contenidos de informes, imágenes clínicas ni decisiones médicas específicas. El objetivo es puramente técnico para identificar qué módulos requieren mejoras de interfaz o rendimiento.
                </p>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color, sublabel }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
    };

    return (
        <div className={`p-4 rounded-xl border bg-white shadow-sm flex items-start gap-4`}>
            <div className={`p-3 rounded-lg ${colors[color]} border`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</p>
                <h3 className="text-xl font-bold text-text-main mt-1">{value}</h3>
                {sublabel && <p className="text-[10px] text-text-secondary mt-1">{sublabel}</p>}
            </div>
        </div>
    );
};

export default UsageDashboard;
