import React from 'react';
import { Brain, CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import { getFeatureTypeLabel, getConfidenceLevel } from '../../services/imageAIService';
import Button from '../Button';

const AIAnalysisPanel = ({
    analysis,
    isAnalyzing,
    onAcceptSuggestion,
    onRejectSuggestion,
    onToggleHeatmap,
    showHeatmap
}) => {
    if (isAnalyzing) {
        return (
            <div className="w-96 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm border-r border-purple-400/30 p-6 overflow-y-auto flex-shrink-0">
                <div className="flex items-center gap-3 mb-6">
                    <Brain className="text-purple-300 animate-pulse" size={28} />
                    <h3 className="text-xl font-bold text-white">Análisis IA</h3>
                </div>

                <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="text-purple-300 animate-spin mb-4" size={48} />
                    <p className="text-purple-200 text-center">
                        Analizando imagen...
                    </p>
                    <p className="text-purple-300 text-sm text-center mt-2">
                        Detectando características patológicas
                    </p>
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    const { features, suggestedAnnotations, diagnosticSuggestions, qualityMetrics, heatmap } = analysis;
    const pendingSuggestions = suggestedAnnotations.filter(s => !s.accepted && !s.rejected);

    return (
        <div className="w-96 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm border-r border-purple-400/30 p-6 overflow-y-auto flex-shrink-0">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Brain className="text-purple-300" size={28} />
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">Análisis IA</h3>
                    <p className="text-xs text-purple-200">
                        {new Date(analysis.analyzedAt).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* AI Disclaimer */}
            <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-yellow-300 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-100">
                        <strong>⚠️ Contenido Generado por IA</strong>
                        <p className="mt-1">
                            Este análisis es asistencia automática. Todos los hallazgos deben ser verificados por un patólogo calificado.
                        </p>
                    </div>
                </div>
            </div>

            {/* Features Detected */}
            <div className="mb-6">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-400" />
                    Características Detectadas ({features.length})
                </h4>
                <div className="space-y-2">
                    {features.map(feature => {
                        const confidenceInfo = getConfidenceLevel(feature.confidence);
                        return (
                            <div key={feature.id} className="bg-white/10 rounded-lg p-3 border border-white/20">
                                <div className="flex items-start justify-between mb-1">
                                    <span className="text-white font-medium text-sm">
                                        {getFeatureTypeLabel(feature.type)}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${confidenceInfo.bg} ${confidenceInfo.color}`}>
                                        {Math.round(feature.confidence * 100)}%
                                    </span>
                                </div>
                                <p className="text-purple-200 text-xs">
                                    {feature.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-purple-300">
                                    <span>Confianza: {confidenceInfo.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Annotation Suggestions */}
            <div className="mb-6">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Brain size={18} className="text-blue-400" />
                    Anotaciones Sugeridas
                </h4>

                {pendingSuggestions.length > 0 ? (
                    <>
                        <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-2 mb-3">
                            <p className="text-blue-200 text-xs text-center">
                                📝 {pendingSuggestions.length} sugerencia{pendingSuggestions.length !== 1 ? 's' : ''} pendiente{pendingSuggestions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="space-y-3">
                            {pendingSuggestions.map(suggestion => {
                                const confidenceInfo = getConfidenceLevel(suggestion.confidence);
                                return (
                                    <div key={suggestion.id} className="bg-white/10 rounded-lg p-3 border border-blue-400/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-white font-medium text-sm">
                                                {suggestion.label}
                                            </span>
                                            <div
                                                className="w-4 h-4 rounded-full border-2"
                                                style={{ backgroundColor: suggestion.color, borderColor: suggestion.color }}
                                            />
                                        </div>
                                        <p className="text-purple-200 text-xs mb-3">
                                            {suggestion.type === 'arrow' && '→ Flecha'}
                                            {suggestion.type === 'circle' && '○ Círculo'}
                                            {suggestion.type === 'rectangle' && '□ Rectángulo'}
                                            {' • '}
                                            Confianza: {confidenceInfo.label}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onAcceptSuggestion(suggestion)}
                                                className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
                                            >
                                                <CheckCircle size={14} />
                                                Aceptar
                                            </button>
                                            <button
                                                onClick={() => onRejectSuggestion(suggestion.id)}
                                                className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
                                            >
                                                <XCircle size={14} />
                                                Rechazar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="bg-green-500/20 border border-green-400/40 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={18} className="text-green-300" />
                            <span className="text-green-200 font-medium text-sm">
                                Todas las sugerencias procesadas
                            </span>
                        </div>
                        <p className="text-green-100 text-xs">
                            {suggestedAnnotations.filter(s => s.accepted).length} aceptada{suggestedAnnotations.filter(s => s.accepted).length !== 1 ? 's' : ''} • {' '}
                            {suggestedAnnotations.filter(s => s.rejected).length} rechazada{suggestedAnnotations.filter(s => s.rejected).length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>

            {/* Diagnostic Suggestions */}
            {diagnosticSuggestions && diagnosticSuggestions.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-white font-bold mb-3">Sugerencias Diagnósticas</h4>
                    <div className="space-y-2">
                        {diagnosticSuggestions.map((suggestion, idx) => {
                            const confidenceInfo = getConfidenceLevel(suggestion.confidence);
                            return (
                                <div key={idx} className="bg-white/10 rounded-lg p-3 border border-white/20">
                                    <div className="flex items-start justify-between mb-1">
                                        <span className="text-white font-medium text-sm">
                                            {suggestion.diagnosis}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${confidenceInfo.bg} ${confidenceInfo.color}`}>
                                            {Math.round(suggestion.confidence * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-purple-200 text-xs mt-2">
                                        {suggestion.reasoning}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quality Metrics */}
            {qualityMetrics && (
                <div className="mb-6">
                    <h4 className="text-white font-bold mb-3">Calidad de Imagen</h4>
                    <div className="space-y-2">
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-purple-200 text-sm">Tinción</span>
                                <span className="text-white font-medium">
                                    {Math.round(qualityMetrics.staining.score * 100)}%
                                </span>
                            </div>
                            {qualityMetrics.staining.issues.length > 0 && (
                                <p className="text-yellow-300 text-xs mt-1">
                                    {qualityMetrics.staining.issues.join(', ')}
                                </p>
                            )}
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-purple-200 text-sm">Enfoque</span>
                                <span className="text-white font-medium">
                                    {Math.round(qualityMetrics.focus.score * 100)}%
                                </span>
                            </div>
                            {qualityMetrics.focus.issues.length > 0 && (
                                <p className="text-yellow-300 text-xs mt-1">
                                    {qualityMetrics.focus.issues.join(', ')}
                                </p>
                            )}
                        </div>
                        {qualityMetrics.artifacts.detected && (
                            <div className="bg-red-500/20 border border-red-400/40 rounded-lg p-3">
                                <span className="text-red-300 text-sm font-medium">Artefactos Detectados</span>
                                <p className="text-red-200 text-xs mt-1">
                                    {qualityMetrics.artifacts.types.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Heatmap Toggle */}
            {heatmap && (
                <div className="mb-6">
                    <Button
                        size="sm"
                        variant={showHeatmap ? 'primary' : 'secondary'}
                        onClick={onToggleHeatmap}
                        className="w-full"
                    >
                        {showHeatmap ? 'Ocultar' : 'Mostrar'} Mapa de Calor
                    </Button>
                    <p className="text-purple-200 text-xs mt-2 text-center">
                        Visualiza áreas de atención detectadas por IA
                    </p>
                </div>
            )}

            {/* Model Info */}
            <div className="text-center text-purple-300 text-xs pt-4 border-t border-purple-400/30">
                <p>Modelo: {analysis.modelVersion}</p>
                <p>Tiempo de análisis: {(analysis.processingTime / 1000).toFixed(1)}s</p>
            </div>
        </div>
    );
};

export default AIAnalysisPanel;
