import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { useData } from '../services/DataContext';
import Button from '../components/Button';

const STAGES = [
    { id: 'Histología', label: 'Histología / Corte', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { id: 'Microscopía', label: 'Microscopía', color: 'bg-purple-50 border-purple-200 text-purple-800' },
    { id: 'Estudio Especial', label: 'Estudios Especiales', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    { id: 'Por Firmar', label: 'Por Firmar', color: 'bg-orange-50 border-orange-200 text-orange-800' },
    { id: 'Finalizado', label: 'Finalizado', color: 'bg-green-50 border-green-200 text-green-800' }
];

const CaseMap = () => {
    const navigate = useNavigate();
    const { cases, updateCaseStage } = useData();

    const getCasesByStage = (stage) => {
        return cases.filter(c => (c.stage || 'Histología') === stage);
    };

    const calculateSLA = (createdAt) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffHours = Math.abs(now - created) / 36e5;

        if (diffHours > 48) return { status: 'critical', label: '> 48h', color: 'text-red-600 bg-red-50 border-red-200' };
        if (diffHours > 24) return { status: 'warning', label: '> 24h', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
        return { status: 'ok', label: '< 24h', color: 'text-green-600 bg-green-50 border-green-200' };
    };

    const handleDragStart = (e, caseId) => {
        e.dataTransfer.setData('caseId', caseId);
    };

    const handleDrop = (e, stageId) => {
        e.preventDefault();
        const caseId = e.dataTransfer.getData('caseId');
        if (caseId) {
            updateCaseStage(caseId, stageId);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Mapa de Casos en Tiempo Real</h1>
                        <p className="text-text-secondary">Tablero operativo de seguimiento y SLA.</p>
                    </div>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span>En tiempo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span>Riesgo SLA</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span>SLA Vencido</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 h-full min-w-[1200px]">
                    {STAGES.map(stage => (
                        <div
                            key={stage.id}
                            className="flex-1 flex flex-col min-w-[280px] bg-gray-50 rounded-xl border border-gray-200"
                            onDrop={(e) => handleDrop(e, stage.id)}
                            onDragOver={handleDragOver}
                        >
                            <div className={`p-3 rounded-t-xl border-b ${stage.color} font-bold flex justify-between items-center`}>
                                <span>{stage.label}</span>
                                <span className="bg-white/50 px-2 py-0.5 rounded text-sm">
                                    {getCasesByStage(stage.id).length}
                                </span>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                                {getCasesByStage(stage.id).map(c => {
                                    const sla = calculateSLA(c.createdAt);
                                    return (
                                        <div
                                            key={c.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, c.id)}
                                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
                                            onClick={() => navigate(`/cases/${c.id}`)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-text-main">{c.id}</span>
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 mb-1 truncate">{c.patientName}</p>
                                            <p className="text-xs text-gray-500 mb-3">{c.type} • {c.organ}</p>

                                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${sla.color}`}>
                                                    <Clock size={12} />
                                                    {sla.label}
                                                </div>
                                                {c.aiCertified && (
                                                    <div className="text-green-600" title="Certificado por IA">
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {getCasesByStage(stage.id).length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg">
                                        Sin casos
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CaseMap;
