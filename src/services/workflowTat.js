import { WORKFLOW_STAGES, stageProgress } from './operationalWorkflow.js';

const CLOSED = ['Finalizado', 'Listo para despacho', 'En Transito', 'Entregado', 'Cancelado'];

// A date without time/offset cannot establish an elapsed duration reliably.
function instant(value) {
    if (typeof value !== 'string' || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function elapsed(start, end) {
    return start !== null && end !== null && end >= start ? end - start : null;
}

export function workflowTat(record, events = [], now = Date.now()) {
    const validated = instant(record?.validatedAt);
    const closed = CLOSED.includes(record?.status);
    const cutoff = validated !== null && validated <= now ? validated : closed || validated !== null ? null : now;
    const safeEvents = events.filter(event => event.case_id === record?.id);
    const reception = stageProgress(safeEvents, {}, 'reception');
    const received = instant(record?.receivedAt) ?? instant(reception.entered?.recorded_at);
    const totalMs = elapsed(received, cutoff);
    const stages = WORKFLOW_STAGES.map(stage => {
        const progress = stageProgress(safeEvents, record?.tracking, stage.id);
        const entered = instant(progress.entered?.recorded_at);
        const started = instant(progress.started?.recorded_at);
        const completed = instant(progress.completed?.recorded_at);
        const timestamps = [entered, started, completed].filter(value => value !== null);
        const invalid = timestamps.some(value => value > now || (validated !== null && value > validated)) ||
            (progress.entered && entered === null) || (progress.started && started === null) ||
            (progress.completed && completed === null) ||
            (progress.started && (entered === null || started < entered)) ||
            (progress.completed && (started === null || completed < started));
        const end = progress.completed ? completed : cutoff;
        return { ...stage, entered, started, completed,
            state: invalid ? 'invalid' : progress.legacyCompleted ? 'historic' : progress.completed ? 'complete' : progress.started ? 'working' : progress.entered ? 'waiting' : 'pending',
            waitMs: invalid ? null : elapsed(entered, progress.started ? started : end),
            workMs: invalid || !progress.started ? null : elapsed(started, end),
            totalMs: invalid ? null : elapsed(entered, end) };
    });

    // Sum only measured intervals inside the total window. Detect overlaps rather
    // than double-counting imported histories or local clocks that moved backwards.
    const intervals = stages.flatMap(stage => stage.state === 'invalid' ? [] : [
        stage.waitMs === null ? null : { start: stage.entered, end: stage.entered + stage.waitMs, kind: 'wait' },
        stage.workMs === null ? null : { start: stage.started, end: stage.started + stage.workMs, kind: 'work' }
    ].filter(Boolean)).sort((a, b) => a.start - b.start);
    const coverageValid = totalMs !== null && intervals.every((interval, index) =>
        interval.start >= received && interval.end <= cutoff && (!index || interval.start >= intervals[index - 1].end));
    const waitMs = coverageValid ? intervals.filter(item => item.kind === 'wait').reduce((sum, item) => sum + item.end - item.start, 0) : null;
    const workMs = coverageValid ? intervals.filter(item => item.kind === 'work').reduce((sum, item) => sum + item.end - item.start, 0) : null;
    return { totalMs, waitMs, workMs, unclassifiedMs: coverageValid ? totalMs - waitMs - workMs : null,
        received, cutoff, state: validated !== null && cutoff !== null ? 'validated' : closed ? 'closed' : 'open', stages };
}

export function formatDuration(milliseconds) {
    if (milliseconds === null || !Number.isFinite(milliseconds) || milliseconds < 0) return 'Sin datos';
    if (milliseconds < 60000) return '< 1 min';
    const minutes = Math.floor(milliseconds / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor(minutes % 1440 / 60);
    return [days && `${days} d`, hours && `${hours} h`, `${minutes % 60} min`].filter(Boolean).join(' ');
}
