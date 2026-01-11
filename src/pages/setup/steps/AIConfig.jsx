import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useSetup } from '../../../context/SetupContext';
import { testConnection } from '../../../services/aiService';

const AIConfig = () => {
    const navigate = useNavigate();
    const { config, updateConfig } = useSetup();
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const handleChange = (field, value) => {
        updateConfig('ai', field, value);
    };

    const toggleAI = () => {
        updateConfig('ai', 'enabled', !config.ai.enabled);
    };

    const testAIConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await testConnection({
                provider: config.ai.provider,
                model: config.ai.model,
                apiKey: config.ai.apiKey
            });

            if (result.success) {
                setTestResult({ success: true, message: 'Conexión establecida correctamente.' });
            } else {
                setTestResult({ success: false, message: `Error: ${result.message || result.error || 'Fallo desconocido'}` });
            }
        } catch (error) {
            setTestResult({ success: false, message: `Error: ${error.message}` });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Inteligencia Artificial</h2>
                        <p className="text-gray-600 mt-1">Configure el asistente de diagnóstico y análisis de imágenes.</p>
                    </div>
                    <div className={`p-2 rounded-full ${config.ai.enabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Cpu size={24} />
                    </div>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-gray-900">Habilitar Asistente IA</h4>
                        <p className="text-sm text-gray-500">Permite análisis de casos, sugerencias de diagnóstico y chat.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={config.ai.enabled} onChange={toggleAI} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>

                {config.ai.enabled && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                <select
                                    value={config.ai.provider}
                                    onChange={(e) => {
                                        const newProvider = e.target.value;
                                        // Auto-select a default model when switching providers
                                        let defaultModel = '';
                                        if (newProvider === 'google') defaultModel = 'gemini-1.5-pro';
                                        else if (newProvider === 'openai') defaultModel = 'gpt-4';
                                        else if (newProvider === 'anthropic') defaultModel = 'claude-3-opus';

                                        updateConfig('ai', 'provider', newProvider);
                                        if (defaultModel) updateConfig('ai', 'model', defaultModel);
                                    }}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 py-2 px-3 border"
                                >
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="google">Google Gemini</option>
                                    <option value="local">Local LLM (Ollama)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                                {config.ai.provider === 'google' ? (
                                    <select
                                        value={config.ai.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 py-2 px-3 border"
                                    >
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recomendado)</option>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option>
                                        <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                        <option value="gemini-ultra">Gemini Ultra</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={config.ai.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 py-2 px-3 border"
                                        placeholder={config.ai.provider === 'openai' ? "gpt-4-turbo" : "claude-3-opus"}
                                    />
                                )}
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <Input
                                    label="API Key"
                                    type="password"
                                    value={config.ai.apiKey}
                                    onChange={(e) => handleChange('apiKey', e.target.value)}
                                    placeholder="sk-..."
                                    icon={Key}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Su clave se almacena encriptada localmente y nunca se comparte con terceros.
                                </p>
                            </div>
                        </div>

                        {testResult && (
                            <div className={`p-4 rounded-lg flex items-center gap-3 ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                {testResult.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <span className="font-medium">{testResult.message}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between items-center">
                <Button onClick={() => navigate('/setup/database')} variant="secondary">
                    <ArrowLeft size={18} className="mr-2" /> Atrás
                </Button>

                <div className="flex gap-3">
                    {config.ai.enabled && (
                        <Button onClick={testAIConnection} variant="secondary" isLoading={testing}>
                            Probar Conexión
                        </Button>
                    )}
                    <Button onClick={() => navigate('/setup/backups')}>
                        Siguiente <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AIConfig;
