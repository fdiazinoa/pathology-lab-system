import test from 'node:test';
import assert from 'node:assert/strict';
import { caseStage, caseMapStage } from '../src/services/caseStages.js';
import { caseWithReport } from '../src/services/caseReportMetadata.js';

test('a reloaded cloud case uses the persisted stage even when a legacy value is stale', () => {
    const record = caseWithReport({ id: 'case', current_stage: 'microscopia', stage: 'histologia', metadata: {} });
    assert.equal(record.stage, 'microscopia');
    assert.equal(caseMapStage(record), 'microscopia');
    assert.equal(caseStage({ ...record, current_stage: 'por_firmar', stage: 'por_firmar' }), 'por_firmar');
});

test('detailed cloud stages remain visible in the existing board', () => {
    for (const stage of ['recepcion', 'macroscopia', 'procesamiento', 'microtomia']) {
        assert.equal(caseMapStage({ current_stage: stage }), 'histologia', stage);
    }
    assert.equal(caseMapStage({ current_stage: 'tincion' }), 'estudios_especiales');
    assert.equal(caseMapStage({ current_stage: 'escaneo' }), 'microscopia');
    assert.equal(caseMapStage({ current_stage: 'diagnosis' }), 'por_firmar');
    assert.equal(caseMapStage({ current_stage: 'finalizado' }), 'finalizado');
});

test('legacy local cases keep their board columns and unknown stages are not relabeled', () => {
    for (const [stage, column] of [['Histología', 'histologia'], ['Microscopía', 'microscopia'], ['Estudio Especial', 'estudios_especiales'], ['Por Firmar', 'por_firmar'], ['Finalizado', 'finalizado']]) {
        assert.equal(caseMapStage({ stage }), column);
    }
    assert.equal(caseMapStage({}), 'histologia');
    assert.equal(caseMapStage({ stage: 'otra_estacion' }), 'otra_estacion');
});
