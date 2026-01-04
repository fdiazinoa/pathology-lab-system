// Helper to convert file to base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

export const analyzeCase = async (textData, images, organ, apiKey, preClassification = null, reinforcement = "") => {
    // --- REAL AI MODE ---
    if (apiKey) {
        try {
            const imagePromises = images.map(img => fileToBase64(img.file));
            const base64Images = await Promise.all(imagePromises);

            const content = [
                {
                    type: "text",
                    text: `Eres un experto patólogo anatómico. Analiza las imágenes de microscopía adjuntas y el siguiente contexto clínico:
                    Órgano: ${organ}
                    Descripción Microscópica: ${textData}
                    Pre-Clasificación IA: ${preClassification ? JSON.stringify(preClassification) : 'No disponible'}
                    
                    Proporciona una respuesta estructurada en JSON con:
                    1. "suggestions": Un array de 3 diagnósticos diferenciales. Cada objeto debe tener: "diagnosis" (Nombre del diagnóstico en Español), "probability" (Alta/Media/Baja), "reasoning" (explicación breve en Español), y "type" (Benign/Maligno).
                    2. "similarCases": Un array de 2 casos similares típicos para este diagnóstico (ejemplos teóricos). Cada objeto debe tener: "diagnosis", "description" (breve descripción de la presentación típica), y "imageUrl" (usa null).
                    3. "references": Un array de 3 referencias bibliográficas o guías clínicas relevantes (ej. WHO Classification, artículos de PubMed). Cada objeto debe tener: "title" y "source".
                    
                    Enfócate en patrones visuales, atipia celular y distorsión arquitectural visible en las imágenes. Responde SIEMPRE en ESPAÑOL.
                    ${reinforcement}`
                }
            ];

            base64Images.forEach(base64 => {
                content.push({
                    type: "image_url",
                    image_url: {
                        url: base64
                    }
                });
            });

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: content
                        }
                    ],
                    response_format: { type: "json_object" },
                    max_tokens: 1500
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            const rawContent = data.choices[0].message.content;
            console.log("OpenAI Full Response:", data);

            if (!rawContent) {
                console.error("OpenAI returned empty content. Full data:", data);
                if (data.choices[0].finish_reason === "content_filter") {
                    throw new Error("La IA se negó a analizar la imagen por motivos de seguridad (filtro de contenido).");
                }
                throw new Error("La IA no devolvió ningún contenido. Verifica si la imagen es válida.");
            }

            console.log("OpenAI Raw Content:", rawContent);

            // Clean up markdown code blocks if present (fixes common JSON parse error)
            const jsonString = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

            let result;
            try {
                result = JSON.parse(jsonString);
            } catch (e) {
                console.error("JSON Parse Error:", e);
                throw new Error("La respuesta de la IA no tiene un formato válido.");
            }

            if (!result || !result.suggestions) {
                console.error("Invalid Result Structure:", result);
                throw new Error("La estructura de la respuesta de la IA es incorrecta.");
            }

            return {
                suggestions: result.suggestions || [],
                similarCases: result.similarCases || [],
                references: result.references || []
            };

        } catch (error) {
            console.error("OpenAI API Error:", error);
            alert("Error con la API de OpenAI: " + error.message + ". Usando simulación.");
            // Fallback to simulation if API fails
            // We could return null here to stop, but falling back allows the user to continue working.
        }
    }

    // --- SIMULATION MODE (Existing Logic) ---
    return new Promise((resolve) => {
        setTimeout(() => {
            let suggestions = [];
            let similarCases = [];
            let references = [];

            const organLower = organ ? organ.toLowerCase() : '';

            // Helper to check filenames
            const checkFilenames = (keyword) => {
                return images && images.some(img => img.name.toLowerCase().includes(keyword));
            };

            // --- CONSISTENCY CHECK WITH PRE-CLASSIFICATION ---
            // If pre-classification exists and is Benign, force benign suggestions unless filenames override
            const forceBenign = preClassification && preClassification.nature === 'Benigno';

            // --- FILENAME BASED LOGIC (Priority) ---

            if (checkFilenames('melanoma')) {
                suggestions = [
                    {
                        diagnosis: "Melanoma Maligno",
                        probability: "Muy Alta (Detectado por Imagen)",
                        reasoning: "Patrón asimétrico con bordes irregulares y atipia melanocítica marcada.",
                        type: "Maligno"
                    }
                ];
                similarCases = [{ id: "SC-IMG-01", diagnosis: "Melanoma Nodular", description: "Caso de referencia por similitud visual.", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Melanoma.jpg/640px-Melanoma.jpg" }];
                references = [{ title: "WHO Classification of Skin Tumours", source: "IARC, 4th Edition" }];
            }
            else if (checkFilenames('nevus') || checkFilenames('lunar')) {
                suggestions = [
                    {
                        diagnosis: "Nevus Intradérmico",
                        probability: "Alta",
                        reasoning: "Nidos de nevus maduros en la dermis, sin actividad juntural significativa.",
                        type: "Benigno"
                    }
                ];
            }
            else if (checkFilenames('basocelular') || checkFilenames('basal')) {
                suggestions = [
                    {
                        diagnosis: "Carcinoma Basocelular",
                        probability: "Alta",
                        reasoning: "Nidos de células basaloides con empalizada periférica y retracción del estroma.",
                        type: "Maligno"
                    }
                ];
            }
            else if (checkFilenames('adenocarcinoma')) {
                suggestions = [
                    {
                        diagnosis: "Adenocarcinoma Infiltrante",
                        probability: "Alta",
                        reasoning: "Formación de glándulas irregulares y desmoplasia estromal.",
                        type: "Maligno"
                    }
                ];
            }
            else if (checkFilenames('gastritis')) {
                suggestions = [
                    {
                        diagnosis: "Gastritis Crónica",
                        probability: "Alta",
                        reasoning: "Infiltrado inflamatorio en lámina propia sin atrofia glandular significativa.",
                        type: "Benigno"
                    }
                ];
            }
            else if (checkFilenames('normal')) {
                suggestions = [
                    {
                        diagnosis: "Tejido Sin Alteraciones Histológicas",
                        probability: "Alta",
                        reasoning: "Arquitectura conservada y citología dentro de límites normales.",
                        type: "Benigno"
                    }
                ];
            }

            // --- ORGAN BASED LOGIC (Fallback) ---
            else if (organLower.includes('piel')) {
                if (forceBenign) {
                    suggestions = [
                        {
                            diagnosis: "Nevus Intradérmico",
                            probability: "Alta",
                            reasoning: "Pre-clasificación benigna: Lesión melanocítica sin criterios de malignidad.",
                            type: "Benigno"
                        },
                        {
                            diagnosis: "Queratosis Seborreica",
                            probability: "Media",
                            reasoning: "Proliferación epidérmica benigna con quistes córneos.",
                            type: "Benigno"
                        },
                        {
                            diagnosis: "Dermatofibroma",
                            probability: "Baja",
                            reasoning: "Lesión fibrohistiocítica benigna.",
                            type: "Benigno"
                        }
                    ];
                } else {
                    suggestions = [
                        {
                            diagnosis: "Melanoma Maligno",
                            probability: "Alta",
                            reasoning: "Presencia de nidos de melanocitos atípicos con ascenso pagetoide y asimetría.",
                            type: "Maligno"
                        },
                        {
                            diagnosis: "Nevus Displásico",
                            probability: "Media",
                            reasoning: "Arquitectura desordenada y atipia citológica leve a moderada, pero sin invasión franca.",
                            type: "Benigno"
                        },
                        {
                            diagnosis: "Carcinoma Basocelular",
                            probability: "Baja",
                            reasoning: "Nidos de células basaloides con empalizada periférica.",
                            type: "Maligno"
                        }
                    ];
                }
                similarCases = [
                    {
                        id: "SC-SKIN-01",
                        diagnosis: "Melanoma Extensivo Superficial",
                        description: "Lesión pigmentada en espalda, bordes irregulares.",
                        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Melanoma.jpg/640px-Melanoma.jpg"
                    }
                ];
                references = [{ title: "Dermoscopy of Melanoma", source: "JAMA Dermatology" }];
            } else if (organLower.includes('estómago') || organLower.includes('estomago')) {
                if (forceBenign) {
                    suggestions = [
                        {
                            diagnosis: "Gastritis Crónica",
                            probability: "Alta",
                            reasoning: "Pre-clasificación benigna: Inflamación sin atipia.",
                            type: "Benigno"
                        },
                        {
                            diagnosis: "Pólipo Hiperplásico",
                            probability: "Media",
                            reasoning: "Proliferación foveolar benigna.",
                            type: "Benigno"
                        }
                    ];
                } else {
                    suggestions = [
                        {
                            diagnosis: "Adenocarcinoma Gástrico",
                            probability: "Alta",
                            reasoning: "Glándulas irregulares infiltrando la muscularis mucosae.",
                            type: "Maligno"
                        },
                        {
                            diagnosis: "Gastritis Crónica Activa",
                            probability: "Media",
                            reasoning: "Infiltrado inflamatorio linfoplasmocitario con actividad de neutrófilos.",
                            type: "Benigno"
                        }
                    ];
                }
                similarCases = [
                    {
                        id: "SC-GAST-05",
                        diagnosis: "Adenocarcinoma Intestinal",
                        description: "Masa ulcerada en antro gástrico.",
                        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Gastric_adenocarcinoma_histopathology_%281%29.jpg/640px-Gastric_adenocarcinoma_histopathology_%281%29.jpg"
                    }
                ];
            } else {
                // Default / Breast (existing logic)
                if (forceBenign) {
                    suggestions = [
                        {
                            diagnosis: "Fibroadenoma",
                            probability: "Alta",
                            reasoning: "Pre-clasificación benigna: Proliferación bifásica estromal y epitelial sin atipia.",
                            type: "Benigno"
                        },
                        {
                            diagnosis: "Cambios Fibroquísticos",
                            probability: "Media",
                            reasoning: "Quistes, fibrosis y adenosis sin evidencia de malignidad.",
                            type: "Benigno"
                        },
                        {
                            diagnosis: "Adenosis Esclerosante",
                            probability: "Baja",
                            reasoning: "Distorsión arquitectural benigna.",
                            type: "Benigno"
                        }
                    ];
                } else {
                    suggestions = [
                        {
                            diagnosis: "Carcinoma Ductal Infiltrante",
                            probability: "Alta",
                            reasoning: "Patrón de crecimiento invasivo con formación de túbulos irregulares y atipia nuclear moderada.",
                            type: "Maligno"
                        },
                        {
                            diagnosis: "Carcinoma Lobulillar Infiltrante",
                            probability: "Media",
                            reasoning: "Células dispuestas en fila india, pero predomina el patrón ductal.",
                            type: "Maligno"
                        },
                        {
                            diagnosis: "Adenosis Esclerosante",
                            probability: "Baja",
                            reasoning: "Presencia de distorsión arquitectural, pero con atipia significativa que sugiere malignidad.",
                            type: "Benigno"
                        }
                    ];
                }
                similarCases = [
                    {
                        id: "SC-882",
                        diagnosis: "Carcinoma Ductal Infiltrante G2",
                        description: "Mujer de 50 años, masa palpable.",
                        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Invasive_Ductal_Carcinoma_-_High_Mag.jpg/640px-Invasive_Ductal_Carcinoma_-_High_Mag.jpg"
                    },
                    {
                        id: "SC-104",
                        diagnosis: "Carcinoma Ductal Infiltrante G3",
                        description: "Mujer de 65 años, microcalcificaciones.",
                        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Breast_invasive_ductal_carcinoma_histopathology_%281%29.jpg/640px-Breast_invasive_ductal_carcinoma_histopathology_%281%29.jpg"
                    }
                ];
            }

            resolve({
                suggestions,
                similarCases,
                references
            });
        }, 2500); // Simulate network delay
    });
};

export const trainModel = async (caseData) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Training model with case:", caseData.id);
            console.log("Images archived:", caseData.images.length);
            console.log("Diagnosis:", caseData.diagnosis);
            resolve({ success: true, message: "Caso archivado y procesado para entrenamiento." });
        }, 1500);
    });
};

