/**
 * AI Telemetry Service
 * Handles structured logging and metrics for AI module usage and performance.
 */

export interface AIExecutionLog {
    module_name: string;
    timestamp: string;
    execution_time_ms: number;
    retries_count: number;
    schema_valid: boolean;
    fallback_used: boolean;
    error?: string;
}

export interface AIResultLog {
    module_name: string;
    confidence_level?: string;
    uncertainty_detected?: boolean;
    result_available: boolean;
}

export interface AIInteractionLog {
    module_name: string;
    action: 'viewed' | 'accepted' | 'modified' | 'ignored';
    time_to_action_ms: number;
}

const TELEMETRY_KEY = 'ai_telemetry';

/**
 * Saves a log entry to the telemetry store.
 * In Demo mode, it uses localStorage. In Prod, it could send to an API.
 */
const saveLog = (type: string, data: any) => {
    try {
        // Check if telemetry is enabled in settings
        const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
        if (settings.aiTelemetryEnabled === false) return;

        const logEntry = {
            type,
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            isProduction: settings.isProductionMode || false
        };

        // Demo Mode Persistence (localStorage)
        const existingLogs = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || '[]');
        existingLogs.push(logEntry);

        // Keep only last 100 logs in localStorage to avoid bloat
        if (existingLogs.length > 100) {
            existingLogs.shift();
        }

        localStorage.setItem(TELEMETRY_KEY, JSON.stringify(existingLogs));

        // Production Mode: Placeholder for API call
        if (settings.isProductionMode) {
            // fetch('/api/telemetry/ai', { method: 'POST', body: JSON.stringify(logEntry) }).catch(() => {});
            console.log('[AI Telemetry] Prod Log:', logEntry);
        }
    } catch (err) {
        // Fail silently to not block UI
        console.error('[AI Telemetry] Error saving log:', err);
    }
};

export const logAIExecution = (data: AIExecutionLog) => {
    saveLog('execution', data);
};

export const logAIResult = (data: AIResultLog) => {
    saveLog('result', data);
};

export const logAIInteraction = (data: AIInteractionLog) => {
    saveLog('interaction', data);
};

/**
 * Retrieves all logs from localStorage (Demo mode only).
 */
export const getTelemetryLogs = (): any[] => {
    return JSON.parse(localStorage.getItem(TELEMETRY_KEY) || '[]');
};

/**
 * Clears telemetry logs.
 */
export const clearTelemetryLogs = () => {
    localStorage.removeItem(TELEMETRY_KEY);
};
