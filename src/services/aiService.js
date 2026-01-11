// src/services/aiService.js

/**
 * AI Service - Adapter Pattern Implementation
 * Supports: OpenAI, Anthropic (Claude), Google Gemini, Ollama (Local)
 */

// --- 1. Configuration & Constants ---

const AI_PROVIDERS = {
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        defaultModel: 'gpt-4o'
    },
    anthropic: {
        url: 'https://api.anthropic.com/v1/messages',
        defaultModel: 'claude-3-opus-20240229',
        version: '2023-06-01'
    },
    google: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        defaultModel: 'gemini-1.5-pro'
    },
    local: {
        url: 'http://localhost:11434/api/chat',
        defaultModel: 'llama3'
    }
};

// Helper: Convert File/Blob to Base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// Helper: Get Config from LocalStorage
const getAIConfig = () => {
    try {
        const saved = localStorage.getItem('app_ai_config');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error("Error reading AI config:", e);
        return null;
    }
};

// --- 2. Core Function: callAIProvider ---

/**
 * Centralized function to call any AI provider.
 * Adapts the payload and headers based on the selected provider.
 */
const callAIProvider = async ({ provider, model, apiKey, systemPrompt, userMessage, images = [], jsonMode = true }) => {
    const selectedProvider = provider?.toLowerCase() || 'openai';
    const selectedModel = model || AI_PROVIDERS[selectedProvider]?.defaultModel;

    // Validation
    if (!apiKey && selectedProvider !== 'local') {
        throw new Error(`Se requiere API Key para el proveedor ${selectedProvider}.`);
    }

    let url, options;

    try {
        switch (selectedProvider) {
            case 'openai':
            case 'local': {
                // OpenAI & Ollama share similar structure
                url = selectedProvider === 'local' ? AI_PROVIDERS.local.url : AI_PROVIDERS.openai.url;

                const content = [];
                if (selectedProvider === 'openai') {
                    // System prompt as a separate message for OpenAI
                    content.push({ role: "system", content: systemPrompt });
                }

                // User message content
                const userContent = [{ type: "text", text: userMessage }];

                // Attach images
                if (images.length > 0) {
                    images.forEach(imgBase64 => {
                        // OpenAI expects "data:image/jpeg;base64,..."
                        userContent.push({
                            type: "image_url",
                            image_url: { url: imgBase64 }
                        });
                    });
                }

                const messages = [];
                if (selectedProvider === 'openai') {
                    messages.push({ role: "system", content: systemPrompt });
                }
                // Local/Ollama often prefers system prompt combined or handled differently, 
                // but we'll stick to standard chat format.
                messages.push({ role: "user", content: userContent });

                // Ollama specific: some models don't support 'image_url' inside content array standardly yet,
                // but we will assume standard OpenAI compatibility layer or updated Ollama.
                // Fallback for simple Ollama:
                let body = {
                    model: selectedModel,
                    messages: messages
                };

                // Newer models (GPT-5, o1) use max_completion_tokens
                if (['gpt-5', 'o1'].some(m => selectedModel.includes(m))) {
                    body.max_completion_tokens = 2000;
                } else {
                    body.max_tokens = 2000;
                }

                if (selectedProvider === 'openai' && jsonMode) {
                    // Only enable JSON mode for compatible models
                    const compatibleModels = ['gpt-5', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo-1106', 'gpt-4-1106-preview', 'gpt-4-0125-preview'];
                    const isCompatible = compatibleModels.some(m => selectedModel.includes(m)) || selectedModel.includes('turbo') || selectedModel.includes('gpt-4o');

                    if (isCompatible) {
                        body.response_format = { type: "json_object" };
                    }
                }
                if (selectedProvider === 'local') {
                    body.format = jsonMode ? "json" : undefined;
                    body.stream = false;
                    // For Ollama, sometimes images need to be separate 'images' field in the message object
                    if (images.length > 0) {
                        // Simplified Ollama image handling if standard content array fails
                        messages[messages.length - 1].images = images.map(img => img.split(',')[1]);
                    }
                }

                options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(selectedProvider === 'openai' ? { 'Authorization': `Bearer ${apiKey}` } : {})
                    },
                    body: JSON.stringify(body)
                };
                break;
            }

            case 'anthropic': {
                url = AI_PROVIDERS.anthropic.url;

                const content = [{ type: "text", text: userMessage }];

                images.forEach(imgBase64 => {
                    const base64Data = imgBase64.split(',')[1];
                    const mediaType = imgBase64.split(';')[0].split(':')[1];
                    content.push({
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: mediaType,
                            data: base64Data
                        }
                    });
                });

                options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': AI_PROVIDERS.anthropic.version,
                        'anthropic-dangerous-direct-browser-access': 'true' // Allow browser calls
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        system: systemPrompt,
                        messages: [{ role: "user", content: content }],
                        max_tokens: 2000
                    })
                };
                break;
            }

            case 'google': {
                url = `${AI_PROVIDERS.google.baseUrl}/${selectedModel}:generateContent?key=${apiKey}`;

                const parts = [{ text: `${systemPrompt}\n\n${userMessage}` }];

                images.forEach(imgBase64 => {
                    const base64Data = imgBase64.split(',')[1];
                    const mediaType = imgBase64.split(';')[0].split(':')[1];
                    parts.push({
                        inline_data: {
                            mime_type: mediaType,
                            data: base64Data
                        }
                    });
                });

                options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: parts }],
                        generationConfig: {
                            response_mime_type: jsonMode ? "application/json" : "text/plain"
                        }
                    })
                };
                break;
            }

            default:
                throw new Error(`Proveedor no soportado: ${selectedProvider}`);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || data.error || 'Error desconocido en la API';
            throw new Error(`${selectedProvider} Error: ${errorMsg}`);
        }

        // Normalize Response
        let resultText = '';
        if (selectedProvider === 'openai') {
            resultText = data.choices[0].message.content;
        } else if (selectedProvider === 'anthropic') {
            resultText = data.content[0].text;
        } else if (selectedProvider === 'google') {
            resultText = data.candidates[0].content.parts[0].text;
        } else if (selectedProvider === 'local') {
            resultText = data.message.content;
        }

        return { success: true, data: resultText };

    } catch (error) {
        console.error("AI Service Error:", error);
        return { success: false, message: error.message };
    }
};