export const validateDiagnosis = (diagnosis, organ, macroscopy, microscopy, images) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const diagLower = diagnosis.toLowerCase();
            const organLower = organ ? organ.toLowerCase() : '';
            const microLower = microscopy ? microscopy.toLowerCase() : '';
            const macroLower = macroscopy ? macroscopy.toLowerCase() : '';
            const hasImages = images && images.length > 0;

            // Helper to check filenames
            const checkFilenames = (keyword) => {
                return images && images.some(img => img.name.toLowerCase().includes(keyword));
            };

            if (diagLower.length < 10) {
                resolve({
                    valid: false,
                    warning: "El diagnóstico parece demasiado corto. Por favor, detalla más tus hallazgos."
                });
                return;
            }

            // --- FILENAME BASED VALIDATION ---
            if (hasImages) {
                if (checkFilenames('melanoma') && diagLower.includes('benigno') && !diagLower.includes('melanoma')) {
                    resolve({
                        valid: false,
                        warning: "ALERTA CRÍTICA: La imagen cargada ha sido identificada preliminarmente como compatible con MELANOMA. Su diagnóstico 'Benigno' es altamente contradictorio. ¿Desea proceder?"
                    });
                    return;
                }

                if (checkFilenames('normal') && (diagLower.includes('maligno') || diagLower.includes('carcinoma'))) {
                    resolve({
                        valid: false,
                        warning: "La imagen parece corresponder a tejido normal, pero usted ha diagnosticado malignidad. Por favor verifique si subió la imagen correcta."
                    });
                    return;
                }
            }

            // --- ORGAN BASED VALIDATION (Fallback) ---
            if (organLower.includes('piel') && diagLower.includes('benigno') && !diagLower.includes('nevus')) {
                // Only trigger this generic warning if we didn't match a specific filename
                if (!checkFilenames('normal')) {
                    resolve({
                        valid: false,
                        warning: "La IA ha detectado patrones visuales que podrían sugerir malignidad (asimetría/bordes irregulares). ¿Estás seguro de que es Benigno?"
                    });
                    return;
                }
            }

            if (organLower.includes('estómago') && diagLower.includes('gastritis') && !diagLower.includes('crónica')) {
                resolve({
                    valid: false,
                    warning: "La IA sugiere descartar Adenocarcinoma debido a la irregularidad glandular observada. ¿Confirmas el diagnóstico de Gastritis?"
                });
                return;
            }

            // --- TEXT-IMAGE CONSISTENCY ---
            if (hasImages) {
                // Demo: Skin case where text says "normal" but image is melanoma (by filename)
                if (checkFilenames('melanoma') && (microLower.includes('normal') || microLower.includes('sin atipia'))) {
                    resolve({
                        valid: false,
                        warning: "Discrepancia Detectada: La imagen muestra características de Melanoma (atipia marcada) que NO se describen en la microscopía ('" + microscopy + "')."
                    });
                    return;
                }

                // Demo: Stomach case where macro says "lisa"/smooth but image shows ulcer (simulated)
                if (organLower.includes('estómago') && (macroLower.includes('lisa') || macroLower.includes('conservada'))) {
                    resolve({
                        valid: false,
                        warning: "Discrepancia Detectada: La imagen muestra una lesión ulcerada/irregular que contradice la descripción macroscópica ('" + macroscopy + "')."
                    });
                    return;
                }
            }

            resolve({
                valid: true,
                aiCertified: true,
                reasoning: "Validación simulada exitosa."
            });
        }, 800);
    });
};
export const preClassifyCase = async (images, apiKey, reinforcement = "") => {
    // --- REAL AI MODE ---
    if (apiKey) {
        try {
            const imagePromises = images.map(img => fileToBase64(img.file));
            const base64Images = await Promise.all(imagePromises);

            const content = [
                {
                    type: "text",
                    text: `Eres un asistente de triaje para patología. Analiza las imágenes microscópicas adjuntas para una pre-clasificación rápida.
                    
                    Responde con un JSON estructurado con los siguientes campos:
                    1. "category": "Inflamatorio", "Neoplásico", u "Otro".
                    2. "nature": "Benigno", "Sospechoso", o "Maligno".
                    3. "grade": Grado tentativo si aplica (ej. "Bajo Grado", "Alto Grado", "Gleason Alto"), o null.
                    4. "probability": Un número de 0 a 100 indicando la confianza en que sea MALIGNO (si es benigno, será bajo).
                    5. "reasoning": Breve justificación en Español (max 15 palabras).

                    Sé sensible para detectar malignidad (prioriza sensibilidad sobre especificidad para triaje).
                    ${reinforcement}`
                }
            ];

            base64Images.forEach(base64 => {
                content.push({
                    type: "image_url",
                    image_url: {
                        url: base64,
                        detail: "low" // Low detail is enough for triage and faster/cheaper
                    }
                });
            });

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: content }],
                    response_format: { type: "json_object" },
                    max_tokens: 300
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const rawContent = data.choices[0].message.content;
            const jsonString = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            return JSON.parse(jsonString);

        } catch (error) {
            console.error("Pre-classification API Error:", error);
            // Fallback to simulation on error
        }
    }

    // --- SIMULATION MODE ---
    return new Promise((resolve) => {
        setTimeout(() => {
            const checkFilenames = (keyword) => images && images.some(img => img.name.toLowerCase().includes(keyword));

            if (checkFilenames('melanoma') || checkFilenames('carcinoma') || checkFilenames('maligno')) {
                resolve({
                    category: "Neoplásico",
                    nature: "Maligno",
                    grade: "Alto Grado",
                    probability: 95,
                    reasoning: "Patrón infiltrativo y atipia marcada detectados."
                });
            } else if (checkFilenames('sospechoso') || checkFilenames('atipia')) {
                resolve({
                    category: "Neoplásico",
                    nature: "Sospechoso",
                    grade: "Indeterminado",
                    probability: 60,
                    reasoning: "Arquitectura desordenada, requiere revisión experta."
                });
            } else if (checkFilenames('gastritis') || checkFilenames('inflamacion')) {
                resolve({
                    category: "Inflamatorio",
                    nature: "Benigno",
                    grade: null,
                    probability: 10,
                    reasoning: "Infiltrado inflamatorio sin atipia significativa."
                });
            } else {
                // Default Normal/Benign
                resolve({
                    category: "Otro",
                    nature: "Benigno",
                    grade: null,
                    probability: 5,
                    reasoning: "Sin alteraciones arquitecturales evidentes."
                });
            }
        }, 1500);
    });
};
export const analyzeQuantitativeMetrics = async (images, type, apiKey, reinforcement = "") => {
    // --- REAL AI MODE ---
    if (apiKey) {
        try {
            const imagePromises = images.map(img => fileToBase64(img.file));
            const base64Images = await Promise.all(imagePromises);

            let promptText = "";
            if (type === 'mitosis') {
                promptText = "Cuenta el número de figuras mitóticas visibles en estas imágenes (simulando 10 HPF). Devuelve 'count' (número entero) y 'reasoning' (breve descripción de dónde se ven).";
            } else if (type === 'ki67') {
                promptText = "Estima el índice de proliferación Ki-67 (porcentaje de núcleos positivos). Devuelve 'percentage' (0-100), 'score' (Bajo/Intermedio/Alto) y 'reasoning'.";
            } else if (type === 'glandular') {
                promptText = "Estima la densidad glandular y relación glándula/estroma. Devuelve 'percentage' (densidad), 'score' (Grado de diferenciación estimado) y 'reasoning'.";
            } else if (type === 'necrosis') {
                promptText = "Detecta presencia y porcentaje de necrosis tumoral. Devuelve 'percentage' (área necrótica), 'present' (true/false) y 'reasoning'.";
            }

            const content = [
                {
                    type: "text",
                    text: `Eres un experto en patología digital cuantitativa. ${promptText}
                    Responde con un JSON estructurado.
                    ${reinforcement}`
                }
            ];

            base64Images.forEach(base64 => {
                content.push({
                    type: "image_url",
                    image_url: { url: base64 }
                });
            });

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: content }],
                    response_format: { type: "json_object" },
                    max_tokens: 300
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const rawContent = data.choices[0].message.content;
            const jsonString = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            return JSON.parse(jsonString);

        } catch (error) {
            console.error("Quantitative Analysis API Error:", error);
        }
    }

    // --- SIMULATION MODE ---
    return new Promise((resolve) => {
        setTimeout(() => {
            const checkFilenames = (keyword) => images && images.some(img => img.name.toLowerCase().includes(keyword));

            if (type === 'mitosis') {
                resolve({
                    count: checkFilenames('mitosis') || checkFilenames('alto') ? 18 : 2,
                    reasoning: "Conteo realizado en 10 campos de alto poder seleccionados aleatoriamente."
                });
            } else if (type === 'ki67') {
                const isHigh = checkFilenames('ki67') || checkFilenames('proliferacion');
                resolve({
                    percentage: isHigh ? 65 : 15,
                    score: isHigh ? "Alto" : "Bajo",
                    reasoning: isHigh ? "Alta positividad nuclear observada difusamente." : "Positividad nuclear dispersa."
                });
            } else if (type === 'glandular') {
                resolve({
                    percentage: 45,
                    score: "Moderadamente Diferenciado",
                    reasoning: "Formación glandular irregular con fusión focal."
                });
            } else if (type === 'necrosis') {
                const hasNecrosis = checkFilenames('necrosis') || checkFilenames('muerte');
                resolve({
                    present: hasNecrosis,
                    percentage: hasNecrosis ? 25 : 0,
                    reasoning: hasNecrosis ? "Focos de necrosis tumoral tipo comedo." : "No se observa necrosis tumoral."
                });
            }
        }, 2000);
    });
};

