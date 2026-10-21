import { matchCaseScan } from './caseScan.js';

export const WORKFLOW_STAGES = [
    { id: 'reception', label: 'Recepción de Muestra', caseStage: 'recepcion' },
    { id: 'macroscopy', label: 'Macroscopía', caseStage: 'macroscopia' },
    { id: 'processing', label: 'Procesamiento', caseStage: 'procesamiento' },
    { id: 'microtomy', label: 'Microtomía', caseStage: 'microtomia' },
    { id: 'staining', label: 'Tinción e IHC', caseStage: 'tincion' },
    { id: 'microscopy', label: 'Microscopía Digital', caseStage: 'microscopia' },
    { id: 'diagnosis', label: 'Diagnóstico', caseStage: 'por_firmar' },
    { id: 'validation', label: 'Validación Final', caseStage: 'por_firmar' }
];
export const WORKFLOW_ACTIONS = { enter: 'Registrar entrada', start: 'Iniciar', complete: 'Finalizar' };

export function stageProgress(events, tracking, stageId) {
    const history = events.filter(event => event.stage_id === stageId);
    const entered = history.find(event => event.event_type === 'enter');
    const started = history.find(event => event.event_type === 'start');
    const completed = history.find(event => event.event_type === 'complete');
    const legacyCompleted = history.length === 0 && tracking?.[stageId]?.completed === true;
    return { entered, started, completed, legacyCompleted,
        nextAction: completed || legacyCompleted ? null : !entered ? 'enter' : !started ? 'start' : 'complete' };
}

export function canEnterStage(events, tracking, stageId) {
    const index = WORKFLOW_STAGES.findIndex(stage => stage.id === stageId);
    return index >= 0 && WORKFLOW_STAGES.slice(0, index).every(stage => {
        const progress = stageProgress(events, tracking, stage.id);
        return Boolean(progress.completed || progress.legacyCompleted);
    });
}

export function stationPayload(station) {
    const code = String(station.code || '').trim().toUpperCase();
    const name = String(station.name || '').trim();
    if (!/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(code) || !name || name.length > 120) {
        throw new Error('Indique un código de estación (letras, números, guion; máximo 40) y un nombre real (máximo 120).');
    }
    return { code, name };
}

// Local providers use the same lifecycle; Supabase validates it again with server identity/time.
export function localStageEvent({ record, events, stations, settings, user, stageId, action, stationId, scan }) {
    if (!settings.enableOperationalWorkflow) throw new Error('El registro operativo está desactivado.');
    if (!user?.id) throw new Error('Inicie sesión para registrar una etapa.');
    if (!record) throw new Error('Caso no encontrado.');
    if (['Finalizado', 'Listo para despacho', 'En Transito', 'Entregado', 'Cancelado'].includes(record.status)) throw new Error('El caso está cerrado. Reábralo antes de registrar etapas.');
    const stage = WORKFLOW_STAGES.find(item => item.id === stageId);
    if (!stage || !Object.hasOwn(WORKFLOW_ACTIONS, action)) throw new Error('Etapa o acción inválida.');
    const progress = stageProgress(events, record.tracking, stageId);
    if (progress.nextAction !== action) throw new Error('La etapa cambió. Actualice el registro antes de continuar.');
    if (!canEnterStage(events, record.tracking, stageId)) throw new Error('Complete las etapas anteriores primero.');
    const station = stations.find(item => item.id === stationId && item.is_active !== false);
    if (!station) throw new Error('Seleccione una estación activa.');
    if (progress.entered && progress.entered.station_id !== station.id) throw new Error('Inicie y finalice en la estación donde registró la entrada.');
    const verified = matchCaseScan(scan, record);
    if ((settings.requireInternalQRScan ?? settings.requireStepQR) && !verified) throw new Error('El QR no pertenece al caso ni a sus bloques guardados.');
    return { id: crypto.randomUUID(), case_id: record.id, stage_id: stageId, event_type: action,
        station_id: station.id, station_code: station.code, station_name: station.name,
        actor_id: user.id, actor_name: user.name, recorded_at: new Date().toISOString(),
        scanned_code: verified?.scannedCode || null, block_id: verified?.blockId || null, specimen_id: verified?.specimenId || null };
}

// Stage-only cache updates must not reload an editor and discard unsaved clinical fields.
export function caseEditorSignature(record, exams) {
    const content = { ...record };
    delete content.stage;
    delete content.current_stage;
    return JSON.stringify([content, exams]);
}
