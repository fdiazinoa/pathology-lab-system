import test from 'node:test';
import assert from 'node:assert/strict';
import { workflowTat, formatDuration } from '../src/services/workflowTat.js';

const at = hour => `2026-10-20T${String(hour).padStart(2, '0')}:00:00Z`;
const event = (stage, action, hour, caseId = 'case') => ({ case_id: caseId, stage_id: stage, event_type: action, recorded_at: at(hour) });
const record = { id: 'case', status: 'Borrador', receivedAt: at(8) };
const HOUR = 3600000;
const cycle = (stage, enter, start, end) => [event(stage, 'enter', enter), event(stage, 'start', start), event(stage, 'complete', end)];

test('total closes at report validation and reconciles wait, work and transfers', () => {
    const events = [...cycle('reception', 8, 9, 10), ...cycle('macroscopy', 12, 13, 15)];
    const result = workflowTat({ ...record, status: 'Finalizado', validatedAt: at(18) }, events, Date.parse(at(23)));
    assert.equal(result.totalMs, 10 * HOUR);
    assert.equal(result.waitMs, 2 * HOUR);
    assert.equal(result.workMs, 3 * HOUR);
    assert.equal(result.unclassifiedMs, 5 * HOUR);
    assert.equal(result.stages[1].totalMs, 3 * HOUR);
    assert.equal(result.state, 'validated');
    assert.equal(workflowTat({ ...record, status: 'Entregado', validatedAt: at(18) }, events, Date.parse(at(23))).totalMs, result.totalMs);
});

test('waiting and working clocks advance; completed stage is frozen', () => {
    const events = [event('reception', 'enter', 8)];
    assert.equal(workflowTat(record, events, Date.parse(at(10))).stages[0].waitMs, 2 * HOUR);
    assert.equal(workflowTat(record, events, Date.parse(at(11))).stages[0].waitMs, 3 * HOUR);
    events.push(event('reception', 'start', 10));
    const result = workflowTat(record, events, Date.parse(at(12)));
    assert.equal(result.stages[0].waitMs, 2 * HOUR);
    assert.equal(result.stages[0].workMs, 2 * HOUR);
    events.push(event('reception', 'complete', 11));
    assert.equal(workflowTat(record, events, Date.parse(at(14))).stages[0].workMs, HOUR);
});

test('finishing operational validation does not close total; reopening uses original reception', () => {
    const events = cycle('validation', 10, 11, 12);
    assert.equal(workflowTat(record, events, Date.parse(at(15))).totalMs, 7 * HOUR);
    assert.equal(workflowTat({ ...record, validatedAt: null }, events, Date.parse(at(18))).totalMs, 10 * HOUR);
});

test('historic or missing dates do not become fabricated midnight times', () => {
    const historic = { ...record, receivedAt: undefined, createdAt: '2026-10-20', tracking: { reception: { completed: true, timestamp: at(9) } } };
    const result = workflowTat(historic, [], Date.parse(at(12)));
    assert.equal(result.totalMs, null);
    assert.equal(result.stages[0].state, 'historic');
    assert.equal(result.stages[0].totalMs, null);
    const fallback = workflowTat({ ...record, receivedAt: '2026-10-20' }, [event('reception', 'enter', 9)], Date.parse(at(12)));
    assert.equal(fallback.totalMs, 3 * HOUR);
});

test('closed or cancelled cases without validation time stop instead of growing forever', () => {
    for (const status of ['Finalizado', 'Listo para despacho', 'En Transito', 'Entregado', 'Cancelado']) {
        const result = workflowTat({ ...record, status }, [event('reception', 'enter', 8)], Date.parse(at(12)));
        assert.equal(result.totalMs, null);
        assert.equal(result.stages[0].waitMs, null);
    }
});

test('invalid, future or reversed timestamps yield unavailable durations', () => {
    for (const events of [cycle('reception', 10, 9, 11), cycle('reception', 8, 9, 20), [event('reception', 'start', 9)], [{ ...event('reception', 'enter', 8), recorded_at: 'invalid' }]]) {
        const stage = workflowTat(record, events, Date.parse(at(12))).stages[0];
        assert.equal(stage.state, 'invalid');
        assert.equal(stage.totalMs, null);
        assert.equal(stage.waitMs, null);
        assert.equal(stage.workMs, null);
    }
    assert.equal(workflowTat({ ...record, validatedAt: at(7) }, [], Date.parse(at(12))).totalMs, null);
    assert.equal(workflowTat({ ...record, validatedAt: at(20) }, [], Date.parse(at(12))).totalMs, null);
});

test('overlapping or out-of-window events cannot be double-counted in total breakdown', () => {
    for (const events of [[...cycle('reception', 8, 9, 12), ...cycle('macroscopy', 10, 11, 13)], cycle('reception', 6, 7, 9)]) {
        const result = workflowTat(record, events, Date.parse(at(15)));
        assert.equal(result.totalMs, 7 * HOUR);
        assert.equal(result.waitMs, null);
        assert.equal(result.workMs, null);
        assert.equal(result.unclassifiedMs, null);
    }
});

test('case isolation, timezone offsets and continuous calendar days', () => {
    const events = cycle('reception', 8, 9, 10).map(item => ({ ...item, case_id: 'other' }));
    const result = workflowTat({ ...record, receivedAt: '2026-10-18T04:00:00-04:00' }, events, Date.parse(at(8)));
    assert.equal(result.totalMs, 48 * HOUR);
    assert.equal(result.stages[0].state, 'pending');
    assert.equal(result.unclassifiedMs, 48 * HOUR);
    assert.equal(formatDuration(result.totalMs), '2 d 0 min');
    assert.equal(formatDuration(0), '< 1 min');
    assert.equal(formatDuration(null), 'Sin datos');
    assert.equal(formatDuration(-1), 'Sin datos');
    assert.equal(formatDuration(90 * 60000), '1 h 30 min');
});