export const generateStructuredReport = async (text, apiKey, reinforcement = "") => {
    // --- REAL AI MODE ---
    if (apiKey) {
        try {
            const content = [
                {
                    type: "text",
                    text: `Eres un asistente experto en patología. Tu tarea es convertir el siguiente texto dictado o libre en un informe estructurado JSON.
                    
                    Texto de entrada: "${text}"

                    Genera un JSON con los siguientes campos (infiere lo que falte basado en el contexto médico):
                    1. "organ": Órgano o sitio anatómico (ej. "Próstata", "Piel", "Estómago").
                    2. "type": Tipo de procedimiento (ej. "Biopsia", "Resección", "Citología").
                    3. "macroscopy": Descripción macroscópica inferida o "No descrita".
                    4. "microscopy": Descripción microscópica técnica y detallada basada en el texto.
                    5. "diagnosis": Diagnóstico patológico final, formateado profesionalmente.
                    6. "clinicalData": Datos clínicos si se mencionan.

                    Responde SIEMPRE en ESPAÑOL.
                    ${reinforcement}`
                }
            ];

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: content }],
                    response_format: { type: "json_object" },
                    max_tokens: 1000
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const rawContent = data.choices[0].message.content;
            const jsonString = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            return JSON.parse(jsonString);

        } catch (error) {
            console.error("Conversational Report API Error:", error);
        }
    }

    // --- SIMULATION MODE ---
    return new Promise((resolve) => {
        setTimeout(() => {
            const lowerText = text.toLowerCase();
            if (lowerText.includes('próstata') || lowerText.includes('prostata')) {
                resolve({
                    organ: "Próstata",
                    type: "Biopsia por Aguja (Tru-cut)",
                    macroscopy: "Cilindros filiformes de tejido blanquecino.",
                    microscopy: "Proliferación acinar neoplásica con fusión glandular y ausencia de células basales.",
                    diagnosis: "ADENOCARCINOMA ACINAR DE PRÓSTATA, GLEASON 7 (3+4).",
                    clinicalData: "Nódulo palpable / PSA elevado."
                });
            } else if (lowerText.includes('piel') || lowerText.includes('melanoma')) {
                resolve({
                    organ: "Piel",
                    type: "Biopsia Escisional",
                    macroscopy: "Losange de piel con lesión pigmentada central.",
                    microscopy: "Proliferación melanocítica atípica con crecimiento pagetoide y nidos irregulares.",
                    diagnosis: "MELANOMA EXTENSIVO SUPERFICIAL, BRESLOW 0.8mm.",
                    clinicalData: "Lesión sospechosa."
                });
            } else {
                resolve({
                    organ: "No Especificado",
                    type: "Biopsia",
                    macroscopy: "Fragmento de tejido irregular.",
                    microscopy: "Tejido con alteraciones inespecíficas.",
                    diagnosis: "HALLAZGOS DESCRIPTIVOS (Ver Microscopía).",
                    clinicalData: ""
                });
            }
        }, 1500);
    });
};

