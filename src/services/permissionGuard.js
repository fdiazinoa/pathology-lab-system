// UI checks aid discovery; cloud operations also check fresh database permissions and RLS.
export function guardProvider(provider, can) {
    const check = async (section, action) => {
        const allowed = provider.checkPermission ? await provider.checkPermission(section, action) : can(section, action);
        if (!allowed) throw new Error(`No tiene permiso para esta acción (${section}.${action}).`);
    };
    return new Proxy(provider, {
        get(target, method) {
            const fn = target[method];
            if (typeof fn !== 'function') return fn;
            return async (...args) => {
                for (const [section, action] of await requirements(target, method, args)) await check(section, action);
                return fn.apply(target, args);
            };
        }
    });
}
const emptyInitial = (before, after) => before == null && (after === '' || (Array.isArray(after) && after.length === 0) || (after && typeof after === 'object' && Object.keys(after).length === 0));
const changed = (before, after, key) => Object.hasOwn(after, key) && JSON.stringify(before?.[key] ?? null) !== JSON.stringify(after[key] ?? null);
export async function requirements(provider, method, args) {
    const crud = method.match(/^(add|update|delete)(Patient|Case|Center|Doctor|Organ|Exam|Insurer|Equipment|Role|User)$/);
    if (method === 'addCase') {
        const next = args[0];
        if (next.status && next.status !== 'Borrador') throw new Error('Los casos nuevos deben guardarse como borrador.');
        return [['cases', 'create'], ...caseRequirements({ id: next.id, status: 'Borrador' }, { ...next, status: 'Borrador' }).filter(([section]) => section !== 'cases')];
    }
    if (crud && !['updateCase', 'updateUser', 'addUser'].includes(method)) {
        const resource = { Patient: 'patients', Case: 'cases', Center: 'centers', Doctor: 'doctors', Organ: 'organs', Exam: 'exams', Insurer: 'insurers', Equipment: 'equipment', Role: 'roles', User: 'users' }[crud[2]];
        return [[resource, { add: 'create', update: 'edit', delete: crud[2] === 'User' ? 'deactivate' : 'delete' }[crud[1]]]];
    }
    if (method === 'admitUser') return [['users', 'assignRole'], ['users', 'deactivate']];
    if (method === 'addUser') return [['users', 'create'], ['users', 'assignRole']];
    if (method === 'updateUser') {
        const old = (await provider.getUsers()).find(u => u.id === args[0].id);
        const required = [];
        if (changed(old, args[0], 'roleId')) required.push(['users', 'assignRole']);
        if (changed(old, args[0], 'status')) required.push(['users', 'deactivate']);
        if (changed(old, args[0], 'name') || changed(old, args[0], 'email')) required.push(['users', 'edit']);
        return required;
    }
    if (method === 'updateCase') return caseRequirements(await provider.getCase(args[0].id), args[0]);
    if (method === 'updateSettings') {
        const old = await provider.getSettings();
        const required = [];
        for (const key of Object.keys(args[0])) if (changed(old, args[0], key)) {
            const action = key === 'resultTemplates' ? ['templates', 'import'] : key === 'resultTemplateExamGroups' ? ['templates', 'assign'] : ['settings', 'edit'];
            if (!required.some(r => r.join('.') === action.join('.'))) required.push(action);
        }
        return required;
    }
    const actions = { dispatchCase: ['dispatch', 'dispatch'], addDelivery: ['logistics', 'create'], updateCaseStage: ['processing', 'edit'], updateCaseInterconsultation: ['collaboration', 'edit'], updateCaseTumorBoard: ['collaboration', 'edit'], publishToGlobal: ['collaboration', 'edit'], saveConnectionConfig: ['system', 'edit'], restoreBackup: ['system', 'edit'], runMigration: ['system', 'edit'] };
    return actions[method] ? [actions[method]] : [];
}
export function caseRequirements(old, next) {
    if (!old) throw new Error('Caso no encontrado.');
    const required = [];
    const fields = { stage: 'processing', current_stage: 'processing', interconsultation: 'collaboration', tumorBoard: 'collaboration', macroscopyStructured: 'macroscopy', macroscopy_text: 'macroscopy', microscopyStructured: 'microscopy', ihc_results: 'ihc', macroscopy: 'macroscopy', microscopy: 'microscopy', ihc: 'ihc', diagnosis: 'reports', resultDetails: 'reports', images: 'images', tracking: 'processing', patientId: 'cases', patientName: 'cases', examId: 'cases', organ: 'cases', organId: 'cases', doctorId: 'cases', clinicalData: 'cases', type: 'cases', totalCost: 'cases' };
    const clinicalChanged = Object.entries(fields).some(([key, section]) => ['cases', 'macroscopy', 'microscopy', 'ihc', 'reports', 'images'].includes(section) && changed(old, next, key) && !emptyInitial(old[key], next[key]));
    const locked = ['Finalizado', 'Listo para despacho', 'En Transito', 'Entregado'].includes(old.status);
    if (locked && clinicalChanged) throw new Error('Reabra el informe antes de modificar su contenido.');
    for (const [key, section] of Object.entries(fields)) if (changed(old, next, key) && !emptyInitial(old[key], next[key])) {
        const action = key === 'images' ? ((next.images?.length || 0) > (old.images?.length || 0) ? 'upload' : (next.images?.length || 0) < (old.images?.length || 0) ? 'delete' : 'edit') : 'edit';
        required.push([section, action]);
    }
    for (const key of Object.keys(next)) {
        if (Object.hasOwn(fields, key) || ['id', 'status', 'auditLogs', 'updatedAt', 'updated_at', 'validatedAt', 'validatedBy', 'releasedAt', 'releasedBy', 'digitalSignature'].includes(key)) continue;
        if (changed(old, next, key) && !emptyInitial(old[key], next[key])) required.push(['cases', 'edit']);
    }
    for (const key of ['validatedAt', 'validatedBy']) if (changed(old, next, key) && next[key]) required.push(['reports', 'validate']);
    for (const key of ['releasedAt', 'releasedBy', 'digitalSignature']) if (changed(old, next, key) && next[key]) required.push(['reports', 'sign']);
    if (next.resultDetails?._template?.id !== old.resultDetails?._template?.id && next.resultDetails?._template) required.push(['templates', 'use']);
    if (changed(old, next, 'status')) {
        const transition = { Finalizado: ['reports', 'validate'], 'Listo para despacho': ['reports', 'sign'], Borrador: ['reports', 'reopen'], 'En Transito': ['dispatch', 'dispatch'], Entregado: ['logistics', 'deliver'] }[next.status];
        required.push(transition || ['processing', 'edit']);
        if (next.status === 'Listo para despacho' && old.status !== 'Finalizado') throw new Error('Valide el informe antes de firmarlo.');
        if (['Finalizado', 'Listo para despacho'].includes(next.status) && !next.diagnosis?.trim()) throw new Error('El diagnóstico es obligatorio para validar.');
    }
    return required;
}
