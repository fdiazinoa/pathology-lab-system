export const normalizePatientText = (value) => String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const normalizePatientDocument = (value) => normalizePatientText(value).replace(/[\s-]/g, '');

export const matchesPatientSearch = (patient, query) => {
    const text = normalizePatientText(query);
    if (!text) return true;
    const name = normalizePatientText(patient.name || patient.full_name);
    const document = normalizePatientDocument(patient.cedula || patient.identification_number);
    return text.split(/\s+/).every(word => name.includes(word))
        || (document !== '' && document.includes(normalizePatientDocument(text)))
        || normalizePatientText(patient.id).includes(text);
};
