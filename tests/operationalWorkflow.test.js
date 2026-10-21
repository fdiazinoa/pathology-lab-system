import test from 'node:test';
import assert from 'node:assert/strict';
import { WORKFLOW_STAGES, stageProgress, canEnterStage, stationPayload, caseEditorSignature } from '../src/services/operationalWorkflow.js';
import { localCasesWithOperationalStages } from '../src/services/localOperationalWorkflow.js';
import DataProvider from '../src/services/providers/DataProvider.js';
import { guardProvider } from '../src/services/permissionGuard.js';
import { buildLabInfoPayload, labInfoToSettings } from '../src/services/labSettings.js';

class LocalFixture extends DataProvider {
    operationalStoragePrefix = 'test';
    settings = { enableOperationalWorkflow: true, requireInternalQRScan: true };
    user = { id: 'operator', name: 'Operador' };
    record = { id: 'case', status: 'Borrador', diagnosis: '', specimens: [{ id: 'specimen', blocks: [{ id: 'block' }] }] };
    allowed = true;
    async getCurrentUser() { return this.user; }
    async getSettings() { return this.settings; }
    async getCase(id) { return id === this.record.id ? this.record : undefined; }
    async checkPermission() { return this.allowed; }
}

function fixture() {
    const store = new Map();
    globalThis.localStorage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) };
    const provider = new LocalFixture();
    return { provider, api: guardProvider(provider, () => true), store };
}

test('entry, start and completion persist independent events and keep the starting operator responsible', async () => {
    const { provider, api, store } = fixture();
    const station = await api.addWorkflowStation({ code: ' macro-01 ', name: 'Mesa de macroscopía' });
    for (const action of ['enter', 'start', 'complete']) {
        if (action === 'complete') provider.user = { id: 'second-operator', name: 'Segundo operador' };
        await api.recordOperationalStage('case', 'reception', action, station.id, 'block\r\n');
    }
    const reloaded = await api.getOperationalWorkflow('case');
    assert.equal(reloaded.events.length, 3);
    const progress = stageProgress(reloaded.events, {}, 'reception');
    assert.equal(progress.started.actor_id, 'operator');
    assert.equal(progress.completed.actor_id, 'second-operator');
    assert.equal(progress.entered.station_code, 'MACRO-01');
    assert.equal(progress.completed.block_id, 'block');
    assert.ok(Date.parse(progress.entered.recorded_at) <= Date.parse(progress.completed.recorded_at));
    assert.equal(provider.record.status, 'Borrador');
    store.set('test_settings', JSON.stringify(provider.settings));
    assert.equal(localCasesWithOperationalStages(provider, [provider.record])[0].current_stage, 'recepcion');
    assert.deepEqual((await api.getOperationalWorkflow('another-case')).events, []);
});

test('failed actions leave no partial history: wrong order, foreign QR, missing/different station and duplicates', async () => {
    const { api } = fixture();
    const station = await api.addWorkflowStation({ code: 'LAB-01', name: 'Mesa 1' });
    const other = await api.addWorkflowStation({ code: 'LAB-02', name: 'Mesa 2' });
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'start', station.id, 'block'), /etapa cambió/);
    await assert.rejects(api.recordOperationalStage('case', 'macroscopy', 'enter', station.id, 'block'), /anteriores/);
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'enter', 'missing', 'block'), /estación activa/);
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'enter', station.id, 'foreign-block'), /QR/);
    assert.equal((await api.getOperationalWorkflow('case')).events.length, 0);
    await api.recordOperationalStage('case', 'reception', 'enter', station.id, 'block');
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'enter', station.id, 'block'), /etapa cambió/);
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'start', other.id, 'block'), /donde registró/);
    assert.equal((await api.getOperationalWorkflow('case')).events.length, 1);
});

test('disabled flag, closed cases, missing session and revoked permission prevent writes', async () => {
    const { provider, api } = fixture();
    const station = await api.addWorkflowStation({ code: 'LAB-01', name: 'Mesa' });
    provider.settings.enableOperationalWorkflow = false;
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'enter', station.id, 'block'), /desactivado/);
    provider.settings.enableOperationalWorkflow = true;
    provider.record.status = 'Cancelado';
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'enter', station.id, 'block'), /cerrado/);
    provider.record.status = 'Borrador';
    provider.user = null;
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'enter', station.id, 'block'), /sesión/);
    provider.user = { id: 'operator', name: 'Operador' };
    provider.allowed = false;
    await assert.rejects(api.recordOperationalStage('case', 'reception', 'enter', station.id, 'block'), /permiso/);
    assert.equal((await provider.getOperationalWorkflow('case')).events.length, 0);
});

test('legacy completions remain historic and do not fabricate entry/start timestamps', async () => {
    const { provider, api } = fixture();
    provider.record.tracking = { reception: { completed: true, timestamp: '2026-10-01T10:00:00Z', user: 'Anterior' } };
    const station = await api.addWorkflowStation({ code: 'LAB-01', name: 'Mesa' });
    const historic = stageProgress([], provider.record.tracking, 'reception');
    assert.equal(historic.legacyCompleted, true);
    assert.equal(historic.entered, undefined);
    assert.equal(historic.started, undefined);
    assert.equal(canEnterStage([], provider.record.tracking, 'macroscopy'), true);
    const result = await api.recordOperationalStage('case', 'macroscopy', 'enter', station.id, 'case');
    assert.equal(result.events.length, 1);
    assert.equal(result.currentStage, 'macroscopia');
});

test('station identifiers are explicit, normalized and unique', async () => {
    const { api } = fixture();
    assert.deepEqual(stationPayload({ code: ' histo-1 ', name: ' Puesto real ' }), { code: 'HISTO-1', name: 'Puesto real' });
    for (const invalid of [{}, { code: 'con espacio', name: 'Mesa' }, { code: '01', name: '' }]) assert.throws(() => stationPayload(invalid), /código/);
    await api.addWorkflowStation({ code: 'LAB-01', name: 'Mesa' });
    await assert.rejects(api.addWorkflowStation({ code: 'lab-01', name: 'Otra' }), /Ya existe/);
});

test('a stage-only cache refresh preserves the editor, but clinical/catalog changes reload it', () => {
    const record = { id: 'case', stage: 'histologia', current_stage: 'recepcion', macroscopy: 'Texto guardado', specimens: [{id:'s'}] };
    const signature = caseEditorSignature(record, []);
    assert.equal(caseEditorSignature({ ...record, stage: 'microscopia', current_stage: 'microscopia' }, []), signature);
    assert.notEqual(caseEditorSignature({ ...record, macroscopy: 'Texto corregido' }, []), signature);
    assert.notEqual(caseEditorSignature(record, [{ id: 'exam' }]), signature);
    assert.equal(WORKFLOW_STAGES.at(-1).caseStage, 'por_firmar');
});

test('operational opt-in persists without enabling it for existing laboratories', () => {
    const row = { settings: { requireInternalQRScan: true } };
    assert.equal(Boolean(labInfoToSettings(row).enableOperationalWorkflow), false);
    for (const flag of [true, false]) {
        const updated = { ...row, ...buildLabInfoPayload(row, { enableOperationalWorkflow: flag }) };
        assert.equal(labInfoToSettings(JSON.parse(JSON.stringify(updated))).enableOperationalWorkflow, flag);
        assert.equal(updated.settings.requireInternalQRScan, true);
    }
});
