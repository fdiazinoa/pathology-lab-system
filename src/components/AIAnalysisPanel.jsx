import React from 'react';
import { AlertTriangle, Check, BookOpen } from 'lucide-react';
import Card from './Card';
import Button from './Button';

const AIAnalysisPanel = ({ results, onSelectDiagnosis }) => {
    if (!results) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-blue-50 border-l-4 border-info p-4 rounded-r-md">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-info shrink-0" size={20} />
                    <div>
                        <h4 className="font-bold text-info">Asistente de Diagnóstico IA</h4>
                        <p className="text-sm text-text-secondary mt-1">
                            Esta es una sugerencia basada en patrones histológicos/citológicos y <strong>no sustituye el informe definitivo ni el criterio del patólogo responsable.</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Suggestions */}
                <Card title="Diagnósticos Sugeridos">
                    <div className="space-y-4">
                        {results.suggestions.map((sug, idx) => (
                            <div key={idx} className="p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-text-main">{sug.diagnosis}</h4>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${sug.probability === 'Alta' ? 'bg-green-100 text-success' :
                                            sug.probability === 'Media' ? 'bg-yellow-100 text-warning' : 'bg-gray-100 text-text-secondary'
                                        }`}>
                                        Probabilidad {sug.probability}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary mb-3">{sug.reasoning}</p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sug.type === 'Maligno' ? 'bg-red-100 text-danger' : 'bg-green-100 text-success'
                                        }`}>
                                        {sug.type}
                                    </span>
                                    <Button size="sm" variant="secondary" onClick={() => onSelectDiagnosis(sug.diagnosis)}>
                                        <Check size={14} className="mr-1" />
                                        Seleccionar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Similar Cases */}
                <Card title="Casos Similares en Base de Datos">
                    <div className="space-y-4">
                        {results.similarCases.map((sc, idx) => (
                            <div key={idx} className="flex gap-4 p-3 border border-border rounded-lg">
                                <div className="w-20 h-20 bg-gray-200 rounded-md shrink-0 overflow-hidden">
                                    <img src={sc.imageUrl} alt="Case" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h5 className="font-bold text-sm text-text-main">{sc.diagnosis}</h5>
                                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{sc.description}</p>
                                    <div className="mt-2 flex items-center gap-1 text-primary text-xs font-medium cursor-pointer hover:underline">
                                        <BookOpen size={12} />
                                        Ver caso completo ({sc.id})
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AIAnalysisPanel;
