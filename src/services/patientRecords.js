import { normalizePatientDocument } from './patientSearch.js';
export function ageFromBirthDate(date, today = new Date()) {
    if (!date) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) throw new Error('Fecha de nacimiento inválida.');
    const [year, month, day] = match.slice(1).map(Number);
    const born = new Date(year, month - 1, day);
    if (born.getFullYear() !== year || born.getMonth() !== month - 1 || born.getDate() !== day || born > today) throw new Error('Fecha de nacimiento inválida.');
    return today.getFullYear() - year - ((today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) ? 1 : 0);
}
export function patientFromRow(row) {
    return { ...row, name: row.full_name ?? row.name ?? '', cedula: row.identification_number ?? row.cedula ?? '', history: row.medical_history ?? row.history ?? '', age: row.birth_date ? ageFromBirthDate(row.birth_date) : row.age ?? '', phone: row.contact_phone ?? row.phone ?? '', arsName: row.ars_name ?? row.arsName ?? '', policyNumber: row.policy_number ?? row.policyNumber ?? '', createdAt: row.created_at ?? row.createdAt };
}
export function patientPayload(record) {
    const payload = {};
    const fields = { name: 'full_name', cedula: 'identification_number', history: 'medical_history', phone: 'contact_phone', arsName: 'ars_name', policyNumber: 'policy_number' };
    for (const [alias, column] of Object.entries(fields)) {
        if (Object.hasOwn(record, alias) || Object.hasOwn(record, column)) {
            const value = String(record[alias] ?? record[column] ?? '').trim();
            payload[column] = value || null;
        }
    }
    for (const key of ['birth_date', 'age', 'sex', 'city', 'region']) if (Object.hasOwn(record, key)) payload[key] = record[key] === '' ? null : record[key];
    if (payload.birth_date) payload.age = ageFromBirthDate(payload.birth_date);
    if (payload.age != null) {
        if (!/^\d+$/.test(String(payload.age)) || Number(payload.age) > 130) throw new Error('La edad debe ser un número entero entre 0 y 130.');
        payload.age = Number(payload.age);
    }
    if (Object.hasOwn(payload, 'full_name') && !payload.full_name) throw new Error('El nombre del paciente es obligatorio.');
    if (payload.age >= 18 && Object.hasOwn(payload, 'identification_number') && !payload.identification_number) throw new Error('La cédula o documento es obligatorio para mayores de 18 años.');
    return payload;
}
export function prepareReceptionPatient(form, existingPatients, editingId = null) {
    const payload = patientPayload(form);
    if (!payload.full_name) throw new Error('Escriba el nombre completo.');
    if (payload.age == null) throw new Error('Indique la edad del paciente.');
    if (!['F','M','Otro'].includes(payload.sex)) throw new Error('Seleccione el sexo.');
    const document = payload.identification_number || `M-${crypto.randomUUID()}`;
    if (existingPatients.some(p => p.id !== editingId && normalizePatientDocument(p.cedula || p.identification_number) === normalizePatientDocument(document))) throw new Error('Ya existe un paciente con ese documento. Selecciónelo antes de registrar otro.');
    return patientFromRow({ ...payload, identification_number: document });
}
export function patientSaveError(error) {
    if (error.code === '23505') return 'Ya existe un paciente con esa cédula o documento. No se guardaron los cambios.';
    return error.message || 'No se pudo guardar el paciente. Sus datos se conservan para volver a intentarlo.';
}
