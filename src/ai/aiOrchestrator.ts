import {
    DiagnosticAssistanceSchema,
    TriageSchema,
    QuantitativeMetricsSchema,
    QualityControlSchema,
    ClinicalReportSchema,
    DiagnosticAssistance,
    Triage,
    QuantitativeMetrics,
    QualityControl,
    ClinicalReport
} from './schemas';

// Import existing AI services (assuming they are available via a JS/TS bridge or converted)
// For this implementation, we will assume the existence of these functions in aiService
import * as aiService from '../services/aiService';
import * as aiTelemetry from './aiTelemetry';
import { getAIConfigSync } from './AIConfigContext';

export interface AIOrchestratorInput {
    caseId: string;
    images: any[];
    organ: string;
    textData?: string;
    apiKey?: string;
    options?: {
        stopOnLowQuality?: boolean;
    };
}

export interface AIAnalysisResult {
    qc: QualityControl | null;
    triage: Triage | null;
    differentials: DiagnosticAssistance | null;
    metrics: QuantitativeMetrics | null;
    report_structure: ClinicalReport | null;
    errors: { module: string; reason: string }[];
}

/**
 * Generic function to execute an AI module with automatic retries and prompt reinforcement.
 */
async function executeWithRetry<T>(
    moduleName: string,
    executionFn: (reinforcement?: string) => Promise<any>,
    schema: any, // ZodSchema<T>
    maxRetries?: number
): Promise<T | null> {
    const config = getAIConfigSync();
    const actualMaxRetries = maxRetries !== undefined ? maxRetries : config.global.max_retries;
    const startTime = Date.now();
    let fallbackUsed = false;

    for (let attempt = 0; attempt <= actualMaxRetries; attempt++) {
        let reinforcement = "";
        if (attempt === 1) {
            reinforcement = "\n\nIMPORTANTE: Devuelve únicamente JSON válido. No incluyas texto adicional ni bloques de código markdown.";
        } else if (attempt === 2) {
            reinforcement = `\n\nCRÍTICO: Debes cumplir estrictamente con el esquema JSON esperado. Cualquier desviación invalidará el resultado. No incluyas explicaciones, solo el objeto JSON.`;
        }

        try {
            const rawResult = await executionFn(reinforcement);
            const validation = schema.safeParse(rawResult);

            if (validation.success) {
                const executionTime = Date.now() - startTime;

                // Log Execution
                aiTelemetry.logAIExecution({
                    module_name: moduleName,
                    timestamp: new Date().toISOString(),
                    execution_time_ms: executionTime,
                    retries_count: attempt,
                    schema_valid: true,
                    fallback_used: false
                });

                // Log Result Metadata (if applicable)
                aiTelemetry.logAIResult({
                    module_name: moduleName,
                    confidence_level: (validation.data as any).overall_confidence || (validation.data as any).suspicion_level,
                    uncertainty_detected: (validation.data as any).uncertainty_detected,
                    result_available: true
                });

                if (attempt > 0) {
                    console.log(`[AI Orchestrator] ${moduleName} recuperado exitosamente en intento ${attempt + 1}.`);
                }
                return validation.data;
            }

            console.warn(`[AI Orchestrator] ${moduleName} falló validación (intento ${attempt + 1}):`, validation.error);
        } catch (err: any) {
            console.error(`[AI Orchestrator] ${moduleName} falló ejecución (intento ${attempt + 1}):`, err.message);
        }
    }

    // If we reach here, all retries failed
    aiTelemetry.logAIExecution({
        module_name: moduleName,
        timestamp: new Date().toISOString(),
        execution_time_ms: Date.now() - startTime,
        retries_count: actualMaxRetries,
        schema_valid: false,
        fallback_used: true
    });

    aiTelemetry.logAIResult({
        module_name: moduleName,
        result_available: false
    });

    return null;
}

/**
 * AI Orchestrator
 * Coordinates the execution of multiple AI modules with Zod validation and automatic retries.
 */
export const runAIAnalysis = async (input: AIOrchestratorInput): Promise<AIAnalysisResult> => {
    const config = getAIConfigSync();

    const result: AIAnalysisResult = {
        qc: null,
        triage: null,
        differentials: null,
        metrics: null,
        report_structure: null,
        errors: []
    };

    if (!config.global.ai_enabled) {
        result.errors.push({ module: 'System', reason: 'IA desactivada globalmente en la configuración.' });
        return result;
    }

    const { images, organ, textData, apiKey, options } = input;

    // 1. Quality Control (QC)
    if (config.modules.qc_enabled) {
        result.qc = await executeWithRetry<QualityControl>(
            'QC',
            (reinforcement) => aiService.analyzeQualityControl(images, apiKey, reinforcement),
            QualityControlSchema
        );
        if (!result.qc) {
            result.errors.push({ module: 'QC', reason: 'Fallo definitivo tras reintentos o error de ejecución.' });
        } else if ((options?.stopOnLowQuality || !config.rules.continue_if_low_qc) && result.qc.quality_level === 'baja') {
            result.errors.push({ module: 'QC', reason: 'Calidad de imagen insuficiente para continuar el análisis automático.' });
            return result;
        }
    }

    // 2. Triage / Pre-classification
    if (config.modules.triage_enabled) {
        result.triage = await executeWithRetry<Triage>(
            'Triage',
            (reinforcement) => aiService.preClassifyCase(images, apiKey, reinforcement),
            TriageSchema
        );
        if (!result.triage) {
            result.errors.push({ module: 'Triage', reason: 'Fallo definitivo tras reintentos o error de ejecución.' });
        }
    }

    // 3. Diagnostic Assistance (Differentials)
    if (config.modules.differentials_enabled) {
        result.differentials = await executeWithRetry<DiagnosticAssistance>(
            'Diagnostics',
            (reinforcement) => aiService.analyzeCase(textData || '', images, organ, apiKey, result.triage as any, reinforcement),
            DiagnosticAssistanceSchema
        );
        if (!result.differentials) {
            result.errors.push({ module: 'Diagnostics', reason: 'Fallo definitivo tras reintentos o error de ejecución.' });
        }
    }

    // 4. Quantitative Metrics
    if (config.modules.metrics_enabled) {
        // Rule: run_metrics_only_if_high_suspicion
        const shouldRunMetrics = !config.rules.run_metrics_only_if_high_suspicion ||
            (result.triage?.suspicion_level === 'alta') ||
            (result.differentials?.overall_confidence === 'alta');

        if (shouldRunMetrics) {
            result.metrics = await executeWithRetry<QuantitativeMetrics>(
                'Metrics',
                (reinforcement) => aiService.analyzeQuantitativeMetrics(images, 'mitosis', apiKey, reinforcement),
                QuantitativeMetricsSchema
            );
            if (!result.metrics) {
                result.errors.push({ module: 'Metrics', reason: 'Fallo definitivo tras reintentos o error de ejecución.' });
            }
        }
    }

    // 5. Report Structuring
    if (config.modules.report_structure_enabled) {
        result.report_structure = await executeWithRetry<ClinicalReport>(
            'Report',
            (reinforcement) => aiService.generateStructuredReport(textData || '', apiKey, reinforcement),
            ClinicalReportSchema
        );
        if (!result.report_structure) {
            result.errors.push({ module: 'Report', reason: 'Fallo definitivo tras reintentos o error de ejecución.' });
        }
    }

    return result;
};
