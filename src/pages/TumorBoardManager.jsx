import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Play, PlusCircle, CheckCircle } from 'lucide-react';
import { useData } from '../services/DataContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';

const TumorBoardManager = () => {
    const navigate = useNavigate();
    const { cases, updateCaseTumorBoard, logUsageEvent } = useData();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCaseId, setSelectedCaseId] = useState('');

    const tumorBoardCases = cases.filter(c => c.tumorBoard);

    const handleAddToBoard = () => {
        if (!selectedCaseId) return;
        const initialData = {
            status: 'Scheduled', // Scheduled, In Progress, Concluded
            scheduledDate: new Date().toISOString(),
            notes: [],
            consensus: '',
            participants: []
        };
        updateCaseTumorBoard(selectedCaseId, initialData);
        logUsageEvent('TumorBoard', 'Scheduled', { caseId: selectedCaseId });
        setIsAddModalOpen(false);
        setSelectedCaseId('');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Tumor Board / Comité Oncológico</h1>
                        <p className="text-text-secondary">Gestión y discusión de casos complejos.</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusCircle size={20} className="mr-2" />
                    Programar Caso
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {tumorBoardCases.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay casos programados</h3>
                        <p className="text-gray-500">Agregue un caso para iniciar una sesión de comité.</p>
                    </div>
                ) : (
                    tumorBoardCases.map(c => (
                        <Card key={c.id}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${c.tumorBoard.status === 'Concluded' ? 'bg-green-100 text-green-800 border-green-200' :
                                            c.tumorBoard.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                                            }`}>
                                            {c.tumorBoard.status === 'Concluded' ? 'Finalizado' :
                                                c.tumorBoard.status === 'In Progress' ? 'En Progreso' : 'Programado'}
                                        </span>
                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(c.tumorBoard.scheduledDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-main">{c.patientName} ({c.id})</h3>
                                    <p className="text-text-secondary">{c.diagnosis || 'Sin diagnóstico definitivo'} • {c.organ}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {c.tumorBoard.status !== 'Concluded' ? (
                                        <Button onClick={() => {
                                            logUsageEvent('TumorBoard', 'SessionStarted', { caseId: c.id });
                                            navigate(`/tumor-board/${c.id}`);
                                        }}>
                                            <Play size={18} className="mr-2" />
                                            Iniciar Sesión
                                        </Button>
                                    ) : (
                                        <Button variant="secondary" onClick={() => navigate(`/tumor-board/${c.id}`)}>
                                            <CheckCircle size={18} className="mr-2" />
                                            Ver Conclusiones
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Programar Caso para Tumor Board"
                confirmText="Programar"
                onConfirm={handleAddToBoard}
            >
                <div className="space-y-4">
                    <label className="text-sm font-medium text-text-main">Seleccionar Caso</label>
                    <select
                        className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={selectedCaseId}
                        onChange={e => setSelectedCaseId(e.target.value)}
                    >
                        <option value="">Seleccione un caso...</option>
                        {cases.filter(c => !c.tumorBoard).map(c => (
                            <option key={c.id} value={c.id}>
                                {c.id} - {c.patientName} ({c.organ})
                            </option>
                        ))}
                    </select>
                </div>
            </Modal>
        </div>
    );
};

export default TumorBoardManager;
