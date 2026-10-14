import React, { useState } from 'react';
import Button from './Button';
import { RESULT_TEMPLATE_GROUPS, parseResultTemplatesCSV } from '../services/resultTemplates';
import { structureTemplate } from '../services/structuredResultTemplates';

export default function ResultTemplateCatalogSettings({ settings, exams, onSave }) {
    const [pending, setPending] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const save = async updates => {
        setBusy(true); setError(''); setMessage('');
        try { await onSave(updates); setPending(null); setMessage('Catálogo de plantillas guardado.'); }
        catch (err) { setError(err.message); }
        finally { setBusy(false); }
    };
    const readFile = async event => {
        const file = event.target.files[0]; event.target.value = '';
        setError(''); setPending(null);
        if (!file) return;
        try {
            if (file.size > 5 * 1024 * 1024) throw new Error('El archivo supera los 5 MB.');
            setPending(parseResultTemplatesCSV(await file.text()).map(structureTemplate));
        } catch (err) { setError(err.message); }
    };
    return <div className="space-y-5 rounded-lg border border-border bg-white p-5">
        <h2 className="text-lg font-semibold">Catálogo de plantillas</h2>
        <p className="text-sm text-text-secondary">{settings.resultTemplates?.length || 0} plantillas. El formulario toma el grupo del examen del caso y filtra por el órgano seleccionado.</p>
        <label className="block text-sm">Importar catálogo CSV<input type="file" accept=".csv,text/csv" disabled={busy} onChange={readFile} className="mt-2 block w-full" /></label>
        {pending && <div className="space-y-3 rounded border p-3"><p>Se reemplazará el catálogo por {pending.length} plantillas organizadas. Los resultados guardados se conservan.</p>
            <Button type="button" disabled={busy} onClick={() => save({ resultTemplates: pending })}>Guardar catálogo</Button>{' '}
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setPending(null)}>Cancelar</Button>
        </div>}
        <h3 className="font-medium">Grupos asociados al catálogo de exámenes</h3>
        {exams.map(exam => <label key={exam.id} className="grid gap-2 text-sm md:grid-cols-2 md:items-center">
            <span>{exam.code} · {exam.name}</span>
            <select aria-label={`Grupo de ${exam.name}`} value={settings.resultTemplateExamGroups?.[String(exam.id)] || ''} disabled={busy}
                className="rounded border p-2" onChange={event => save({ resultTemplateExamGroups: { ...settings.resultTemplateExamGroups, [String(exam.id)]: event.target.value } })}>
                <option value="">Sin asociación</option>{Object.entries(RESULT_TEMPLATE_GROUPS).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
        </label>)}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="text-sm text-green-700">{message}</p>}
    </div>;
}
