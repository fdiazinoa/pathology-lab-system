/**
 * Consistency Service
 * Deterministic rules to detect internal inconsistencies in pathology reports.
 */

export const checkReportConsistency = (caseData) => {
    const alerts = [];
    const { organ, type, macroscopy, microscopy, diagnosis } = caseData;

    // 1. Organ Consistency
    if (organ) {
        const organLower = organ.toLowerCase();
        const sections = [
            { name: 'Macroscopía', content: macroscopy },
            { name: 'Microscopía', content: microscopy },
            { name: 'Diagnóstico', content: diagnosis }
        ];

        sections.forEach(section => {
            if (section.content) {
                const contentLower = section.content.toLowerCase();
                // Basic check: if another major organ is mentioned but the primary organ is not
                const otherOrgans = ['mama', 'piel', 'próstata', 'hígado', 'pulmón', 'colon', 'estómago', 'tiroides']
                    .filter(o => o !== organLower);

                otherOrgans.forEach(other => {
                    if (contentLower.includes(other) && !contentLower.includes(organLower)) {
                        alerts.push({
                            section: section.name,
                            message: `Se menciona "${other}" en ${section.name}, pero el órgano del caso es "${organ}".`,
                            severity: 'medium'
                        });
                    }
                });
            }
        });
    }

    // 2. Sample Type vs Diagnosis Compatibility
    if (type && diagnosis) {
        const typeLower = type.toLowerCase();
        const diagLower = diagnosis.toLowerCase();

        if (typeLower.includes('citología') && (diagLower.includes('biopsia') || diagLower.includes('pieza quirúrgica'))) {
            alerts.push({
                section: 'Diagnóstico',
                message: 'El diagnóstico menciona "biopsia" o "pieza quirúrgica" en un estudio de citología.',
                severity: 'high'
            });
        }
    }

    // 3. Contradictory Terms
    const contradictions = [
        { terms: ['sin atipia', 'alto grado'], message: 'Uso contradictorio de "sin atipia" y "alto grado".' },
        { terms: ['benigno', 'maligno'], message: 'Se mencionan términos de benignidad y malignidad en la misma sección.' },
        { terms: ['negativo', 'positivo'], message: 'Posible confusión entre resultados negativos y positivos.' },
        { terms: ['insuficiente', 'diagnóstico'], message: 'Se emite un diagnóstico pero se menciona que la muestra es insuficiente.' }
    ];

    [
        { name: 'Microscopía', content: microscopy },
        { name: 'Diagnóstico', content: diagnosis }
    ].forEach(section => {
        if (section.content) {
            const contentLower = section.content.toLowerCase();
            contradictions.forEach(rule => {
                if (rule.terms.every(term => contentLower.includes(term))) {
                    alerts.push({
                        section: section.name,
                        message: rule.message,
                        severity: 'medium'
                    });
                }
            });
        }
    });

    // 4. Sentiment Discrepancy (Basic)
    if (microscopy && diagnosis) {
        const microLower = microscopy.toLowerCase();
        const diagLower = diagnosis.toLowerCase();

        const benignTerms = ['normal', 'sin alteraciones', 'benigno', 'inflamatorio crónico'];
        const malignantTerms = ['carcinoma', 'adenocarcinoma', 'maligno', 'metástasis', 'neoplasia infiltrante'];

        const microBenign = benignTerms.some(t => microLower.includes(t));
        const diagMalignant = malignantTerms.some(t => diagLower.includes(t));

        if (microBenign && diagMalignant) {
            alerts.push({
                section: 'Global',
                message: 'La descripción microscópica sugiere hallazgos benignos, pero el diagnóstico final indica malignidad.',
                severity: 'high'
            });
        }
    }

    return {
        consistent: alerts.length === 0,
        alerts
    };
};
