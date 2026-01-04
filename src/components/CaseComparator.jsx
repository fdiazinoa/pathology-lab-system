import React, { useState, useMemo } from 'react';
import { Search, History, X, ChevronRight, Eye, Calendar, Microscope, Info, AlertTriangle } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { useData } from '../services/DataContext';

const CaseComparator = ({ currentCase, allCases, onClose }) => {
    const { logUsageEvent } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrgan, setSelectedOrgan] = useState('');
    const [selectedCase, setSelectedCase] = useState(null);
    const [showSearch, setShowSearch] = useState(true);

    // Track when the comparator is opened
    React.useEffect(() => {
        logUsageEvent('Comparator', 'Opened', { currentCaseId: currentCase?.id });
    }, [logUsageEvent, currentCase]);

    // Filter cases for search (excluding current case)
    const filteredCases = useMemo(() => {
        return allCases.filter(c => {
            if (c.id === currentCase?.id) return false;

            const matchesSearch = searchTerm === '' ||
                c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.diagnosis && c.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.clinicalHistory && c.clinicalHistory.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesOrgan = selectedOrgan === '' || c.organId === selectedOrgan;

            return matchesSearch && matchesOrgan;
        }).slice(0, 10); // Limit to 10 results for performance
    }, [allCases, searchTerm, selectedOrgan, currentCase]);

    const handleSelectCase = (prevCase) => {
        logUsageEvent('Comparator', 'CaseSelected', { selectedCaseId: prevCase.id });
        setSelectedCase(prevCase);
        setShowSearch(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 border-l border-border animate-in slide-in-from-right duration-300 w-full max-w-2xl">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-white flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <History size={18} className="text-primary" />
                    <h3 className="font-bold text-text-main">Comparador de Casos Previos</h3>
                </div>
                <button onClick={onClose} className="text-text-secondary hover:text-text-main p-1 rounded-full hover:bg-gray-100">
                    <X size={20} />
                </button>
            </div>

            {/* Safety Warning */}
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-800 leading-tight">
                    <strong>Nota de Seguridad:</strong> Los casos previos se muestran únicamente como referencia clínica. El diagnóstico actual debe ser evaluado de forma independiente.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {showSearch ? (
                    <>
                        {/* Search Interface */}
                        <div className="space-y-3 bg-white p-4 rounded-lg border border-border shadow-sm">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-text-secondary" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar por ID, diagnóstico o palabras clave..."
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-primary"
                                    value={selectedOrgan}
                                    onChange={(e) => setSelectedOrgan(e.target.value)}
                                >
                                    <option value="">Todos los órganos</option>
                                    {/* These would ideally come from props or context */}
                                    <option value="1">Piel</option>
                                    <option value="2">Mama</option>
                                    <option value="3">Próstata</option>
                                    <option value="4">Gastrointestinal</option>
                                </select>
                                <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedOrgan(''); }}>
                                    Limpiar
                                </Button>
                            </div>
                        </div>

                        {/* Results List */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">Resultados ({filteredCases.length})</h4>
                            {filteredCases.length > 0 ? (
                                filteredCases.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleSelectCase(c)}
                                        className="bg-white p-3 rounded-lg border border-border hover:border-primary cursor-pointer transition-all group shadow-sm"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-mono font-bold text-primary">{c.id}</span>
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Calendar size={10} />
                                                {c.date || 'Sin fecha'}
                                            </span>
                                        </div>
                                        <h5 className="text-sm font-medium text-text-main line-clamp-1">{c.diagnosis || 'Sin diagnóstico registrado'}</h5>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                <Microscope size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-text-secondary line-clamp-1">{c.clinicalHistory || 'Sin historia clínica'}</p>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3">
                                        <Search size={24} />
                                    </div>
                                    <p className="text-sm text-text-secondary">No se encontraron casos previos que coincidan.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Comparison View */
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <Button variant="ghost" size="sm" onClick={() => setShowSearch(true)} className="mb-2">
                            <ChevronRight size={16} className="rotate-180 mr-1" />
                            Volver a la búsqueda
                        </Button>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Current Case Summary (Reference) */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase">Caso Actual</span>
                                    <span className="text-xs font-mono font-bold text-blue-800">{currentCase?.id}</span>
                                </div>
                                <p className="text-xs text-blue-900 font-medium">{currentCase?.clinicalHistory || 'Sin historia clínica'}</p>
                            </div>

                            {/* Historical Case Detail */}
                            <Card title={`Detalle Caso Histórico: ${selectedCase.id}`}>
                                <div className="space-y-4">
                                    <div>
                                        <h5 className="text-xs font-bold text-text-secondary uppercase mb-1">Diagnóstico Final</h5>
                                        <div className="p-3 bg-gray-50 rounded border border-gray-100 text-sm text-text-main font-medium leading-relaxed">
                                            {selectedCase.diagnosis || 'No registrado'}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="text-xs font-bold text-text-secondary uppercase mb-1">Historia Clínica / Hallazgos</h5>
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                            {selectedCase.clinicalHistory || 'No hay información adicional disponible.'}
                                        </p>
                                    </div>

                                    {selectedCase.images && selectedCase.images.length > 0 && (
                                        <div>
                                            <h5 className="text-xs font-bold text-text-secondary uppercase mb-2">Imágenes de Referencia</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedCase.images.map((img, idx) => (
                                                    <div key={idx} className="aspect-video rounded border border-border overflow-hidden bg-gray-100 relative group">
                                                        <img src={img.url} alt={`Referencia ${idx}`} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Eye size={20} className="text-white" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-border flex items-center gap-2 text-text-secondary">
                                        <Info size={14} />
                                        <p className="text-[10px]">Este caso fue cerrado el {selectedCase.date || 'N/A'}.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-border">
                <p className="text-[10px] text-center text-text-secondary italic">
                    "La consistencia diagnóstica es un pilar de la calidad en Anatomía Patológica."
                </p>
            </div>
        </div>
    );
};

export default CaseComparator;
