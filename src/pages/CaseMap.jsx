import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { useData } from '../services/DataContext';
import Button from '../components/Button';

const STAGES = [
    { id: 'histologia', label: 'Histología / Corte', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { id: 'microscopia', label: 'Microscopía', color: 'bg-purple-50 border-purple-200 text-purple-800' },
    { id: 'estudios_especiales', label: 'Estudios Especiales', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    { id: 'por_firmar', label: 'Por Firmar', color: 'bg-orange-50 border-orange-200 text-orange-800' },
    { id: 'finalizado', label: 'Finalizado', color: 'bg-green-50 border-green-200 text-green-800' }
];

const CaseMap = () => {
    const navigate = useNavigate();
    const { cases, updateCaseStage } = useData();

    const getCasesByStage = (stage) => {
        return cases.filter(c => {
            const currentStage = c.stage || 'histologia';
            // Map legacy accented stages to new IDs if necessary
            let normalizedStage = currentStage;
            if (currentStage === 'Histología') normalizedStage = 'histologia';
            if (currentStage === 'Microscopía') normalizedStage = 'microscopia';
            if (currentStage === 'Estudio Especial') normalizedStage = 'estudios_especiales';
            if (currentStage === 'Por Firmar') normalizedStage = 'por_firmar';
            if (currentStage === 'Finalizado') normalizedStage = 'finalizado';

            return normalizedStage === stage;
        });
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
        console.log('Drag Start:', caseId);
        e.dataTransfer.setData('text/plain', caseId);
        e.dataTransfer.setData('case_id', caseId); // Fallback
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e, stageId) => {
        e.preventDefault();
        const caseId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('case_id');
        console.log('Drop Case:', caseId, 'Target Stage:', stageId);

        if (caseId) {
            updateCaseStage(caseId, stageId);
        } else {
            console.error('No caseId found in dataTransfer');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
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

            <div className="flex-1 overflow-x-auto pb-6">
                <div className="flex gap-6 h-full min-w-[1200px] px-2">
                    {STAGES.map(stage => (
                        <div
                            key={stage.id}
                            className="flex-1 flex flex-col min-w-[300px] bg-slate-100/50 rounded-2xl p-2 border border-slate-200/50"
                            onDrop={(e) => handleDrop(e, stage.id)}
                            onDragOver={handleDragOver}
                        >
                            <div className={`px-4 py-3 font-semibold flex justify-between items-center text-sm ${stage.color.replace('bg-', 'text-').replace('border-', '')} mb-2`}>
                                <span className="tracking-tight">{stage.label}</span>
                                <span className="bg-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm text-slate-600 border border-slate-100">
                                    {getCasesByStage(stage.id).length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
                                {getCasesByStage(stage.id).map(c => {
                                    const sla = calculateSLA(c.createdAt);
                                    return (
                                        <div
                                            key={c.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, c.id)}
                                            className="bg-white p-4 rounded-xl border border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 cursor-grab active:cursor-grabbing transition-all duration-200 group"
                                            onClick={() => navigate(`/cases/${c.id}`)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">{c.id}</span>
                                                <button className="text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                            <p className="text-sm font-semibold text-text-main mb-1 truncate leading-tight">{c.patientName}</p>
                                            <p className="text-xs text-text-tertiary mb-3 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                {c.type}
                                                <span className="text-slate-300">•</span>
                                                {c.organ}
                                            </p>

                                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sla.color}`}>
                                                    <Clock size={10} />
                                                    {sla.label}
                                                </div>
                                                {c.aiCertified && (
                                                    <div className="text-emerald-500 bg-emerald-50 p-1 rounded-full" title="Certificado por IA">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {getCasesByStage(stage.id).length === 0 && (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl w-full">
                                            <div className="text-slate-300 mb-2 font-medium text-xs uppercase tracking-wide">Vacío</div>
                                        </div>
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
