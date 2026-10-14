import test from 'node:test';
import assert from 'node:assert/strict';
import { getReceptionCenters } from '../src/services/receptionCenters.js';

test('distinct master IDs with the same name remain selectable', () => {
    const centers = getReceptionCenters([{ id: 'C001', name: 'Centro' }, { id: 'C075', name: 'Centro' }], false);
    assert.deepEqual(centers.map(center => center.id), ['C001', 'C075']);
});
test('production uses only active configured centers; demo retains its directory', () => {
    assert.deepEqual(getReceptionCenters([{ id: 'X', name: 'Inactivo', is_active: false }], false), []);
    assert.deepEqual(getReceptionCenters([], false), []);
    assert.ok(getReceptionCenters([]).length > 0);
});
