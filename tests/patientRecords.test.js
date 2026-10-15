import test from 'node:test';
import assert from 'node:assert/strict';
import { patientFromRow, patientPayload, prepareReceptionPatient, ageFromBirthDate, patientSaveError } from '../src/services/patientRecords.js';

test('cloud identity and all patient fields survive the database round trip', () => {
    const form = { id: 'temporary-client-id', name: '  Test Patient  ', age: '37', sex: 'F', cedula: 'TEST-123', history: 'Example only', city: 'City', region: 'Region', phone: '000', arsName: 'Plan', policyNumber: 'POL' };
    const payload = patientPayload(form);
    assert.equal(payload.full_name, 'Test Patient');
    assert.equal(payload.identification_number, 'TEST-123');
    assert.equal(payload.age, 37);
    assert.equal(payload.id, undefined);
    const saved = patientFromRow({ ...payload, id: 'persisted-id' });
    assert.equal(saved.id, 'persisted-id');
    for (const key of ['cedula','history','city','region','phone','arsName','policyNumber']) assert.equal(saved[key], form[key]);
});
test('corrections persist both aliases and canonical fields, including blank optional values', () => {
    const payload = patientPayload({ name: 'Corrected', full_name: 'Old name', cedula: 'NEW', identification_number: 'OLD', age: '12', history: '', medical_history: 'old', phone: '' });
    assert.equal(payload.full_name, 'Corrected');
    assert.equal(payload.identification_number, 'NEW');
    assert.equal(payload.medical_history, null);
    assert.equal(payload.contact_phone, null);
    assert.equal(patientPayload({ name: 'Partial' }).identification_number, undefined);
});
test('quick registration rejects invalid ages and missing adult documents without discarding inputs', () => {
    for (const age of ['', '-1', '18.5', 'text', '131']) assert.throws(() => prepareReceptionPatient({ name: 'Test', age, sex: 'F', cedula: 'TEST' }, []));
    const form = { name: 'Test', age: '20', sex: 'F', cedula: '' };
    assert.throws(() => prepareReceptionPatient(form, []), /obligatorio/);
    assert.equal(form.age, '20');
    assert.equal(form.name, 'Test');
});
test('minor documents are unique and duplicates are checked against other patients only', () => {
    const form = { name: 'Test', age: '12', sex: 'F', cedula: '' };
    const first = prepareReceptionPatient(form, []);
    const second = prepareReceptionPatient(form, []);
    assert.notEqual(first.cedula, second.cedula);
    const existing = [{ id: 'a', name: 'Existing', cedula: 'TEST-123' }];
    assert.throws(() => prepareReceptionPatient({ ...form, cedula: 'test 123' }, existing), /Ya existe/);
    assert.doesNotThrow(() => prepareReceptionPatient({ ...form, cedula: 'test 123' }, existing, 'a'));
});
test('birth dates calculate birthdays accurately and reject impossible/future dates', () => {
    const today = new Date(2026, 9, 15);
    assert.equal(ageFromBirthDate('2000-10-15', today), 26);
    assert.equal(ageFromBirthDate('2000-10-16', today), 25);
    assert.throws(() => ageFromBirthDate('2001-02-29', today), /inválida/);
    assert.throws(() => ageFromBirthDate('2027-01-01', today), /inválida/);
});
test('duplicate failures provide an actionable message', () => {
    assert.match(patientSaveError({ code: '23505' }), /No se guardaron/);
});
