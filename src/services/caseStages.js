// Supabase owns current_stage; older local cases only have stage.
export function caseStage(record) {
    return record.current_stage || record.stage || 'recepcion';
}

// The existing board groups the detailed laboratory stages into five columns.
export function caseMapStage(record) {
    const stage = caseStage(record).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const columns = {
        recepcion: 'histologia', reception: 'histologia',
        macroscopia: 'histologia', macroscopy: 'histologia',
        procesamiento: 'histologia', processing: 'histologia',
        microtomia: 'histologia', microtomy: 'histologia', histologia: 'histologia',
        escaneo: 'microscopia', microscopy: 'microscopia', microscopia: 'microscopia',
        tincion: 'estudios_especiales', staining: 'estudios_especiales', ihc: 'estudios_especiales',
        'estudio especial': 'estudios_especiales', estudios_especiales: 'estudios_especiales',
        diagnostico: 'por_firmar', diagnosis: 'por_firmar',
        validacion: 'por_firmar', validation: 'por_firmar', 'por firmar': 'por_firmar', por_firmar: 'por_firmar',
        finalizado: 'finalizado'
    };
    return columns[stage] || stage;
}