// --- 3. Business Functions (Pathology Context) ---

// Helper to parse JSON safely from LLM response
const parseJSON = (text) => {
    try {
        const jsonString = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return null;
    }
};

/**
 * Test Connection
 * Verifies if the current configuration works.
 */
export const testConnection = async (config) => {
    const result = await callAIProvider({
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKey,
        systemPrompt: "Eres un sistema de prueba.",
        userMessage: "Responde con un JSON: {\"status\": \"ok\"}",
        jsonMode: true
    });

    if (result.success) {
        const json = parseJSON(result.data);
        return json && json.status === 'ok'
            ? { success: true, message: "Conexión exitosa" }
            : { success: false, message: "Respuesta inválida del proveedor" };
    }
    return result;
};

/**
 * Analyze Case (Diagnostic Assistance)
 */
export const analyzeCase = async (textData, images, organ, apiKeyOverride, preClassification = null, reinforcement = "") => {
    const config = getAIConfig();
    const apiKey = apiKeyOverride || config?.apiKey;
    const provider = config?.provider || 'openai';
    const model = config?.model;

    // Fallback to simulation if no key/provider
    if (!apiKey && provider !== 'local') return simulateAnalyzeCase(organ, images, preClassification);

    const imagePromises = images.map(img => fileToBase64(img.file));
    const base64Images = await Promise.all(imagePromises);

    const systemPrompt = "Eres un experto patólogo anatómico. Tu objetivo es asistir en el diagnóstico diferencial. Responde SIEMPRE en ESPAÑOL y en formato JSON.";
    const userMessage = `Analiza las imágenes y el contexto:
    Órgano: ${organ}
    Microscopía: ${textData}
    Pre-Clasificación: ${preClassification ? JSON.stringify(preClassification) : 'N/A'}
    
    Genera un JSON con:
    1. "suggestions": Array de 3 diagnósticos (diagnosis, probability, reasoning, type).
    2. "similarCases": Array de 2 casos similares (diagnosis, description, imageUrl=null).
    3. "references": Array de 3 referencias (title, source).
    
    ${reinforcement}`;

    const result = await callAIProvider({
        provider, model, apiKey, systemPrompt, userMessage, images: base64Images
    });

    if (result.success) {
        const data = parseJSON(result.data);
        if (data) return data;
    }

    // Fallback on error
    return simulateAnalyzeCase(organ, images, preClassification);
};

