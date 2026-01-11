import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from '../services/DataContext';
import { useAIConfig } from '../ai/AIConfigContext';

const SetupContext = createContext();

export const useSetup = () => useContext(SetupContext);

export const SetupProvider = ({ children }) => {
    const { saveConnectionConfig, updateSettings } = useData();
    const { updateConfig: updateAIConfig } = useAIConfig();

    // Load initial state from localStorage or defaults
    const [config, setConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('setup_wizard_state');
            return saved ? JSON.parse(saved) : {
                mode: 'DEMO', // DEMO, PROD
                database: {
                    type: 'postgresql',
                    host: 'localhost',
                    port: '5432',
                    user: 'postgres',
                    password: '',
                    database: 'pathology_lab'
                },
                storage: {
                    type: 'minio', // minio, s3, local
                    endpoint: 'http://localhost:9000',
                    accessKey: '',
                    secretKey: '',
                    bucket: 'pathology-images',
                    localPath: ''
                },
                ai: {
                    enabled: true,
                    provider: 'openai',
                    apiKey: '',
                    model: 'gpt-4'
                },
                backups: {
                    enabled: true,
                    frequency: 'daily',
                    retention: 30,
                    autoRestore: false
                }
            };
        } catch (e) {
            console.error("Failed to parse setup wizard state, resetting.", e);
            return {
                mode: 'DEMO',
                database: { type: 'postgresql', host: 'localhost', port: '5432', user: 'postgres', password: '', database: 'pathology_lab' },
                storage: { type: 'minio', endpoint: 'http://localhost:9000', accessKey: '', secretKey: '', bucket: 'pathology-images', localPath: '' },
                ai: { enabled: true, provider: 'openai', apiKey: '', model: 'gpt-4' },
                backups: { enabled: true, frequency: 'daily', retention: 30, autoRestore: false }
            };
        }
    });

    // Persist state on change
    useEffect(() => {
        localStorage.setItem('setup_wizard_state', JSON.stringify(config));
    }, [config]);

    const updateConfig = (section, key, value) => {
        setConfig(prev => {
            if (section === 'root') {
                return { ...prev, [key]: value };
            }
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [key]: value
                }
            };
        });
    };

    const finishSetup = async () => {
        try {
            // 1. Save Connection Config (Database & Storage)
            // We map PROD to STANDARD complexity by default, DEMO is ignored by DataContext but we save it anyway
            await saveConnectionConfig({
                operationalMode: config.mode === 'PROD' ? 'STANDARD' : 'SIMPLE',
                database: config.database,
                storage: config.storage,
                search: { type: 'opensearch', node: 'http://localhost:9200', index: 'cases' }
            });

            // 2. Save AI Config
            if (updateAIConfig) {
                await updateAIConfig({
                    global: { ai_enabled: config.ai.enabled },
                    provider: config.ai.provider,
                    apiKey: config.ai.apiKey,
                    model: config.ai.model
                });
            }

            // 3. Save System Mode & Backups (via Settings)
            await updateSettings({
                // enableLabWorkflow: true, // Don't overwrite this if not needed
                backupConfig: config.backups
            });

            // 4. Set Mode Flag
            localStorage.setItem('app_system_mode', config.mode);

            // 5. Mark Setup as Completed
            localStorage.setItem('setupCompleted', 'true');
            localStorage.removeItem('setup_wizard_state'); // Clear temp state

            return true;
        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    };

    return (
        <SetupContext.Provider value={{ config, updateConfig, finishSetup }}>
            {children}
        </SetupContext.Provider>
    );
};
