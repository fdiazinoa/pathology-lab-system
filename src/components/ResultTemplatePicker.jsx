import React, { useMemo, useState } from 'react';
import SearchableCatalogField from './SearchableCatalogField';
import { templatesForExam } from '../services/resultTemplates';
import { SECTION_LABELS, structureTemplate, templateMatchesOrgan } from '../services/structuredResultTemplates';

export default function ResultTemplatePicker({ examId, organ, catalog, groupsByExam, onApply, form }) {
    const [error, setError] = useState('');
    const structured = useMemo(() => catalog.map(item => item.structureVersion === 1 && item.sections ? item : structureTemplate(item)), [catalog]);
    const studyTemplates = templatesForExam(structured, groupsByExam, examId);
    const compatible = studyTemplates.filter(item => templateMatchesOrgan(item, organ)).sort((a, b) => a.title.localeCompare(b.title, 'es'));
    const applied = form.resultDetails?._template;
    const selected = compatible.find(item => item.id === applied?.id);
    const choose = id => {
        const template = compatible.find(item => item.id === id);
        if (!template) return;
        const conflicts = [...new Set([...Object.keys(template.sections), ...(applied?.fields || [])])].filter(key => {
            const current = ['macroscopy', 'microscopy', 'diagnosis'].includes(key) ? form[key] : form.resultDetails?.[key];
            return current?.trim() && current !== template.sections[key];
        }).map(key => SECTION_LABELS[key]);
        if (conflicts.length && !window.confirm(`Se reemplazará el contenido de ${conflicts.join(', ')} con la nueva plantilla. ¿Desea continuar?`)) return;
        try { onApply(template); setError(''); }
        catch (err) { setError(err.message); }
    };
    return <div>
        <SearchableCatalogField label="Cargar plantilla" title={`Plantillas para ${organ || 'el órgano seleccionado'}`} placeholder="Cargar plantilla"
            compact triggerText="Cargar plantilla" disabled={!examId || !organ}
            emptyMessage="No hay plantillas de este examen con correspondencia identificable para el órgano seleccionado. Las de otros órganos o sin órgano asignado están excluidas."
            value={selected?.id || ''}
            items={compatible.map(item => ({ id: item.id, value: item.id, label: item.title,
                detail: `${item.code} · ${Object.keys(item.sections).length} campos`,
                search: `${item.code} ${item.result} ${item.description || ''}` }))} onChange={choose} />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>;
}
