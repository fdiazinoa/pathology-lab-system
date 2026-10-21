import React, { useEffect, useRef, useState } from 'react';
import Card from './Card';
import Button from './Button';
import { useData } from '../services/DataContext';
import { WORKFLOW_STAGES, WORKFLOW_ACTIONS, canEnterStage, stageProgress } from '../services/operationalWorkflow';

const dateTime = value => value ? new Date(value).toLocaleString() : 'Sin registrar';

export default function OperationalLabWorkflow({ caseId, trackingData, settings }) {
    const { can, getCase, getOperationalWorkflow, addWorkflowStation, recordOperationalStage } = useData();
    const [events, setEvents] = useState([]);
    const [stations, setStations] = useState([]);
    const stationKey = `workflow_station_${localStorage.getItem('app_system_mode') || 'DEMO'}`;
    const [stationId, setStationId] = useState(() => localStorage.getItem(stationKey) || '');
    const [newStation, setNewStation] = useState({ code: '', name: '' });
    const [loading, setLoading] = useState(true);
    const [hasSnapshot, setHasSnapshot] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const actionLock = useRef(false);
    const activeCaseId = useRef(caseId);
    activeCaseId.current = caseId;
    const canRead = can('cases', 'read') && can('processing', 'read');
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        let active = true;
        setEvents([]);
        setLoading(true);
        setHasSnapshot(false);
        setError('');
        if (!caseId || !canRead) { setLoading(false); return; }
        getOperationalWorkflow(caseId).then(snapshot => {
            if (active) { setEvents(snapshot.events); setStations(snapshot.stations); setHasSnapshot(true); }
        }).catch(failure => { if (active) setError(`No se pudo cargar el registro operativo: ${failure.message}`); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [caseId, canRead, getOperationalWorkflow, refresh]);

    const selectedStation = stations.find(station => station.id === stationId && station.is_active !== false);
    const closed = ['Finalizado', 'Listo para despacho', 'En Transito', 'Entregado', 'Cancelado'].includes(getCase(caseId)?.status);
    const recordAction = async (stage, action) => {
        if (actionLock.current || !hasSnapshot || !selectedStation) return;
        actionLock.current = true;
        setBusy(true);
        setError('');
        try {
            let scan = null;
            if (settings.requireInternalQRScan) {
                scan = window.prompt(`Escanee el QR del caso o de uno de sus bloques guardados: ${WORKFLOW_ACTIONS[action]} (${stage.label})`);
                if (scan === null) return;
            }
            const result = await recordOperationalStage(caseId, stage.id, action, stationId, scan);
            if (activeCaseId.current === caseId) setEvents(result.events);
        } catch (failure) { if (activeCaseId.current === caseId) setError(failure.message); }
        finally { actionLock.current = false; setBusy(false); }
    };

    const registerStation = async () => {
        if (actionLock.current) return;
        actionLock.current = true;
        setBusy(true);
        setError('');
        try {
            const saved = await addWorkflowStation(newStation);
            setStations(previous => [...previous, saved]);
            setStationId(saved.id);
            localStorage.setItem(stationKey, saved.id);
            setNewStation({ code: '', name: '' });
        } catch (failure) { setError(failure.code === '23505' ? 'Ya existe una estación con ese código.' : failure.message); }
        finally { actionLock.current = false; setBusy(false); }
    };

    return <Card title="Registro operativo de etapas">
        {!caseId ? <p>Guarde el caso antes de registrar movimientos.</p> : !canRead ? <p>No tiene permiso para consultar el registro operativo.</p> : <div className="space-y-4">
            <p className="text-sm text-text-secondary">Cada acción se guarda al instante. El responsable se asigna al iniciar; finalizar una etapa no valida ni firma el informe.</p>
            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-48">
                    <label htmlFor="workflow-station" className="block text-sm font-medium mb-1">Estación de esta terminal</label>
                    <select id="workflow-station" className="w-full border rounded-md p-2" value={stationId} disabled={busy || loading}
                        onChange={event => { setStationId(event.target.value); localStorage.setItem(stationKey, event.target.value); }}>
                        <option value="">Seleccione la estación donde está trabajando</option>
                        {stations.filter(station => station.is_active !== false).map(station => <option key={station.id} value={station.id}>{station.code} — {station.name}</option>)}
                    </select>
                </div>
                <Button type="button" variant="secondary" disabled={busy || loading} onClick={() => setRefresh(previous => previous + 1)}>Actualizar registro</Button>
            </div>
            {!loading && stations.length === 0 && <p className="text-sm">No hay estaciones registradas. Un administrador debe registrar el código y nombre reales del puesto de trabajo.</p>}
            {can('system', 'edit') && <details className="border rounded-md p-3">
                <summary className="cursor-pointer font-medium">Registrar estación de trabajo</summary>
                <div className="flex flex-wrap gap-3 items-end mt-3" onKeyDown={event => {
                    if (event.key === 'Enter' && event.target.tagName === 'INPUT') { event.preventDefault(); registerStation(); }
                }}>
                    <div><label htmlFor="workflow-station-code" className="block text-sm">Código de estación</label>
                        <input id="workflow-station-code" className="border rounded-md p-2" maxLength={40} value={newStation.code} disabled={busy || loading}
                            onChange={event => setNewStation(previous => ({ ...previous, code: event.target.value }))} /></div>
                    <div className="flex-1"><label htmlFor="workflow-station-name" className="block text-sm">Nombre de la estación</label>
                        <input id="workflow-station-name" className="border rounded-md p-2 w-full" maxLength={120} value={newStation.name} disabled={busy || loading}
                            onChange={event => setNewStation(previous => ({ ...previous, name: event.target.value }))} /></div>
                    <Button type="button" disabled={busy || loading} onClick={registerStation}>Guardar estación</Button>
                </div>
            </details>}
            {loading && <p role="status">Cargando registro operativo…</p>}
            {error && <p role="alert" className="text-red-700 border border-red-200 bg-red-50 p-3 rounded-md">{error}</p>}
            {closed && <p className="text-sm">El caso está cerrado. Los movimientos anteriores permanecen disponibles para consulta.</p>}
            {!loading && WORKFLOW_STAGES.map((stage, index) => {
                const progress = stageProgress(events, trackingData, stage.id);
                const blocked = !canEnterStage(events, trackingData, stage.id);
                const wrongStation = progress.entered && progress.entered.station_id !== stationId;
                return <section key={stage.id} aria-label={`Etapa ${stage.label}`} className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold">{index + 1}. {stage.label}</h4>
                    {progress.legacyCompleted ? <p className="text-sm">Completada en el flujo anterior. No se registraron tiempos operativos de entrada e inicio.</p> : <>
                        <p className="text-sm"><strong>Responsable:</strong> {progress.started?.actor_name || 'Pendiente de inicio'}
                            {progress.entered && <><br /><strong>Estación:</strong> {progress.entered.station_code} — {progress.entered.station_name}</>}</p>
                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {[['Entrada', progress.entered], ['Inicio', progress.started], ['Finalización', progress.completed]].map(([label, event]) => <div key={label}>
                                <dt className="font-medium text-text-secondary">{label}</dt><dd>{dateTime(event?.recorded_at)}{event && <><br />{event.actor_name}{event.scanned_code && <span className="block text-green-700">QR verificado{event.block_id ? ' · Bloque' : ' · Caso'}</span>}</>}</dd>
                            </div>)}
                        </dl>
                        {progress.nextAction && <Button type="button" size="sm" disabled={busy || !hasSnapshot || !selectedStation || blocked || wrongStation || closed || !can('processing', 'edit')}
                            onClick={() => recordAction(stage, progress.nextAction)}>{WORKFLOW_ACTIONS[progress.nextAction]}</Button>}
                        {blocked && progress.nextAction && <p className="text-xs text-text-secondary">Complete las etapas anteriores primero.</p>}
                        {wrongStation && progress.nextAction && <p className="text-xs text-text-secondary">Seleccione {progress.entered.station_code} para continuar esta etapa.</p>}
                    </>}
                </section>;
            })}
        </div>}
    </Card>;
}
