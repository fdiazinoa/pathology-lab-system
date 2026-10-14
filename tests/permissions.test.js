import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultRoles, emptyPermissions, hasPermission, normalizePermissions, permissionForPath } from '../src/services/permissions.js';
import { caseRequirements, guardProvider, requirements } from '../src/services/permissionGuard.js';
const roles = defaultRoles();
const user = { id: 'u', roleId: '2' };

test('known defaults preserve clinical roles and separate validation from technical work', () => {
    assert.equal(hasPermission(user, roles, 'reports', 'validate'), true);
    assert.equal(hasPermission({ roleId: '3' }, roles, 'reports', 'validate'), false);
    assert.equal(hasPermission({ roleId: '3' }, roles, 'macroscopy', 'edit'), true);
    assert.equal(hasPermission({ roleId: '4' }, roles, 'cases', 'edit'), false);
});
test('unknown permissions, missing roles, inactive roles and nonboolean values fail closed', () => {
    for (const action of ['anything', '__proto__']) assert.equal(hasPermission({ roleId: '1' }, roles, 'reports', action), false);
    assert.equal(hasPermission(user, [], 'reports', 'read'), false);
    assert.equal(hasPermission(user, [{ ...roles[1], is_active: false }], 'reports', 'read'), false);
    assert.equal(hasPermission(user, [{ id: '2', permissions: { reports: { read: true, sign: 'true' } } }], 'reports', 'sign'), false);
    assert.equal(hasPermission(null, roles, 'reports', 'read'), false);
});
test('legacy write migrates create/edit only; explicit false wins and read is required', () => {
    const permissions = normalizePermissions({ reports: { read: true, write: true, edit: false } });
    assert.equal(permissions.reports.edit, false);
    assert.equal(permissions.reports.validate, false);
    assert.equal(permissions.reports.sign, false);
    assert.equal(hasPermission(user, [{ id: '2', permissions: { cases: { read: false, edit: true } } }], 'cases', 'edit'), false);
    assert.ok(Object.values(emptyPermissions()).every(s => Object.values(s).every(v => v === false)));
});
test('routes enforce the operation rather than a fixed role number', () => {
    assert.deepEqual(permissionForPath('/cases/new'), ['cases', 'create']);
    assert.deepEqual(permissionForPath('/cases/123/microscopy'), ['microscopy', 'read']);
    assert.deepEqual(permissionForPath('/cases/123'), ['reports', 'read']);
    assert.deepEqual(permissionForPath('/roles'), ['roles', 'read']);
    assert.deepEqual(permissionForPath('/unknown'), ['__unknown', 'read']);
});
test('validation, signing and reopening require independent actions', () => {
    const draft = { id: 'case', status: 'Borrador', diagnosis: 'Example' };
    assert.deepEqual(caseRequirements(draft, { ...draft, status: 'Finalizado' }), [['reports', 'validate']]);
    assert.throws(() => caseRequirements(draft, { ...draft, status: 'Listo para despacho' }), /Valide/);
    assert.deepEqual(caseRequirements({ ...draft, status: 'Finalizado' }, { ...draft, status: 'Listo para despacho' }), [['reports', 'sign']]);
    assert.deepEqual(caseRequirements({ ...draft, status: 'Finalizado' }, { ...draft }), [['reports', 'reopen']]);
    assert.throws(() => caseRequirements({ ...draft, status: 'Finalizado' }, { ...draft, diagnosis: 'Changed' }), /Reabra/);
    assert.throws(() => caseRequirements({ ...draft, diagnosis: '' }, { ...draft, diagnosis: '', status: 'Finalizado' }), /diagnóstico/);
});
test('template changes and clinical fields require their own permissions', () => {
    const before = { id: 'case', status: 'Borrador', macroscopy: 'A' };
    assert.deepEqual(caseRequirements(before, { ...before, macroscopy: 'B' }), [['macroscopy', 'edit']]);
    const required = caseRequirements(before, { ...before, resultDetails: { _template: { id: 't' } } });
    assert.ok(required.some(([s,a]) => s === 'templates' && a === 'use'));
    assert.ok(required.some(([s,a]) => s === 'reports' && a === 'edit'));
});
test('new cases stay draft and do not require diagnostic permissions for empty fields', async () => {
    assert.deepEqual(await requirements({}, 'addCase', [{ status: 'Borrador', macroscopy: '', microscopy: '', diagnosis: '', resultDetails: {}, images: [] }]), [['cases', 'create']]);
    await assert.rejects(requirements({}, 'addCase', [{ status: 'Finalizado' }]), /borrador/);
});
test('revoked cloud permissions are checked afresh before every write', async () => {
    let permission = true; let writes = 0;
    const provider = guardProvider({ checkPermission: async () => permission, addDoctor: async () => ++writes }, () => true);
    assert.equal(await provider.addDoctor({}), 1);
    permission = false;
    await assert.rejects(provider.addDoctor({}), /permiso/);
    assert.equal(writes, 1);
});
test('template import does not grant configuration editing or group reassignment', async () => {
    const provider = { getSettings: async () => ({ labName: 'Lab', resultTemplates: [], resultTemplateExamGroups: {} }) };
    assert.deepEqual(await requirements(provider, 'updateSettings', [{ resultTemplates: [{ id: 't' }] }]), [['templates', 'import']]);
    assert.deepEqual(await requirements(provider, 'updateSettings', [{ resultTemplateExamGroups: { e: 'B' } }]), [['templates', 'assign']]);
    assert.deepEqual(await requirements(provider, 'updateSettings', [{ labName: 'Changed' }]), [['settings', 'edit']]);
});
