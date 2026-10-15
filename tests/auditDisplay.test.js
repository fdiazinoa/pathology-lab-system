import test from 'node:test';
import assert from 'node:assert/strict';
import { auditDisplay } from '../src/services/auditDisplay.js';
const actor = '4b94ec1f-fbfe-4da4-9994-1d0a99e5a326';
const target = '814c4179-d7d9-4cb9-a2e9-f9447dadfa20';
const users = [{ id: actor, name: 'Administrador Prueba' }, { id: target, name: 'Usuario Prueba' }];

test('audit shows actor and profile target names without changing stored IDs', () => {
    const log = { user: actor, action: 'UPDATE: profiles', details: `Registro ${target}: {}`, id: 'event-1' };
    const displayed = auditDisplay(log, users);
    assert.equal(displayed.user, 'Administrador Prueba');
    assert.equal(displayed.details, 'Registro de Usuario Prueba: {}');
    assert.equal(displayed.actorId, actor);
    assert.equal(displayed.originalDetails, log.details);
    assert.equal(log.user, actor);
    assert.equal(log.details, `Registro ${target}: {}`);
});

test('legacy names, system events and non-profile references remain intact', () => {
    assert.equal(auditDisplay({ user: 'Operador' }).user, 'Operador');
    assert.equal(auditDisplay({}).user, 'Sistema');
    assert.equal(auditDisplay({ user: actor, action: 'UPDATE: centers', details: `Registro ${target}: {}` }, users).details, `Registro ${target}: {}`);
});

test('unavailable users get a readable fallback while keeping a traceable ID', () => {
    const displayed = auditDisplay({ user: actor, action: 'DELETE: profiles', details: `Registro ${target}: {}` });
    assert.equal(displayed.user, 'Usuario no disponible');
    assert.equal(displayed.actorId, actor);
    assert.equal(displayed.details, 'Registro de Usuario no disponible: {}');
});
