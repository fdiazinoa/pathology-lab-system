const REPORT_FIELDS = ['examId', 'doctorId', 'clinicalData', 'macroscopy', 'microscopy', 'diagnosis', 'ihc', 'resultDetails', 'validatedAt', 'validatedBy', 'releasedAt', 'releasedBy', 'digitalSignature', 'auditLogs'];

export function caseReportMetadata(record, existingMetadata = {}) {
    const report = { ...(existingMetadata.report || {}), ...(record.metadata?.report || {}) };
    for (const key of REPORT_FIELDS) if (record[key] !== undefined) report[key] = record[key];
    return { ...existingMetadata, ...(record.metadata || record.tracking || {}), report };
}

export function caseWithReport(record) {
    return { ...record, ...(record.metadata?.report || {}),
        patientId: record.patient_id || record.patientId,
        diagnosis: record.diagnosis ?? record.metadata?.report?.diagnosis ?? '',
        patientName: record.patients?.full_name || record.patientName
    };
}
