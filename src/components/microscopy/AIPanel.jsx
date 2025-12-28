import React, { useState } from 'react';
import { Brain, AlertTriangle, Layers, Activity, Flame } from 'lucide-react';
import Button from '../Button';

const AIPanel = ({ activeImage, microscopyData, showHeatmap, onToggleHeatmap, onUpdateData }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);

    const handleAnalyze = () => {
        setAnalyzing(true);
        // Mock analysis simulation
        setTimeout(() => {
            setResults({
                patterns: [
                    { name: 'Carcinoma Papilar', probability: 92, color: 'text-red-600' },
                    { name: 'Inflamación Crónica', probability: 45, color: 'text-yellow-600' }
                ],
                features: {
                    mitosis: 'Alta',
                    nuclei: 'Agrandados, superpuestos',
                    necrosis: 'Ausente'
                },
                heatmapUrl: activeImage?.url // In real app, this would be a heatmap overlay
            });
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Brain size={18} className="text-purple-600" />
                    Asistente IA
                </h2>
                <p className="text-xs text-gray-500 mt-1">Análisis de imagen en tiempo real</p>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
                {!activeImage ? (
                    <div className="text-center text-gray-400 py-8">
                        Selecciona una imagen para analizar
                    </div>
                ) : (
                    <>
                        <Button
                            onClick={handleAnalyze}
                            isLoading={analyzing}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Activity size={16} className="mr-2" />
                            Analizar Imagen Actual
                        </Button>

                        {results && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Patterns */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Patrones Detectados</h3>
                                    <div className="space-y-2">
                                        {results.patterns.map((pat, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                                                <span className="font-medium text-sm">{pat.name}</span>
                                                <span className={`text-xs font-bold ${pat.color}`}>{pat.probability}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Heatmap Toggle */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Visualización</h3>
                                    <div
                                        onClick={onToggleHeatmap}
                                        className={`flex items-center gap-2 p-2 border rounded text-sm cursor-pointer transition-colors ${showHeatmap ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'}`}
                                    >
                                        {showHeatmap ? <Flame size={16} className="fill-current" /> : <Layers size={16} />}
                                        <span>{showHeatmap ? 'Ocultar Heatmap' : 'Mostrar Heatmap de Áreas Sospechosas'}</span>
                                    </div>
                                </div>

                                {/* Validation / Suggestions */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sugerencias</h3>
                                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-800 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                            <p>Se detectaron figuras mitóticas atípicas no descritas en el texto.</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Brain size={16} className="mt-0.5 flex-shrink-0" />
                                            <p>Considere IHQ para Ki-67 para confirmar índice proliferativo.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quantitative Analysis (Ki-67) */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Análisis Cuantitativo</h3>
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded text-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-indigo-900 font-medium">Índice Ki-67 (IA)</span>
                                            <span className="text-indigo-700 font-bold text-lg">15%</span>
                                        </div>
                                        <div className="text-xs text-indigo-600">
                                            Conteo: 500 núcleos. Positivos: 75.
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                                            onClick={() => {
                                                const currentIHQ = microscopyData.ihq || '';
                                                const newEntry = "Ki-67: 15% (Índice proliferativo calculado por IA sobre 500 núcleos).";
                                                const updatedIHQ = currentIHQ ? `${currentIHQ}\n${newEntry}` : newEntry;
                                                onUpdateData({ ihq: updatedIHQ });
                                                alert("Resultado de Ki-67 agregado al campo de IHQ.");
                                            }}
                                        >
                                            Insertar en Reporte IHQ
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AIPanel;
