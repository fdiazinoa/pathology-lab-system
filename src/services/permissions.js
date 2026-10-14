// One catalogue for the role editor, navigation and operation checks.
export const ACTION_LABELS = { read: 'Ver', create: 'Crear', edit: 'Editar', delete: 'Eliminar', use: 'Usar', import: 'Importar', assign: 'Asignar grupos', validate: 'Validar', sign: 'Firmar y liberar', reopen: 'Reabrir', print: 'Imprimir', dispatch: 'Despachar', deliver: 'Entregar', upload: 'Subir imágenes', analyze: 'Analizar con IA', assignRole: 'Asignar rol', deactivate: 'Desactivar' };
const section = (id, label, actions) => ({ id, label, actions: ['read', ...actions.split(' ').filter(Boolean)] });
export const PERMISSION_SECTIONS = [
    section('dashboard', 'Panel de inicio', ''),
    section('patients', 'Pacientes', 'create edit'),
    section('cases', 'Casos y datos generales', 'create edit delete'),
    section('reception', 'Recepción de muestras', 'create edit'),
    section('processing', 'Procesamiento y etapas', 'edit'),
    section('macroscopy', 'Macroscopía', 'edit'),
    section('microscopy', 'Microscopía / citología', 'edit'),
    section('ihc', 'Inmunohistoquímica', 'edit'),
    section('images', 'Imágenes', 'upload edit delete analyze'),
    section('templates', 'Plantillas de resultados', 'use import assign'),
    section('reports', 'Informes y diagnóstico', 'edit validate sign reopen print'),
    section('dispatch', 'Despacho', 'dispatch'),
    section('logistics', 'Logística y entregas', 'create edit deliver'),
    section('collaboration', 'Tumor board y red global', 'edit'),
    ...[['centers', 'Centros'], ['doctors', 'Doctores'], ['organs', 'Órganos'], ['exams', 'Exámenes y tarifas'], ['insurers', 'Aseguradoras'], ['equipment', 'Equipos']].map(([id, label]) => section(id, label, 'create edit delete')),
    section('financials', 'Finanzas y análisis', ''),
    section('settings', 'Configuración del laboratorio', 'edit'),
    section('users', 'Usuarios', 'create edit assignRole deactivate'),
    section('roles', 'Roles y permisos', 'create edit delete'),
    section('audit', 'Auditoría y uso', ''),
    section('system', 'Conexiones, respaldos y migración', 'edit'),
    section('help', 'Ayuda', '')
];
export const emptyPermissions = () => Object.fromEntries(PERMISSION_SECTIONS.map(s => [s.id, Object.fromEntries(s.actions.map(a => [a, false]))]));
export function normalizePermissions(input = {}) {
    const result = emptyPermissions();
    for (const s of PERMISSION_SECTIONS) for (const a of s.actions) {
        const explicit = input?.[s.id]?.[a];
        result[s.id][a] = typeof explicit === 'boolean' ? explicit : ['create', 'edit'].includes(a) && input?.[s.id]?.write === true;
    }
    return result;
}
export function hasPermission(user, roles, sectionId, action = 'read') {
    if (!user || user.status === 'Inactive' || user.is_active === false || !PERMISSION_SECTIONS.some(s => s.id === sectionId && s.actions.includes(action))) return false;
    const role = roles.find(r => r.id === user.roleId);
    if (!role || role.is_active === false) return false;
    // System administrator is an immutable built-in role; cloud assignment is database protected.
    if (role.id === '1') return true;
    const permissions = normalizePermissions(role.permissions);
    return permissions[sectionId]?.read === true && permissions[sectionId]?.[action] === true;
}
export function defaultRoles() {
    const make = (id, name, grants) => {
        const permissions = emptyPermissions();
        for (const [key, actions] of Object.entries(grants)) for (const action of actions.split(' ')) permissions[key][action] = true;
        return { id, name, description: name, permissions, is_system: true, is_active: true };
    };
    const common = { dashboard: 'read', help: 'read', centers: 'read', doctors: 'read', organs: 'read', exams: 'read', insurers: 'read', templates: 'read use' };
    return [
        make('1', 'Administrador', Object.fromEntries(PERMISSION_SECTIONS.map(s => [s.id, s.actions.join(' ')]))),
        make('2', 'Patólogo', { ...common, patients: 'read', cases: 'read create edit', macroscopy: 'read edit', microscopy: 'read edit', ihc: 'read edit', images: 'read upload edit delete analyze', reports: 'read edit validate sign reopen print', collaboration: 'read edit', processing: 'read' }),
        make('3', 'Técnico', { ...common, templates: 'read', patients: 'read create edit', cases: 'read create edit', macroscopy: 'read edit', reception: 'read create edit', processing: 'read edit', images: 'read upload' }),
        make('4', 'Repartidor', { dashboard: 'read', help: 'read', logistics: 'read create edit deliver', dispatch: 'read dispatch', reports: 'read print' })
    ];
}
export function permissionForPath(path) {
    if (path === '/settings/connection-wizard') return ['system', 'edit'];
    if (path === '/cases/new') return ['cases', 'create'];
    if (/^\/cases\/[^/]+\/edit$/.test(path)) return ['cases', 'edit'];
    const module = path.match(/^\/cases\/[^/]+\/(macroscopy|microscopy|immunohistochemistry|images)$/)?.[1];
    if (module) return [module === 'immunohistochemistry' ? 'ihc' : module, 'read'];
    if (/^\/cases\/[^/]+$/.test(path)) return ['reports', 'read'];
    const root = path.split('/')[1];
    const map = { '': 'dashboard', dashboard: 'dashboard', patients: 'patients', reception: 'reception', logistics: 'logistics', 'my-deliveries': 'logistics', dispatch: 'dispatch', settings: path.includes('connection-wizard') ? 'system' : 'settings', users: 'users', roles: 'roles', templates: 'templates', tariffs: 'exams', doctors: 'doctors', 'tumor-board': 'collaboration', 'global-network': 'collaboration', 'case-map': 'collaboration', analytics: 'financials', performance: 'financials', insurers: 'insurers', centers: 'centers', organs: 'organs', equipment: 'equipment', 'audit-log': 'audit', 'usage-dashboard': 'audit', help: 'help' };
    return [map[root] || '__unknown', 'read'];
}