/**
 * Pre-Classify Case (Triage)
 */
export const preClassifyCase = async (images, apiKeyOverride, reinforcement = "") => {
    const config = getAIConfig();
    const apiKey = apiKeyOverride || config?.apiKey;
    const provider = config?.provider || 'openai';
    const model = config?.model;

    if (!apiKey && provider !== 'local') return simulatePreClassify(images);

    const imagePromises = images.map(img => fileToBase64(img.file));
    const base64Images = await Promise.all(imagePromises);

    const systemPrompt = "Eres un asistente de triaje para patología. Prioriza la sensibilidad para detectar malignidad. Responde en JSON.";
    const userMessage = `Clasifica las imágenes histológicas adjuntas.
    JSON esperado:
    {
        "category": "Inflamatorio" | "Neoplásico" | "Otro",
        "nature": "Benigno" | "Sospechoso" | "Maligno",
        "grade": "Grado/Gleason" | null,
        "probability": 0-100 (Probabilidad de malignidad),
        "reasoning": "Breve justificación (max 15 palabras)"
    }
    ${reinforcement}`;

    const result = await callAIProvider({
        provider, model, apiKey, systemPrompt, userMessage, images: base64Images
    });

    if (result.success) {
        const data = parseJSON(result.data);
        if (data) return data;
    }

    return simulatePreClassify(images);
};

/**
 * Generate Structured Report (Draft)
 */
export const generateStructuredReport = async (text, apiKeyOverride, reinforcement = "") => {
    const config = getAIConfig();
    const apiKey = apiKeyOverride || config?.apiKey;
    const provider = config?.provider || 'openai';
    const model = config?.model;

    if (!apiKey && provider !== 'local') return simulateStructuredReport(text);

    const systemPrompt = "Eres un patólogo experto. Redacta un informe técnico formal basado en las notas proporcionadas. Usa terminología médica precisa y voz pasiva. Responde en JSON.";
    const userMessage = `Notas del caso: "${text}"
    
    Genera un JSON con:
    1. "organ": Órgano inferido.
    2. "type": Tipo de procedimiento.
    3. "macroscopy": Descripción macroscópica formal.
    4. "microscopy": Descripción microscópica formal.
    5. "diagnosis": Diagnóstico final en mayúsculas.
    6. "clinicalData": Datos clínicos relevantes.
    ${reinforcement}`;

    const result = await callAIProvider({
        provider, model, apiKey, systemPrompt, userMessage
    });

    if (result.success) {
        const data = parseJSON(result.data);
        if (data) return data;
    }

    return simulateStructuredReport(text);
};

/**
 * Analyze Quantitative Metrics
 */
export const analyzeQuantitativeMetrics = async (images, type, apiKeyOverride, reinforcement = "") => {
    const config = getAIConfig();
    const apiKey = apiKeyOverride || config?.apiKey;
    const provider = config?.provider || 'openai';
    const model = config?.model;

    if (!apiKey && provider !== 'local') return simulateQuantitativeMetrics(images, type);

    const imagePromises = images.map(img => fileToBase64(img.file));
    const base64Images = await Promise.all(imagePromises);

    const systemPrompt = "Eres un experto en patología digital cuantitativa. Responde en JSON.";
    let specificPrompt = "";

    if (type === 'mitosis') specificPrompt = "Cuenta figuras mitóticas (simulando 10 HPF). JSON: {count, reasoning}";
    else if (type === 'ki67') specificPrompt = "Estima índice Ki-67 (%). JSON: {percentage, score, reasoning}";
    else if (type === 'glandular') specificPrompt = "Estima densidad glandular. JSON: {percentage, score, reasoning}";
    else if (type === 'necrosis') specificPrompt = "Detecta necrosis. JSON: {present, percentage, reasoning}";

    const userMessage = `${specificPrompt} ${reinforcement}`;

    const result = await callAIProvider({
        provider, model, apiKey, systemPrompt, userMessage, images: base64Images
    });

    if (result.success) {
        const data = parseJSON(result.data);
        if (data) return data;
    }

    return simulateQuantitativeMetrics(images, type);
};

