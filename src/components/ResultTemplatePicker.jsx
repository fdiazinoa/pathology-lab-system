import React, { useState } from 'react';
import Button from './Button';
import { RESULT_TEMPLATE_GROUPS, parseResultTemplatesCSV, templatesForExam } from '../services/resultTemplates';

export default function ResultTemplatePicker({ examId, examName, catalog, groupsByExam, canManage, onSave, onInsert }) {
    const [query, setQuery] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('diagnosis');
    const group = groupsByExam[String(examId)] || '';
    const templates = templatesForExam(catalog, groupsByExam, examId, query);
    const selected = templates.find(item => item.id === selectedId);

    const save = async (updates) => {
        setBusy(true); setError(''); setMessage('');
        try {
            await onSave(updates);
            setSelectedId(''); setPending(null);
            setMessage('Configuración de plantillas guardada.');
        } catch (err) {
            setError(`No se pudo guardar: ${err.message}`);
        } finally { setBusy(false); }
    };

    const readFile = async (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        setError(''); setMessage(''); setPending(null);
        if (!file) return;
        try {
            if (file.size > 5 * 1024 * 1024) throw new Error('El archivo supera los 5 MB.');
            setPending(parseResultTemplatesCSV(await file.text()));
        } catch (err) { setError(err.message); }
    };

    return (
        <div className="space-y-3 rounded-lg border border-border bg-slate-50 p-4">
            <h3 className="font-semibold">Plantillas por tipo de examen</h3>
            <p className="text-sm text-text-secondary">{examId ? `Examen: ${examName}` : 'Seleccione un examen para ver sus plantillas.'}</p>
            {canManage && (
                <>
                    <label className="block text-sm font-medium">
                        Grupo de plantillas de este examen
                        <select aria-label="Grupo de plantillas de este examen" className="mt-1 block w-full rounded border p-2" value={group} disabled={!examId || busy || !!pending}
                            onChange={event => save({ resultTemplateExamGroups: { ...groupsByExam, [String(examId)]: event.target.value } })}>
                            <option value="">Sin grupo asignado</option>
                            {Object.entries(RESULT_TEMPLATE_GROUPS).map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-medium">
                        Importar catálogo CSV
                        <input aria-label="Importar catálogo CSV" className="mt-1 block w-full text-sm" type="file" accept=".csv,text/csv" disabled={busy} onChange={readFile} />
                    </label>
                    <p className="text-xs text-text-secondary">Importe el archivo completo para conservar todos los grupos. Los códigos y textos se mantienen como en el archivo.</p>
                    {pending && (
                        <div className="space-y-2 rounded border bg-white p-3">
                            <p className="text-sm">{pending.length} plantillas listas para importar:</p>
                            <ul className="text-sm">
                                {Object.entries(RESULT_TEMPLATE_GROUPS).map(([code, label]) => {
                                    const count = pending.filter(item => item.group === code).length;
                                    return count ? <li key={code}>{label}: {count}</li> : null;
                                })}
                            </ul>
                            <p className="text-sm">Se reemplazará el catálogo actual de {catalog.length} plantillas. Los resultados de los casos se conservan.</p>
                            <div className="flex gap-2">
                                <Button type="button" disabled={busy} onClick={() => save({ resultTemplates: pending })}>Guardar catálogo</Button>
                                <Button type="button" variant="secondary" disabled={busy} onClick={() => setPending(null)}>Cancelar</Button>
                            </div>
                        </div>
                    )}
                </>
            )}
            {examId && !group && <p className="text-sm">Un administrador debe asociar este examen con su grupo de plantillas.</p>}
            {examId && group && (
                <>
                    <p className="text-sm">Grupo: {RESULT_TEMPLATE_GROUPS[group] || group}</p>
                    <input aria-label="Buscar plantillas" className="w-full rounded border p-2" placeholder="Buscar por código o contenido…" value={query} onChange={event => { setQuery(event.target.value); setSelectedId(''); }} />
                    <select aria-label="Plantilla de resultado" className="w-full rounded border p-2" value={selected?.id || ''} onChange={event => setSelectedId(event.target.value)}>
                        <option value="">Seleccionar plantilla ({templates.length})</option>
                        {templates.map(item => <option key={item.id} value={item.id}>{item.code} — {item.result.trim().replace(/\s+/g, ' ').slice(0, 110)}</option>)}
                    </select>
                    {!templates.length && <p className="text-sm">No hay plantillas para este grupo o búsqueda.</p>}
                    {selected && (
                        <>
                            <div className="max-h-64 overflow-auto whitespace-pre-wrap rounded border bg-white p-3 text-sm">{selected.result}</div>
                            {selected.description.trim() && selected.description !== selected.result && <details className="text-sm"><summary>Descripción original</summary><p className="whitespace-pre-wrap">{selected.description}</p></details>}
                            <label className="block text-sm">Insertar en
                                <select aria-label="Sección del informe" className="ml-2 rounded border p-2" value={target} onChange={event => setTarget(event.target.value)}>
                                    <option value="diagnosis">Diagnóstico</option>
                                    <option value="microscopy">Microscopía</option>
                                    <option value="macroscopy">Macroscopía</option>
                                </select>
                            </label>
                            <Button type="button" disabled={busy || !!pending} onClick={() => { onInsert(target, selected.result); setMessage('Plantilla agregada al final del texto. Puede editarla antes de guardar el caso.'); }}>Agregar al resultado</Button>
                        </>
                    )}
                </>
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="text-sm text-green-700">{message}</p>}
        </div>
    );
}
