import React, { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { MACROSCOPY_TEMPLATES } from './macroTemplates';

const MacroscopyEditor = ({ data, onChange, organ }) => {
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);

    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const applyTemplate = (templateName) => {
        const template = MACROSCOPY_TEMPLATES[templateName];
        if (template) {
            onChange({ ...data, ...template });
            setIsTemplateOpen(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Editor Macroscópico</h2>
                <div className="relative">
                    <button
                        onClick={() => setIsTemplateOpen(!isTemplateOpen)}
                        className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 focus:outline-none"
                    >
                        <FileText size={14} />
                        Cargar Plantilla
                        <ChevronDown size={12} />
                    </button>

                    {isTemplateOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsTemplateOpen(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                                <div className="py-1">
                                    {Object.keys(MACROSCOPY_TEMPLATES).map(key => (
                                        <button
                                            key={key}
                                            onClick={() => applyTemplate(key)}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-50 last:border-0"
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <Section title="Tipo de Muestra">
                    <input
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej. Vesícula biliar, Biopsia de piel..."
                        value={data.sampleType}
                        onChange={(e) => handleChange('sampleType', e.target.value)}
                    />
                </Section>

                <div className="grid grid-cols-2 gap-4">
                    <Section title="Nº Fragmentos">
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. 1, Múltiples"
                            value={data.fragmentCount}
                            onChange={(e) => handleChange('fragmentCount', e.target.value)}
                        />
                    </Section>
                    <Section title="Dimensiones (cm)">
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. 3 x 2 x 1 cm"
                            value={data.dimensions}
                            onChange={(e) => handleChange('dimensions', e.target.value)}
                        />
                    </Section>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Section title="Color">
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. Pardo, Blanquecino"
                            value={data.color}
                            onChange={(e) => handleChange('color', e.target.value)}
                        />
                    </Section>
                    <Section title="Consistencia">
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. Firme, Blanda"
                            value={data.consistency}
                            onChange={(e) => handleChange('consistency', e.target.value)}
                        />
                    </Section>
                </div>

                <Section title="Orientación / Referencias">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2"
                        placeholder="Ej. Hilo corto: margen superior..."
                        value={data.orientation}
                        onChange={(e) => handleChange('orientation', e.target.value)}
                    />
                </Section>

                <Section title="Hallazgos Visibles">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="3"
                        placeholder="Descripción de la superficie externa..."
                        value={data.findings}
                        onChange={(e) => handleChange('findings', e.target.value)}
                    />
                </Section>

                <Section title="Lesiones / Nódulos">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2"
                        placeholder="Descripción de lesiones al corte..."
                        value={data.lesions}
                        onChange={(e) => handleChange('lesions', e.target.value)}
                    />
                </Section>

                <Section title="Márgenes Quirúrgicos">
                    <input
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej. Libres macroscópicamente, Comprometidos"
                        value={data.margins}
                        onChange={(e) => handleChange('margins', e.target.value)}
                    />
                </Section>

                <Section title="Observaciones / Procesamiento">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2"
                        placeholder="Ej. Se incluye en su totalidad en 2 cápsulas..."
                        value={data.observations}
                        onChange={(e) => handleChange('observations', e.target.value)}
                    />
                </Section>
            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">{title}</label>
        {children}
    </div>
);

export default MacroscopyEditor;