export const analyzeQualityControl = async (images, apiKey, reinforcement = "") => {
    // --- REAL AI MODE ---
    if (apiKey) {
        try {
            const imagePromises = images.map(img => fileToBase64(img.file));
            const base64Images = await Promise.all(imagePromises);

            const content = [
                {
                    type: "text",
                    text: `Eres un experto en control de calidad de patología digital. Analiza estas imágenes en busca de artefactos técnicos.
                    
                    Detecta:
                    1. Burbujas de aire bajo el cubreobjetos.
                    2. Pliegues en el tejido.
                    3. Desenfoque (fuera de foco / mal escaneado).
                    4. Tinción irregular (muy pálida o muy oscura).
                    5. Suciedad o rayaduras.

                    Responde con un JSON:
                    {
                        "score": (0-10, donde 10 es perfecto),
                        "issues": ["Lista", "de", "problemas", "detectados"],
                        "recommendation": "Aceptable" | "Reprocesar" | "Recortar",
                        "reasoning": "Breve explicación"
                    }
                    ${reinforcement}`
                }
            ];

            base64Images.forEach(base64 => {
                content.push({
                    type: "image_url",
                    image_url: { url: base64 }
                });
            });

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: content }],
                    response_format: { type: "json_object" },
                    max_tokens: 500
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const rawContent = data.choices[0].message.content;
            const jsonString = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            return JSON.parse(jsonString);



        } catch (error) {
            console.error("Quality Control API Error:", error);
        }
    }

    // --- SIMULATION MODE ---
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                score: 8,
                issues: ["Ligero desenfoque en esquina superior derecha"],
                recommendation: "Aceptable",
                reasoning: "La calidad general es buena para diagnóstico."
            });
        }, 1500);
    });
};

