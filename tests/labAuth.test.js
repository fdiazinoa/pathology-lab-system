import test from 'node:test';
import assert from 'node:assert/strict';
import { createLabAuth } from '../src/services/labAuthCore.js';

const fixture = ({ profile = null, profileError = null, user = { id: 'verified-id', email: 'user@lab.com', user_metadata: { role: 'admin' } } } = {}) => {
    const calls = [];
    const client = {
        auth: {
            getUser: async () => ({ data: { user }, error: null }),
            signInWithPassword: async () => ({ error: null }),
            signOut: async () => { calls.push('signout'); },
            signUp: async (options) => { calls.push(options); return { error: null }; },
            signInWithOAuth: async (options) => { calls.push(options); return { data: {}, error: null }; }
        },
        from: (table) => { assert.equal(table, 'profiles'); return { select: () => ({ eq: (key, id) => { assert.equal(key, 'id'); assert.equal(id, 'verified-id'); return { maybeSingle: async () => ({ data: profile, error: profileError }) }; } }) }; }
    };
    return { auth: createLabAuth(client), calls };
};

test('metadata cannot authorize a user without an approved profile', async () => {
    const { auth, calls } = fixture();
    assert.equal(await auth.authorizedUser(), null);
    assert.equal((await auth.password('user@lab.com', 'secret')).success, false);
    assert.deepEqual(calls, ['signout']);
});
test('role is read from the database and inactive users are denied', async () => {
    assert.equal((await fixture({ profile: { role: 'patólogo', full_name: 'Ana' } }).auth.authorizedUser()).roleId, '2');
    assert.equal(await fixture({ profile: { role: 'admin', is_active: false } }).auth.authorizedUser(), null);
    assert.equal(await fixture({ profile: { role: 'admin', status: 'Inactive' } }).auth.authorizedUser(), null);
});
test('authorization errors fail closed and password session is cleared', async () => {
    const { auth, calls } = fixture({ profileError: { message: 'missing table' } });
    await assert.rejects(auth.authorizedUser(), /verificar/);
    assert.equal((await auth.password('user@lab.com', 'secret')).success, false);
    assert.deepEqual(calls, ['signout']);
});
test('registration submits identity only and clears an automatically issued session', async () => {
    globalThis.window = { location: { origin: 'https://lab.example' } };
    const { auth, calls } = fixture();
    await auth.register({ name: ' Ana ', email: ' ana@lab.com ', password: 'example123' });
    assert.deepEqual(calls[0].options.data, { full_name: 'Ana' });
    assert.equal(calls[0].options.emailRedirectTo, 'https://lab.example/auth/callback');
    assert.equal(calls[1], 'signout');
    await auth.google();
    assert.deepEqual(calls[2], { provider: 'google', options: { redirectTo: 'https://lab.example/auth/callback' } });
});

test('custom roles come from the verified profile and system administrators stay protected', async () => {
    const custom = await fixture({ profile: { role: 'pathologist', permission_role_id: 'custom-role', full_name: 'Ana' } }).auth.authorizedUser();
    assert.equal(custom.roleId, 'custom-role');
    const admin = await fixture({ profile: { role: 'admin', permission_role_id: 'custom-role' } }).auth.authorizedUser();
    assert.equal(admin.roleId, '1');
});
