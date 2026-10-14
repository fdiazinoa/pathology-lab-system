const LAB_FIELDS = { labName: 'name', address: 'address', phone: 'phone', email: 'email', logo_url: 'logo_url' };
const JSON_FIELDS = new Set(['aiEnabled', 'enableLabWorkflow', 'requireStepQR', 'resultTemplates', 'resultTemplateExamGroups']);

// Merge JSON settings: saving a catalog must not erase the lab identity or other options.
export function buildLabInfoPayload(existing, changes) {
    const settings = { ...(existing?.settings || {}) };
    const payload = {};
    for (const [key, value] of Object.entries(changes)) {
        if (Object.hasOwn(LAB_FIELDS, key)) payload[LAB_FIELDS[key]] = value;
        else if (JSON_FIELDS.has(key)) settings[key] = value;
    }
    if (!existing && !payload.name) payload.name = 'Laboratorio de Patología';
    return { ...payload, settings };
}

export function labInfoToSettings(row) {
    return {
        labName: row.name, address: row.address, phone: row.phone,
        email: row.email, logo_url: row.logo_url, ...row.settings
    };
}