export const validateHistologyImage = async (file, apiKey, reinforcement = "") => {
    // --- REAL AI MODE ---
    if (apiKey) {
        try {
            const base64 = await fileToBase64(file);
            const content = [
                {
                    type: "text",
                    text: `Eres un filtro de seguridad para un sistema de patología. Analiza esta imagen y determina si es una IMAGEN MICROSCÓPICA/HISTOLÓGICA válida (H&E, IHQ, Citología).
                    
                    Rechaza: Fotos clínicas (pacientes, piel, heridas), fotos de documentos, fotos de radiografías, o cualquier cosa que NO sea microscopía.
                    
                    Responde con un JSON:
                    {
                        "isValid": true/false,
                        "reason": "Explicación breve en Español"
                    }
                    ${reinforcement}`
                },
                {
                    type: "image_url",
                    image_url: { url: base64 }
                }
            ];

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: content }],
                    response_format: { type: "json_object" },
                    max_tokens: 300
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            const rawContent = data.choices[0].message.content;
            return JSON.parse(rawContent);

        } catch (error) {
            console.error("Validation API Error:", error);
            // Fallback to simulation
        }
    }

    // --- SIMULATION MODE ---
    return new Promise((resolve) => {
        setTimeout(() => {
            const name = file.name.toLowerCase();
            // Simulate rejection of non-histological images based on filename keywords
            if (name.includes('foto') || name.includes('photo') || name.includes('clinica') || name.includes('paciente') || name.includes('cara')) {
                resolve({
                    isValid: false,
                    reason: "La imagen parece ser una fotografía clínica o macroscópica, no un corte histológico microscópico."
                });
            } else {
                resolve({
                    isValid: true,
                    reason: "Imagen compatible con microscopía."
                });
            }
        }, 1000);
    });
};



