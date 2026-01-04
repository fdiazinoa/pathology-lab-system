import {
    DiagnosticAssistance,
    Triage,
    QuantitativeMetrics,
    QualityControl,
    ClinicalReport
} from './schemas';
import { AIAnalysisResult } from './aiOrchestrator';

export interface UIFormattedResult {
    title: string;
    content: any;
    note?: string;
    type: 'differentials' | 'triage' | 'metrics' | 'qc' | 'report';
}

/**
 * Formats Diagnostic Assistance results for the UI.
 */
export const formatDifferentials = (data: DiagnosticAssistance): UIFormattedResult => {
    return {
        title: "Diagnósticos a considerar (asistencia IA)",
        type: 'differentials',
        content: data.differential_diagnoses.map(d => ({
            label: d.name,
            confidence: d.confidence.charAt(0).toUpperCase() + d.confidence.slice(1)
        })),
        note: "Sugerencia asistida por IA. Requiere validación del patólogo."
    };
};

/**
 * Formats Triage results for the UI.
 */
export const formatTriage = (data: Triage): UIFormattedResult => {
    const suspicionMap = {
        baja: "Baja",
        moderada: "Moderada",
        alta: "Alta"
    };
    const typeMap = {
        sospecha_neoplasica: "Sospecha Neoplásica",
        sospecha_no_neoplasica: "Sospecha No Neoplásica",
        indeterminado: "Indeterminado"
    };

    return {
        title: "Evaluación de Triaje (Orientativo)",
        type: 'triage',
        content: {
            suspicion: suspicionMap[data.suspicion_level],
            type: typeMap[data.process_type]
        },
        note: "Evaluación preliminar orientativa. No sustituye el diagnóstico histopatológico."
    };
};

/**
 * Formats Quantitative Metrics for the UI.
 */
export const formatMetrics = (data: QuantitativeMetrics): UIFormattedResult => {
    const formattedMetrics: any = {};
    if (data.metrics.mitotic_figures_per_10_hpf !== undefined) {
        formattedMetrics.mitosis = `~${data.metrics.mitotic_figures_per_10_hpf}`;
    }
    if (data.metrics.ki67_index_percent !== undefined) {
        formattedMetrics.ki67 = `~${data.metrics.ki67_index_percent}%`;
    }
    if (data.metrics.necrosis_percent !== undefined) {
        formattedMetrics.necrosis = `~${data.metrics.necrosis_percent}%`;
    }

    return {
        title: "Métricas Cuantitativas (Estimadas)",
        type: 'metrics',
        content: formattedMetrics,
        note: "Estimación asistida por IA. Confirmación manual requerida."
    };
};

/**
 * Formats Quality Control results for the UI.
 */
export const formatQC = (data: QualityControl): UIFormattedResult => {
    const levelMap = {
        alta: "Alta",
        moderada: "Moderada",
        baja: "Baja"
    };

    return {
        title: "Control de Calidad del Slide",
        type: 'qc',
        content: {
            quality: levelMap[data.quality_level],
            artifacts: data.artifacts_detected.length > 0 ? data.artifacts_detected : ["Ninguno detectado"],
            recommendation: data.review_recommended ? "Se recomienda revisión técnica" : "Calidad aceptable"
        }
    };
};

/**
 * Formats Structured Report for the UI.
 */
export const formatReportStructure = (data: ClinicalReport): UIFormattedResult => {
    return {
        title: "Borrador estructurado (asistencia IA)",
        type: 'report',
        content: {
            clinical: data.clinical_data || "No proporcionado",
            macroscopy: data.macroscopy || "No proporcionado",
            microscopy: data.microscopy || "No proporcionado",
            suggestions: data.diagnostic_suggestions || []
        },
        note: "Este borrador requiere revisión obligatoria y validación por el patólogo responsable."
    };
};

/**
 * Formats the full analysis result from the Orchestrator for the UI.
 * Returns an array of formatted sections, excluding null results.
 */
export const formatFullAnalysis = (result: AIAnalysisResult): UIFormattedResult[] => {
    const sections: UIFormattedResult[] = [];

    if (result.qc) sections.push(formatQC(result.qc));
    if (result.triage) sections.push(formatTriage(result.triage));
    if (result.differentials) sections.push(formatDifferentials(result.differentials));
    if (result.metrics) sections.push(formatMetrics(result.metrics));
    if (result.report_structure) sections.push(formatReportStructure(result.report_structure));

    return sections;
};

/**
 * Returns a fallback message when AI is unavailable.
 */
export const getFallbackMessage = (): string => {
    return "Análisis asistido por IA no disponible en este momento. Por favor, proceda con la revisión manual.";
};
