import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Clock, Activity, TrendingUp, Users } from 'lucide-react';
import { useData } from '../services/DataContext';
import Card from '../components/Card';

const LaboratoryPerformance = () => {
    const { cases } = useData();

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
            productivity: (totalCases / 30).toFixed(1) // Dummy metric: cases per day (assuming 30 days)
        };
    }, [cases]);

    // 2. Cost Analysis by Type
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

    // 3. Time Distribution (Tech vs Pathologist)
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
                <p className="text-text-secondary">Análisis de eficiencia operativa y métricas financieras del laboratorio.</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-text-secondary">Costo Promedio/Caso</p>
                        <p className="text-2xl font-bold">${kpis.avgCost}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-text-secondary">Tiempo Técnico Prom.</p>
                        <p className="text-2xl font-bold">{kpis.avgTechTime} min</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-text-secondary">Tiempo Patólogo Prom.</p>
                        <p className="text-2xl font-bold">{kpis.avgPathTime} min</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-text-secondary">Productividad Diaria</p>
                        <p className="text-2xl font-bold">{kpis.productivity} casos</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost by Type Chart */}
                <Card title="Costo Promedio por Tipo de Estudio">
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis prefix="$" />
                                <Tooltip formatter={(value) => `$${value}`} />
                                <Legend />
                                <Bar dataKey="avgCost" name="Costo Promedio" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Time Distribution Chart */}
                <Card title="Distribución de Tiempo (Últimos 10 Casos)">
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="tecnico" name="Técnico" stackId="a" fill="#8884d8" />
                                <Bar dataKey="patologo" name="Patólogo" stackId="a" fill="#ffc658" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Insurer Performance Table */}
                <Card title="Indicadores por Aseguradora" className="lg:col-span-2">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border text-text-secondary text-sm">
                                    <th className="py-3 px-4 font-medium">Aseguradora (ARS)</th>
                                    <th className="py-3 px-4 font-medium text-center">Casos Procesados</th>
                                    <th className="py-3 px-4 font-medium text-right">Facturación Total Est.</th>
                                    <th className="py-3 px-4 font-medium text-right">Promedio por Caso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {insurerData.map((ars, idx) => (
                                    <tr key={idx} className="border-b border-border hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-primary">{ars.name}</td>
                                        <td className="py-3 px-4 text-center">{ars.count}</td>
                                        <td className="py-3 px-4 text-right font-mono">${ars.totalCost.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right font-mono">${Math.round(ars.totalCost / ars.count).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {insurerData.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-text-secondary">No hay datos de aseguradoras disponibles.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LaboratoryPerformance;
