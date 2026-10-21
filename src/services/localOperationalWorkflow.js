import { localStageEvent, stationPayload, WORKFLOW_STAGES } from './operationalWorkflow.js';

const read = (provider, kind) => JSON.parse(localStorage.getItem(`${provider.operationalStoragePrefix}_workflow_${kind}`) || '[]');
const write = (provider, kind, rows) => localStorage.setItem(`${provider.operationalStoragePrefix}_workflow_${kind}`, JSON.stringify(rows));

export function localOperationalSnapshot(provider, caseId) {
    return { stations: read(provider, 'stations'), events: read(provider, 'events').filter(event => event.case_id === caseId) };
}

export function localCasesWithOperationalStages(provider, cases) {
    if (!JSON.parse(localStorage.getItem(`${provider.operationalStoragePrefix}_settings`) || '{}').enableOperationalWorkflow) return cases;
    const latest = new Map();
    for (const event of read(provider, 'events')) latest.set(event.case_id, event.stage_id);
    return cases.map(record => {
        const stage = WORKFLOW_STAGES.find(item => item.id === latest.get(record.id));
        return stage ? { ...record, stage: stage.caseStage, current_stage: stage.caseStage } : record;
    });
}

export async function addLocalWorkflowStation(provider, station) {
    const payload = stationPayload(station);
    const stations = read(provider, 'stations');
    if (stations.some(item => item.code === payload.code)) throw new Error('Ya existe una estación con ese código.');
    const saved = { ...payload, id: crypto.randomUUID(), is_active: true };
    write(provider, 'stations', [...stations, saved]);
    return saved;
}

export async function recordLocalOperationalStage(provider, caseId, stageId, action, stationId, scan) {
    const recordAction = async () => {
        const [record, settings, user] = await Promise.all([provider.getCase(caseId), provider.getSettings(), provider.getCurrentUser()]);
        const snapshot = localOperationalSnapshot(provider, caseId);
        const event = localStageEvent({ record, ...snapshot, settings, user, stageId, action, stationId, scan });
        const currentStage = WORKFLOW_STAGES.find(stage => stage.id === stageId).caseStage;
        const allEvents = read(provider, 'events');
        // One local write contains both the event and its stage; no history is kept in draft metadata.
        write(provider, 'events', [...allEvents, event]);
        return { events: [...snapshot.events, event], currentStage };
    };
    return globalThis.navigator?.locks
        ? navigator.locks.request(`${provider.operationalStoragePrefix}_workflow_${caseId}`, recordAction)
        : recordAction();
}
