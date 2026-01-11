import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AIConfig {
    global: {
        ai_enabled: boolean;
        max_retries: number;
        fallback_enabled: boolean;
    };
    provider: string;
    apiKey: string;
    model: string;
    modules: {
        qc_enabled: boolean;
        triage_enabled: boolean;
        differentials_enabled: boolean;
        metrics_enabled: boolean;
        report_structure_enabled: boolean;
    };
    rules: {
        continue_if_low_qc: boolean;
        run_metrics_only_if_high_suspicion: boolean;
        show_ai_results_in_ui: boolean;
    };
}

const DEFAULT_CONFIG: AIConfig = {
    global: {
        ai_enabled: true,
        max_retries: 2,
        fallback_enabled: true,
    },
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4',
    modules: {
        qc_enabled: true,
        triage_enabled: true,
        differentials_enabled: true,
        metrics_enabled: true,
        report_structure_enabled: true,
    },
    rules: {
        continue_if_low_qc: false,
        run_metrics_only_if_high_suspicion: true,
        show_ai_results_in_ui: true,
    },
};

const AI_CONFIG_KEY = 'app_ai_config';

interface AIConfigContextType {
    config: AIConfig;
    updateConfig: (newConfig: Partial<AIConfig>) => void;
    resetConfig: () => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AIConfig>(() => {
        try {
            const saved = localStorage.getItem(AI_CONFIG_KEY);
            if (!saved) return DEFAULT_CONFIG;

            const parsed = JSON.parse(saved);
            // Deep merge to ensure all nested properties exist
            return {
                ...DEFAULT_CONFIG,
                ...parsed,
                global: { ...DEFAULT_CONFIG.global, ...(parsed.global || {}) },
                modules: { ...DEFAULT_CONFIG.modules, ...(parsed.modules || {}) },
                rules: { ...DEFAULT_CONFIG.rules, ...(parsed.rules || {}) },
            };
        } catch (e) {
            console.error("Failed to parse AI config from localStorage, resetting to default.", e);
            return DEFAULT_CONFIG;
        }
    });

    useEffect(() => {
        localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    }, [config]);

    const updateConfig = (newConfig: Partial<AIConfig>) => {
        setConfig(prev => ({
            ...prev,
            ...newConfig,
            global: { ...prev.global, ...(newConfig.global || {}) },
            modules: { ...prev.modules, ...(newConfig.modules || {}) },
            rules: { ...prev.rules, ...(newConfig.rules || {}) },
        }));
    };

    const resetConfig = () => {
        setConfig(DEFAULT_CONFIG);
    };

    return (
        <AIConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
            {children}
        </AIConfigContext.Provider>
    );
};

export const useAIConfig = () => {
    const context = useContext(AIConfigContext);
    if (context === undefined) {
        throw new Error('useAIConfig must be used within an AIConfigProvider');
    }
    return context;
};

/**
 * Utility for non-React components (like the orchestrator) to get the current config.
 */
export const getAIConfigSync = (): AIConfig => {
    try {
        const saved = localStorage.getItem(AI_CONFIG_KEY);
        if (!saved) return DEFAULT_CONFIG;

        const parsed = JSON.parse(saved);
        return {
            ...DEFAULT_CONFIG,
            ...parsed,
            global: { ...DEFAULT_CONFIG.global, ...(parsed.global || {}) },
            modules: { ...DEFAULT_CONFIG.modules, ...(parsed.modules || {}) },
            rules: { ...DEFAULT_CONFIG.rules, ...(parsed.rules || {}) },
        };
    } catch (e) {
        console.error("Failed to parse AI config sync, returning default.", e);
        return DEFAULT_CONFIG;
    }
};
