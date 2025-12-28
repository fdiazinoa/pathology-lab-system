import React, { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { MICROSCOPY_TEMPLATES } from './templates';

const MicroscopyEditor = ({ data, onChange, organ }) => {
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);

    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const applyTemplate = (templateName) => {
        const template = MICROSCOPY_TEMPLATES[templateName];
        if (template) {
            onChange({ ...data, ...template });
            setIsTemplateOpen(false);
        }
    };

    // Mock templates based on organ
    const getPlaceholders = (organName) => {
        if (organName === 'Tiroides') {
            return {
                architecture: 'Ej. Folicular, Papilar, Sólido',
                pattern: 'Ej. Folículos de tamaño variable, Papilas complejas',
                cytology: 'Ej. Núcleos con vidrio esmerilado, pseudoinclusiones',
            };
        }
        return {
            architecture: 'Descripción arquitectural...',
            pattern: 'Patrón de crecimiento...',
            cytology: 'Características citológicas...',
        };
    };

    const placeholders = getPlaceholders(organ);

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Editor Estructurado</h2>
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
                                    {Object.keys(MICROSCOPY_TEMPLATES).map(key => (
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
                <Section title="Arquitectura General">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="3"
                        placeholder={placeholders.architecture}
                        value={data.architecture}
                        onChange={(e) => handleChange('architecture', e.target.value)}
                    />
                </Section>

                <Section title="Patrón Histológico">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="3"
                        placeholder={placeholders.pattern}
                        value={data.pattern}
                        onChange={(e) => handleChange('pattern', e.target.value)}
                    />
                </Section>

                <Section title="Citología / Núcleos">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="3"
                        placeholder={placeholders.cytology}
                        value={data.cytology}
                        onChange={(e) => handleChange('cytology', e.target.value)}
                    />
                </Section>

                <Section title="Estroma / Inflamación">
                    <input
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej. Desmoplásico, Linfocitario..."
                        value={data.stroma}
                        onChange={(e) => handleChange('stroma', e.target.value)}
                    />
                </Section>

                <div className="grid grid-cols-2 gap-4">
                    <Section title="Mitosis">
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. 2/10 HPF"
                            value={data.mitosis}
                            onChange={(e) => handleChange('mitosis', e.target.value)}
                        />
                    </Section>
                    <Section title="Necrosis">
                        <input
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. Presente, Focal"
                            value={data.necrosis}
                            onChange={(e) => handleChange('necrosis', e.target.value)}
                        />
                    </Section>
                </div>

                <Section title="Infiltración / Márgenes">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2"
                        placeholder="Ej. Infiltra cápsula, márgenes libres..."
                        value={data.infiltration}
                        onChange={(e) => handleChange('infiltration', e.target.value)}
                    />
                </Section>

                <Section title="Diagnósticos Diferenciales">
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2"
                        placeholder="Sugerencias..."
                        value={data.differential}
                        onChange={(e) => handleChange('differential', e.target.value)}
                    />
                </Section>

                <Section title="IHQ Recomendada">
                    <input
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej. CK7, TTF-1, Ki67"
                        value={data.ihq}
                        onChange={(e) => handleChange('ihq', e.target.value)}
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

export default MicroscopyEditor;
