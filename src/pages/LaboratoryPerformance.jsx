import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Clock, Activity, TrendingUp } from 'lucide-react';
import { useData } from '../services/DataContext';
import Card from '../components/Card';

const LaboratoryPerformance = () => {
    const { cases = [] } = useData();

    // 1. KPI Calculations
    const kpis = useMemo(() => {
        const totalCases = cases.length;
        if (totalCases === 0) return { avgCost: 0, avgTechTime: 0, avgPathTime: 0, productivity: 0 };

        const totalCost = cases.reduce((sum, c) => sum + (c.cost || 0), 0);
        const totalTechTime = cases.reduce((sum, c) => sum + (c.technicianTime || 0), 0);
        const totalPathTime = cases.reduce((sum, c) => sum + (c.pathologistTime || 0), 0);

        return {
            avgCost: Math.round(totalCost / totalCases),
            avgTechTime: Math.round(totalTechTime / totalCases),
            avgPathTime: Math.round(totalPathTime / totalCases),
            productivity: (totalCases / 30).toFixed(1) // Dummy metric: cases per day
        };
    }, [cases]);

    // 2. Cost Analysis
    const costData = useMemo(() => {
        const data = {};
        cases.forEach(c => {
            const type = c.type || 'Desconocido';
            if (!data[type]) data[type] = { name: type, costo: 0, count: 0 };
            data[type].costo += (c.cost || 0);
            data[type].count += 1;
        });
        return Object.values(data).map(d => ({
            name: d.name,
            avgCost: Math.round(d.costo / d.count)
        }));
    }, [cases]);

    // 3. Time Distribution
    const timeData = useMemo(() => {
        return cases.slice(0, 10).map(c => ({
            name: c.id,
            tecnico: c.technicianTime || 0,
            patologo: c.pathologistTime || 0
        }));
    }, [cases]);

    // 4. Insurer Performance
    const insurerData = useMemo(() => {
        const data = {};
        cases.filter(c => c.paymentType === 'Asegurado').forEach(c => {
            const ars = c.arsName || 'Desconocida';
            if (!data[ars]) data[ars] = { name: ars, count: 0, totalCost: 0 };
            data[ars].count += 1;
            data[ars].totalCost += (c.cost || 0);
        });
        return Object.values(data).sort((a, b) => b.totalCost - a.totalCost);
    }, [cases]);

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Rendimiento y Costos</h1>
                <p className="text-text-secondary">Análisis de eficiencia operativa y métricas financieras.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-white to-green-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
                            <DollarSign size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Costo Prom./Caso</p>
                            <p className="text-2xl font-bold text-text-main tracking-tight">${kpis.avgCost}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-white to-blue-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                            <Clock size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Tiempo Técnico</p>
                            <p className="text-2xl font-bold text-text-main tracking-tight">{kpis.avgTechTime} min</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-white to-purple-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
                            <Activity size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Tiempo Patólogo</p>
                            <p className="text-2xl font-bold text-text-main tracking-tight">{kpis.avgPathTime} min</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-white to-orange-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 text-orange-600 rounded-xl">
                            <TrendingUp size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-secondary">Productividad/Día</p>
                            <p className="text-2xl font-bold text-text-main tracking-tight">{kpis.productivity}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Chart */}
                <Card title="Costo Promedio por Tipo" className="overflow-hidden">
                    <div className="h-72 w-full mt-2">
                        {costData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={costData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                    <YAxis prefix="$" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="avgCost" name="Costo Promedio" fill="#0D9488" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-tertiary text-sm">Sin datos suficientes</div>
                        )}
                    </div>
                </Card>

                {/* Time Chart */}
                <Card title="Tiempos (Últimos 10 Casos)" className="overflow-hidden">
                    <div className="h-72 w-full mt-2">
                        {timeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F1F5F9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="tecnico" name="Técnico" stackId="a" fill="#38BDF8" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="patologo" name="Patólogo" stackId="a" fill="#818CF8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-tertiary text-sm">Sin datos suficientes</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Insurer Table */}
            <Card title="Indicadores por Aseguradora" className="overflow-hidden">
                <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-gray-100">
                            <tr className="text-text-tertiary text-xs font-semibold uppercase tracking-wider">
                                <th className="py-3 px-6">Aseguradora</th>
                                <th className="py-3 px-6 text-center">Casos</th>
                                <th className="py-3 px-6 text-right">Facturación</th>
                                <th className="py-3 px-6 text-right">Promedio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {insurerData.length > 0 ? (
                                insurerData.map((ars, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-6 font-medium text-text-main">{ars.name}</td>
                                        <td className="py-3 px-6 text-center text-text-secondary">{ars.count}</td>
                                        <td className="py-3 px-6 text-right font-mono text-sm text-text-secondary">${ars.totalCost.toLocaleString()}</td>
                                        <td className="py-3 px-6 text-right font-mono text-sm font-semibold text-primary">${Math.round(ars.totalCost / ars.count).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-text-tertiary text-sm">No hay datos disponibles</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default LaboratoryPerformance;
