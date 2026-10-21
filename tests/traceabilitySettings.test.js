import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLabInfoPayload, labInfoToSettings } from '../src/services/labSettings.js';

test('mandatory QR can be enabled and disabled across a cloud save and reload', () => {
    let row = { name: 'Laboratorio', settings: { aiEnabled: false, resultTemplates: [{ id: 'B:1' }] } };
    for (const required of [true, false]) {
        row = { ...row, ...JSON.parse(JSON.stringify(buildLabInfoPayload(row, { requireInternalQRScan: required }))) };
        const reloaded = labInfoToSettings(row);
        assert.equal(reloaded.requireInternalQRScan, required);
        assert.equal(reloaded.aiEnabled, false);
        assert.equal(reloaded.labName, 'Laboratorio');
        assert.deepEqual(reloaded.resultTemplates, [{ id: 'B:1' }]);
    }
});

test('the legacy QR setting is honored unless the current setting explicitly overrides it', () => {
    assert.equal(labInfoToSettings({ settings: { requireStepQR: true } }).requireInternalQRScan, true);
    assert.equal(labInfoToSettings({ settings: { requireStepQR: true, requireInternalQRScan: false } }).requireInternalQRScan, false);
    assert.equal(labInfoToSettings({}).requireInternalQRScan, false);
});
