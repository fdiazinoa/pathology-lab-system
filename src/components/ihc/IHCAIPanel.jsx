import React, { useState } from 'react';
import { Brain, Activity, Zap, CheckCircle } from 'lucide-react';
import Button from '../Button';

const IHCAIPanel = ({ activeMarker, onUpdateMarker }) => {
    const [analyzing, setAnalyzing] = useState(false);

    if (!activeMarker) return null;

    const handleQuantify = () => {
        setAnalyzing(true);
        // Mock AI Analysis
        setTimeout(() => {
            const mockResult = {
                percentage: Math.floor(Math.random() * 80) + 10, // 10-90%
                intensity: ['1+', '2+', '3+'][Math.floor(Math.random() * 3)],
                result: 'Positivo'
            };

            onUpdateMarker({
                ...activeMarker,
                ...mockResult,
                notes: (activeMarker.notes || '') + `\n[IA]: Cuantificación automática: ${mockResult.percentage}% (${mockResult.intensity}).`
            });
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Brain size={18} className="text-purple-600" />
                    Análisis IA: {activeMarker.name}
                </h2>
            </div>

            <div className="p-4 space-y-6">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <h3 className="text-sm font-bold text-purple-900 mb-2">Cuantificación Automática</h3>
                    <p className="text-xs text-purple-700 mb-4">
                        Detectar núcleos positivos y calcular índice de proliferación o expresión.
                    </p>
                    <Button
                        onClick={handleQuantify}
                        isLoading={analyzing}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Zap size={16} className="mr-2" />
                        Ejecutar Análisis
                    </Button>
                </div>

                {activeMarker.percentage && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resultados</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
                                <div className="text-xs text-gray-500">Porcentaje</div>
                                <div className="text-xl font-bold text-gray-800">{activeMarker.percentage}%</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
                                <div className="text-xs text-gray-500">Intensidad</div>
                                <div className="text-xl font-bold text-gray-800">{activeMarker.intensity}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sugerencias</h3>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p className="flex items-start gap-2">
                            <Activity size={14} className="mt-1 text-blue-500" />
                            Considere correlacionar con H&E para descartar falsos positivos en linfocitos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IHCAIPanel;
