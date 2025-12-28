import React, { useState } from 'react';
import { Brain, Scissors, Layers, Box } from 'lucide-react';
import Button from '../Button';

const MacroAIPanel = ({ activeImage, macroscopyData }) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);

    const handleAnalyze = () => {
        setAnalyzing(true);
        // Mock analysis simulation
        setTimeout(() => {
            setResults({
                fragmentCount: 3,
                lesionSize: '2.5 x 1.8 cm',
                suggestions: [
                    'Seccionar perpendicularmente al eje mayor.',
                    'Incluir margen quirúrgico pintado con tinta china.',
                    'Tomar al menos 1 corte por cm de lesión.'
                ],
                cassettes: 4
            });
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Brain size={18} className="text-orange-600" />
                    Asistente Macro
                </h2>
                <p className="text-xs text-gray-500 mt-1">Análisis de pieza quirúrgica</p>
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
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <Box size={16} className="mr-2" />
                            Analizar Pieza
                        </Button>

                        {results && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                                        <p className="text-xs text-gray-500">Fragmentos</p>
                                        <p className="text-lg font-bold text-gray-800">{results.fragmentCount}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                                        <p className="text-xs text-gray-500">Cápsulas Est.</p>
                                        <p className="text-lg font-bold text-gray-800">{results.cassettes}</p>
                                    </div>
                                </div>

                                {/* Lesion Info */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lesión Detectada</h3>
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                                        <p>Tamaño aprox: <strong>{results.lesionSize}</strong></p>
                                        <p className="mt-1 text-xs">Bordes irregulares, coloración heterogénea.</p>
                                    </div>
                                </div>

                                {/* Sectioning Suggestions */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Scissors size={14} />
                                        Sugerencias de Corte
                                    </h3>
                                    <ul className="space-y-2">
                                        {results.suggestions.map((sug, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                                <span className="text-orange-500 font-bold">•</span>
                                                {sug}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MacroAIPanel;
