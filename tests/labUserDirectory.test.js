import test from 'node:test';
import assert from 'node:assert/strict';
import { managedLabUser } from '../src/services/labUserDirectory.js';
import { requirements } from '../src/services/permissionGuard.js';

test('pending registrations remain visible with email and without a default role', () => {
    const user = managedLabUser({ id: 'new', full_name: 'Francisco', email: 'person@example.invalid', role: 'viewer', is_active: false, email_confirmed: true });
    assert.equal(user.status, 'Pending');
    assert.equal(user.email, 'person@example.invalid');
    assert.equal(user.roleId, '');
    assert.equal(user.emailConfirmed, true);
});
test('inactive approved accounts are distinct from users awaiting admission', () => {
    assert.equal(managedLabUser({ role: 'technician', is_active: false }).status, 'Inactive');
    assert.equal(managedLabUser({ role: 'technician', is_active: true }).status, 'Active');
    assert.equal(managedLabUser({ role: 'pathologist', permission_role_id: 'custom' }).roleId, 'custom');
    assert.equal(managedLabUser({ role: 'admin', permission_role_id: 'custom' }).roleId, '1');
});
test('email confirmation is explicit and admission requires both permissions', async () => {
    assert.equal(managedLabUser({ role: 'viewer' }).emailConfirmed, false);
    assert.deepEqual(await requirements({}, 'admitUser', ['id', '3']), [['users', 'assignRole'], ['users', 'deactivate']]);
});