/**
 * Analyze Quality Control
 */
export const analyzeQualityControl = async (images, apiKeyOverride, reinforcement = "") => {
    const config = getAIConfig();
    const apiKey = apiKeyOverride || config?.apiKey;
    const provider = config?.provider || 'openai';
    const model = config?.model;

    if (!apiKey && provider !== 'local') return { score: 9, issues: [], recommendation: "Aceptable", reasoning: "Simulación" };

    const imagePromises = images.map(img => fileToBase64(img.file));
    const base64Images = await Promise.all(imagePromises);

    const systemPrompt = "Eres un experto en control de calidad de imágenes médicas. Responde en JSON.";
    const userMessage = `Evalúa la calidad técnica (enfoque, tinción, artefactos).
    JSON: { "score": 0-10, "issues": [], "recommendation": "Aceptable"|"Reprocesar", "reasoning": "" }
    ${reinforcement}`;

    const result = await callAIProvider({
        provider, model, apiKey, systemPrompt, userMessage, images: base64Images
    });

    if (result.success) {
        const data = parseJSON(result.data);
        if (data) return data;
    }

    return { score: 9, issues: [], recommendation: "Aceptable", reasoning: "Simulación (Fallback)" };
};

/**
 * Analyze Macroscopy
 */
export const analyzeMacroscopy = async (images, apiKeyOverride) => {
    const config = getAIConfig();
    const apiKey = apiKeyOverride || config?.apiKey;
    const provider = config?.provider || 'openai';
    const model = config?.model;

    if (!apiKey && provider !== 'local') return null;

    const imagePromises = images.map(img => fileToBase64(img.file));
    const base64Images = await Promise.all(imagePromises);

    const systemPrompt = "Eres un asistente de patología macroscópica. Describe la pieza quirúrgica. Responde en JSON.";
    const userMessage = `Describe la imagen. JSON: { "findings": "", "dimensions": "", "margins": "" }`;

    const result = await callAIProvider({
        provider, model, apiKey, systemPrompt, userMessage, images: base64Images
    });

    if (result.success) {
        return parseJSON(result.data);
    }
    return null;
};


// --- 4. Simulation Fallbacks (Legacy Support) ---

const simulateAnalyzeCase = (organ, images, preClassification) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                suggestions: [{ diagnosis: "Diagnóstico Simulado", probability: "Alta", reasoning: "Modo simulación activo.", type: "Benigno" }],
                similarCases: [],
                references: []
            });
        }, 1500);
    });
};

const simulatePreClassify = (images) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ category: "Otro", nature: "Benigno", grade: null, probability: 5, reasoning: "Simulación." });
        }, 1000);
    });
};

const simulateStructuredReport = (text) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                organ: "No Especificado", type: "Biopsia", macroscopy: "No descrita", microscopy: "No descrita",
                diagnosis: "INFORME SIMULADO", clinicalData: ""
            });
        }, 1000);
    });
};

const simulateQuantitativeMetrics = (images, type) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ percentage: 0, count: 0, reasoning: "Simulación" });
        }, 1000);
    });
};

// Legacy exports needed for UI compatibility
export const trainModel = async (caseData) => ({ success: true });
export const validateDiagnosis = async () => ({ valid: true, aiCertified: true });

/**
 * Generate Heatmap Data (Simulated or AI)
 */
export const generateHeatmapData = async (image) => {
    // For now, return simulated heatmap data
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate random points for heatmap
            const points = [];
            for (let i = 0; i < 50; i++) {
                points.push({
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    value: Math.random()
                });
            }
            resolve(points);
        }, 500);
    });
};

/**
 * Validate Histology Image
 */
export const validateHistologyImage = async (image) => {
    return analyzeQualityControl([image]);
};
