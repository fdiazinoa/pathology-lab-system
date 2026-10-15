const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Resolve display names without changing the immutable audit event or its IDs.
export function auditDisplay(log, users = []) {
    const findUser = id => users.find(user => String(user.id).toLowerCase() === String(id).toLowerCase());
    const actorId = log.userId || log.user;
    const actor = findUser(actorId);
    const user = actor?.name || actor?.full_name || (uuid.test(log.user || '') ? 'Usuario no disponible' : log.user) || 'Sistema';
    let details = log.details || '';
    // Only profile references identify users; other records can have unrelated UUIDs.
    if (log.action?.endsWith(': profiles')) {
        const reference = details.match(/^Registro ([0-9a-f-]{36}):/i);
        if (reference && uuid.test(reference[1])) {
            const target = findUser(reference[1]);
            const name = target?.name || target?.full_name || 'Usuario no disponible';
            details = `Registro de ${name}:${details.slice(reference[0].length)}`;
        }
    }
    return { ...log, user, details, actorId, originalDetails: log.details };
}
