import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Box, TestTube, X, Printer } from 'lucide-react';
import Button from './Button';
import { generateId } from '../utils/pathologyHelpers';
import BlockLabel from './BlockLabel';

const SpecimenManager = ({ specimens = [], onUpdate }) => {
    const [labelToPrint, setLabelToPrint] = useState(null);

    // Helper: Get next available letter (A, B, C...)
    const getNextSpecimenLetter = () => {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return alphabet[specimens.length % alphabet.length];
    };

    const handleAddSpecimen = () => {
        const letter = getNextSpecimenLetter();
        const newSpecimen = {
            id: generateId(), // Internal ID
            label: letter,    // Display Label (A, B, C)
            type: 'Biopsia',  // Default
            description: '',
            collectionDate: new Date().toISOString(),
            blocks: []
        };
        onUpdate([...specimens, newSpecimen]);
    };

    const handleRemoveSpecimen = (id) => {
        if (window.confirm('¿Eliminar esta muestra y sus bloques?')) {
            onUpdate(specimens.filter(s => s.id !== id));
        }
    };

    const handleUpdateSpecimen = (id, field, value) => {
        const updated = specimens.map(s => s.id === id ? { ...s, [field]: value } : s);
        onUpdate(updated);
    };

    const handleAddBlock = (specimenId) => {
        const updated = specimens.map(s => {
            if (s.id === specimenId) {
                const count = (s.blocks?.length || 0) + 1;
                const blockLabel = `${s.label}${count}`; // e.g., A1

                const newBlock = {
                    id: generateId(),
                    label: blockLabel,
                    status: 'pending',
                    notes: '',
                    createdAt: new Date().toISOString()
                };
                return { ...s, blocks: [...(s.blocks || []), newBlock] };
            }
            return s;
        });
        onUpdate(updated);
    };

    const handleRemoveBlock = (specimenId, blockId) => {
        const updated = specimens.map(s => {
            if (s.id === specimenId) {
                return { ...s, blocks: s.blocks.filter(b => b.id !== blockId) };
            }
            return s;
        });
        onUpdate(updated);
    };

    const handlePrintBlock = (block, specimenLabel) => {
        setLabelToPrint({ ...block, specimenLabel });
    };

    // Effect to trigger print when labelToPrint is set
    useEffect(() => {
        if (labelToPrint) {
            document.body.classList.add('printing-label');
            setTimeout(() => {
                window.print();
                document.body.classList.remove('printing-label');
                setLabelToPrint(null);
            }, 500);
        }
    }, [labelToPrint]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
                    <TestTube size={20} className="text-primary" />
                    Gestión de Especímenes
                </h3>
                <Button size="sm" onClick={handleAddSpecimen} type="button">
                    <Plus size={16} className="mr-2" />
                    Agregar Espécimen ({getNextSpecimenLetter()})
                </Button>
            </div>

            {specimens.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-text-secondary mb-2">No hay especímenes registrados.</p>
                    <Button variant="ghost" size="sm" onClick={handleAddSpecimen} type="button">
                        <Plus size={14} className="mr-1" /> Iniciar con Muestra A
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {specimens.map((specimen, index) => (
                    <div key={specimen.id} className="bg-white border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 relative group">
                        {/* Header: Label & Type */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                                    {specimen.label || String.fromCharCode(65 + index)}
                                </div>
                                <div>
                                    <select
                                        className="text-sm font-semibold text-text-main bg-transparent border-none outline-none cursor-pointer hover:text-primary p-0"
                                        value={specimen.type}
                                        onChange={(e) => handleUpdateSpecimen(specimen.id, 'type', e.target.value)}
                                    >
                                        <option value="Biopsia">Biopsia</option>
                                        <option value="Pieza Quirúrgica">Pieza Quirúrgica</option>
                                        <option value="Citología">Citología</option>
                                        <option value="Revisión">Revisión</option>
                                    </select>
                                    <p className="text-xs text-text-secondary">ID: {specimen.id.slice(0, 8)}...</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveSpecimen(specimen.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                title="Eliminar Espécimen"
                                type="button"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Description Input */}
                        <div className="mb-4">
                            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1 block">Descripción Macroscópica</label>
                            <textarea
                                className="w-full text-sm border border-gray-200 rounded-md p-2 focus:ring-2 focus:ring-primary/20 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
                                rows="2"
                                placeholder="Describa el tejido, color, dimensiones..."
                                value={specimen.description}
                                onChange={(e) => handleUpdateSpecimen(specimen.id, 'description', e.target.value)}
                            />
                        </div>

                        {/* Blocks Section (Chips) */}
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
                                    <Box size={12} /> BLOQUES DERIVADOS
                                </span>
                                <button
                                    onClick={() => handleAddBlock(specimen.id)}
                                    className="text-xs flex items-center gap-1 text-primary hover:text-primary-dark font-medium px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                                    type="button"
                                >
                                    <Plus size={12} /> Agregar Bloque
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {specimen.blocks && specimen.blocks.length > 0 ? (
                                    specimen.blocks.map(block => (
                                        <div
                                            key={block.id}
                                            className="flex items-center gap-1 bg-white border border-gray-200 text-text-main text-xs font-medium px-2 py-1 rounded-full shadow-sm group/chip"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>
                                            {block.label}
                                            <button
                                                onClick={() => handlePrintBlock(block, specimen.label)}
                                                className="ml-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Imprimir Etiqueta"
                                                type="button"
                                            >
                                                <Printer size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveBlock(specimen.id, block.id)}
                                                className="ml-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/chip:opacity-100 transition-opacity"
                                                type="button"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic pl-1">Sin bloques procesados</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hidden Print Area */}
            {labelToPrint && (
                <div id="printable-area">
                    <BlockLabel
                        blockId={labelToPrint.id}
                        caseId="CASE-ID" // TODO: Pass real Case ID
                        label={labelToPrint.label}
                        date={new Date().toLocaleDateString()}
                    />
                </div>
            )}
        </div>
    );
};

export default SpecimenManager;