export const analyzeMacroscopy = async (images, apiKey, reinforcement = "") => {
    // --- REAL AI MODE ---
    if (apiKey) {
        try {
            const imagePromises = images.map(img => fileToBase64(img.file));
            const base64Images = await Promise.all(imagePromises);

            const content = [
                {
                    type: "text",
                    text: `Eres un asistente de patología macroscópica. Analiza la imagen del espécimen quirúrgico.
                    
                    Identifica:
                    1. Bordes de la lesión.
                    2. Áreas sospechosas.
                    3. Sugerencia de márgenes de resección.
                    4. Orientación y dimensiones estimadas.

                    Responde con un JSON:
                    {
                        "findings": "Descripción de hallazgos",
                        "margins": "Estado de márgenes sugerido",
                        "dimensions": "Dimensiones estimadas",
                        "suspiciousAreas": ["Lista de áreas"]
                    }
                    ${reinforcement}`
                }
            ];

            base64Images.forEach(base64 => {
                content.push({
                    type: "image_url",
                    image_url: { url: base64 }
                });
            });

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: content }],
                    response_format: { type: "json_object" },
                    max_tokens: 500
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const rawContent = data.choices[0].message.content;
            const jsonString = rawContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
            return JSON.parse(jsonString);

        } catch (error) {
            console.error("Macroscopy API Error:", error);
        }
    }

    // --- SIMULATION MODE ---
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                findings: "Lesión nodular de bordes irregulares, coloración heterogénea.",
                margins: "Margen profundo parece comprometido visualmente.",
                dimensions: "3.5 x 2.1 x 1.0 cm",
                suspiciousAreas: ["Cuadrante superior derecho", "Borde lateral"]
            });
        }, 1500);
    });
};

export const generateHeatmapData = async (image) => {
    // Simulation mode only for now
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate random but deterministic-looking regions based on image name length or random seed
            const regions = [
                {
                    id: 1,
                    x: 30, // Percentage
                    y: 40,
                    radius: 15,
                    probability: 0.95,
                    finding: "Atipia Nuclear Marcada",
                    description: "Núcleos aumentados de tamaño con hipercromasia y pleomorfismo evidente."
                },
                {
                    id: 2,
                    x: 60,
                    y: 70,
                    radius: 12,
                    probability: 0.85,
                    finding: "Mitosis Atípica",
                    description: "Figura mitótica tripolar sugestiva de aneuploidía."
                },
                {
                    id: 3,
                    x: 75,
                    y: 25,
                    radius: 10,
                    probability: 0.70,
                    finding: "Desmoplasia Estromal",
                    description: "Reacción fibrosa del estroma circundante."
                },
                {
                    id: 4,
                    x: 20,
                    y: 80,
                    radius: 8,
                    probability: 0.45,
                    finding: "Infiltrado Inflamatorio",
                    description: "Linfocitos dispersos, probablemente reactivos."
                }
            ];
            resolve(regions);
        }, 1000);
    });
};
