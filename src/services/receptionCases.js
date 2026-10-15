const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const receptionDate = record => record.receivedAt || record.created_at || record.createdAt;
export function isPendingReception(record) {
    const reception = record.source === 'reception' || record.receivedAt || record.sampleId || record.auditLogs?.some(log => log.action === 'Recepción de Muestra');
    return Boolean(reception && ['Borrador', 'En Proceso'].includes(record.status) && record.receptionStatus !== 'in_progress' &&
        ![record.macroscopy, record.microscopy, record.diagnosis, record.ihc].some(value => value?.trim()));
}
export function pendingReceptions(cases = [], patientId) {
    return cases.filter(record => isPendingReception(record) && (!patientId || record.patientId === patientId))
        .sort((a, b) => (Date.parse(receptionDate(b)) || 0) - (Date.parse(receptionDate(a)) || 0) || String(b.id).localeCompare(String(a.id)));
}
export function searchReceptions(records, query, patients = [], doctors = []) {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    const patientById = new Map(patients.map(patient => [patient.id, patient]));
    const doctorById = new Map(doctors.map(doctor => [doctor.id, doctor]));
    return records.filter(record => {
        const patient = patientById.get(record.patientId);
        const doctor = doctorById.get(record.doctorId);
        const text = normalize([record.case_number, record.sampleId, receptionDate(record), record.type, record.originCenter,
            patient?.name, patient?.cedula, record.patientName, doctor?.name].filter(Boolean).join(' '));
        return terms.every(term => text.includes(term));
    });
}
export function receptionExamId(record, exams = []) {
    if (record.examId && exams.some(exam => exam.id === record.examId)) return record.examId;
    const matches = exams.filter(exam => normalize(exam.name).trim() === normalize(record.type).trim());
    return matches.length === 1 ? matches[0].id : '';
}
