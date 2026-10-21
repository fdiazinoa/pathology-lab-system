import React, { useState } from 'react';
import { Camera, Layers, Scissors, Monitor, CheckCircle, AlertTriangle, Clock, Activity, ScanBarcode, FileText, CheckSquare, Microscope } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { useData } from '../services/DataContext';
import { matchCaseScan } from '../services/caseScan';
import OperationalLabWorkflow from './OperationalLabWorkflow';

const WorkflowStep = ({ title, icon: Icon, data, onAction, isLoading, status, canAdvance, requiresQR }) => {
    const isCompleted = data && data.completed;

    return (
        <div className={`relative pl-8 pb-8 border-l-2 ${isCompleted ? 'border-success' : 'border-gray-200'} last:border-0`}>
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${isCompleted ? 'bg-success' : 'bg-gray-300'}`} />

            <div className={`bg-white border rounded-lg p-4 shadow-sm ${isCompleted ? 'border-success/30' : 'border-border'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-md ${isCompleted ? 'bg-green-50 text-success' : 'bg-gray-100 text-gray-500'}`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-text-main">{title}</h4>
                            <p className="text-xs text-text-secondary">
                                {isCompleted ? `Completado: ${new Date(data.timestamp).toLocaleString()}` : 'Pendiente'}
                            </p>
                        </div>
                    </div>
                    {isCompleted && <CheckCircle size={18} className="text-success" />}
                </div>

                {isCompleted ? (
                    <div className="text-sm text-text-secondary space-y-1 mt-2">
                        <div className="flex justify-between">
                            <span>Usuario:</span>
                            <span className="font-medium text-text-main">{data.user}</span>
                        </div>
                        {data.qrVerified && (
                            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                                <ScanBarcode size={12} />
                                <span>Verificado por QR</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mt-3">
                        <Button
                            type="button"
                            size="sm"
                            variant={canAdvance ? "primary" : "secondary"}
                            onClick={onAction}
                            isLoading={isLoading}
                            disabled={!canAdvance}
                            className="w-full"
                        >
                            {requiresQR ? <ScanBarcode size={16} className="mr-2" /> : <CheckSquare size={16} className="mr-2" />}
                            {requiresQR ? 'Escanear QR para Avanzar' : 'Completar Etapa'}
                        </Button>
                        {!canAdvance && (
                            <p className="text-xs text-red-500 mt-1 text-center">
                                Complete la etapa anterior primero.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const LegacyLabWorkflow = ({ trackingData, onUpdateTracking, settings, currentUser, caseId, specimens }) => {
    const { logUsageEvent } = useData();
    const safeTrackingData = trackingData || {};
    const [processingStep, setProcessingStep] = useState(null);

    const stages = [
        { id: 'reception', title: '1. Recepción de Muestra', icon: FileText },
        { id: 'macroscopy', title: '2. Macroscopía', icon: Camera },
        { id: 'processing', title: '3. Procesamiento', icon: Layers },
        { id: 'microtomy', title: '4. Microtomía', icon: Scissors },
        { id: 'staining', title: '5. Tinción e IHC', icon: Activity },
        { id: 'microscopy', title: '6. Microscopía Digital', icon: Microscope },
        { id: 'diagnosis', title: '7. Diagnóstico', icon: Monitor },
        { id: 'validation', title: '8. Validación Final', icon: CheckCircle },
    ];

    const handleStageTransition = async (stageId) => {
        if (!caseId) return alert("Guarde el caso antes de procesar.");

        setProcessingStep(stageId);

        // 1. QR Check
        let verifiedScan = null;
        if (settings.requireInternalQRScan) {
            const scan = window.prompt(`[TRAZABILIDAD] Escanee el QR del caso o de uno de sus bloques para validar la etapa: ${stageId}`);
            verifiedScan = matchCaseScan(scan, { id: caseId, specimens });
            if (!verifiedScan) {
                if (scan !== null) alert("El código QR no pertenece a este caso ni a sus bloques. No se puede avanzar.");
                setProcessingStep(null);
                return;
            }
        }

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Create Data
        const newData = {
            completed: true,
            timestamp: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            qrVerified: settings.requireInternalQRScan,
            ...verifiedScan,
            station: 'Station-01' // Mock station
        };

        // 3. Update
        onUpdateTracking(stageId, newData);
        logUsageEvent('Workflow', 'StageTransition', { stageId, caseId });
        setProcessingStep(null);
    };

    const isStageCompleted = (stageId) => safeTrackingData[stageId]?.completed;

    return (
        <Card title="Trazabilidad Interna y Flujo de Trabajo">
            <div className="p-4">
                {stages.map((stage, index) => {
                    // Previous stage must be completed (except for first stage)
                    const previousStage = index > 0 ? stages[index - 1] : null;
                    const canAdvance = !previousStage || isStageCompleted(previousStage.id);

                    return (
                        <WorkflowStep
                            key={stage.id}
                            title={stage.title}
                            icon={stage.icon}
                            data={safeTrackingData[stage.id]}
                            onAction={() => handleStageTransition(stage.id)}
                            isLoading={processingStep === stage.id}
                            canAdvance={canAdvance}
                            requiresQR={settings.requireInternalQRScan}
                        />
                    );
                })}
            </div>
        </Card>
    );
};

export default function LabWorkflow(props) {
    return props.settings.enableOperationalWorkflow ? <OperationalLabWorkflow {...props} /> : <LegacyLabWorkflow {...props} />;
}
