/**
 * AI Service Extension for Image Gallery
 * Extends existing aiService.js with image-specific analysis
 */

// Simulated AI model loading delay
const AI_ANALYSIS_TIME = 2500;

/**
 * Analyze single pathology image for gallery
 * Detects features like cells, mitosis, necrosis
 */
export const analyzeGalleryImage = async (image) => {
    console.log(`🔬 Analyzing image: ${image.name}`);

    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, AI_ANALYSIS_TIME));

    // Generate analysis based on image type
    const analysis = generateImageAnalysis(image);

    console.log(`✅ Analysis complete for ${image.name}`);
    return analysis;
};

/**
 * Generate image analysis with feature detection
 */
const generateImageAnalysis = (image) => {
    const isMicroscopy = image.type === 'micro_he' || image.type === 'micro';
    const isIHC = image.type === 'ihc';
    const isMacro = image.type === 'macro';

    const features = [];
    const suggestedAnnotations = [];

    // Generate features and annotations for all images (default to microscopy-like analysis)
    // Detect mitotic figures (2-4 guaranteed)
    const mitoticCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < mitoticCount; i++) {
        const feature = {
            id: `mitosis_${i}_${Date.now()}`,
            type: 'mitotic_figure',
            name: 'Figura Mitótica',
            confidence: 0.85 + Math.random() * 0.12,
            location: {
                x: 20 + Math.random() * 60,
                y: 20 + Math.random() * 60
            },
            description: 'Figura mitótica atípica detectada'
        };
        features.push(feature);

        suggestedAnnotations.push({
            id: `suggestion_mitosis_${i}_${Date.now()}`,
            featureId: feature.id,
            type: 'arrow',
            color: '#ef4444',
            coordinates: {
                x1: feature.location.x - 5,
                y1: feature.location.y - 5,
                x2: feature.location.x,
                y2: feature.location.y
            },
            label: 'Mitosis',
            confidence: feature.confidence,
            accepted: false,
            rejected: false
        });
    }

    // Detect necrosis (always 1-2)
    const necrosisCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < necrosisCount; i++) {
        const necrosisFeature = {
            id: `necrosis_${i}_${Date.now()}`,
            type: 'necrosis',
            name: 'Área de Necrosis',
            confidence: 0.78 + Math.random() * 0.15,
            location: {
                x: 40 + Math.random() * 30,
                y: 40 + Math.random() * 30
            },
            description: 'Área de necrosis tumoral'
        };
        features.push(necrosisFeature);

        suggestedAnnotations.push({
            id: `suggestion_necrosis_${i}_${Date.now()}`,
            featureId: necrosisFeature.id,
            type: 'circle',
            color: '#f59e0b',
            coordinates: {
                x1: necrosisFeature.location.x,
                y1: necrosisFeature.location.y,
                x2: necrosisFeature.location.x + 10,
                y2: necrosisFeature.location.y + 10
            },
            label: 'Necrosis',
            confidence: necrosisFeature.confidence,
            accepted: false,
            rejected: false
        });
    }

    // Detect atypical cells (always 1-2)
    const atypicalCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < atypicalCount; i++) {
        const atypicalFeature = {
            id: `atypical_${i}_${Date.now()}`,
            type: 'atypical_cells',
            name: 'Células Atípicas',
            confidence: 0.82 + Math.random() * 0.12,
            location: {
                x: 30 + Math.random() * 40,
                y: 30 + Math.random() * 40
            },
            description: 'Células con atipia nuclear'
        };
        features.push(atypicalFeature);

        suggestedAnnotations.push({
            id: `suggestion_atypical_${i}_${Date.now()}`,
            featureId: atypicalFeature.id,
            type: 'rectangle',
            color: '#8b5cf6',
            coordinates: {
                x1: atypicalFeature.location.x - 5,
                y1: atypicalFeature.location.y - 5,
                x2: atypicalFeature.location.x + 5,
                y2: atypicalFeature.location.y + 5
            },
            label: 'Células Atípicas',
            confidence: atypicalFeature.confidence,
            accepted: false,
            rejected: false
        });
    }

    if (isIHC) {
        features.push({
            id: `positive_staining_${Date.now()}`,
            type: 'positive_staining',
            name: 'Tinción Positiva',
            confidence: 0.88,
            location: { x: 50, y: 50 },
            description: 'Área con tinción positiva intensa'
        });
    }

    if (isMacro) {
        features.push({
            id: `lesion_${Date.now()}`,
            type: 'lesion',
            name: 'Lesión Macroscópica',
            confidence: 0.82,
            location: { x: 45, y: 45 },
            description: 'Área de interés macroscópico'
        });
    }

    // Generate diagnostic suggestions
    const diagnosticSuggestions = generateDiagnosticSuggestions(features);

    // Generate quality metrics
    const qualityMetrics = {
        staining: {
            score: 0.80 + Math.random() * 0.15,
            issues: Math.random() > 0.7 ? ['Tinción irregular en bordes'] : []
        },
        focus: {
            score: 0.85 + Math.random() * 0.12,
            issues: Math.random() > 0.8 ? ['Leve desenfoque en región superior'] : []
        },
        artifacts: {
            detected: Math.random() > 0.7,
            types: Math.random() > 0.7 ? ['Pliegue de tejido'] : []
        }
    };

    // Generate heatmap
    const heatmap = generateHeatmap(features);

    return {
        imageId: image.id,
        analyzedAt: new Date().toISOString(),
        status: 'complete',
        features,
        suggestedAnnotations,
        diagnosticSuggestions,
        qualityMetrics,
        heatmap,
        modelVersion: '1.0.0-demo',
        processingTime: AI_ANALYSIS_TIME
    };
};

/**
 * Generate diagnostic suggestions based on detected features
 */
const generateDiagnosticSuggestions = (features) => {
    const suggestions = [];

    const mitoticCount = features.filter(f => f.type === 'mitotic_figure').length;
    const hasNecrosis = features.some(f => f.type === 'necrosis');
    const atypicalCount = features.filter(f => f.type === 'atypical_cell').length;

    if (mitoticCount >= 3 && hasNecrosis) {
        suggestions.push({
            diagnosis: 'Neoplasia de Alto Grado',
            confidence: 0.75,
            supportingFeatures: features.filter(f =>
                f.type === 'mitotic_figure' || f.type === 'necrosis'
            ).map(f => f.id),
            reasoning: `Múltiples figuras mitóticas (${mitoticCount}) y presencia de necrosis sugieren proceso neoplásico de alto grado.`
        });
    }

    if (atypicalCount >= 2) {
        suggestions.push({
            diagnosis: 'Displasia Moderada a Severa',
            confidence: 0.68,
            supportingFeatures: features.filter(f => f.type === 'atypical_cell').map(f => f.id),
            reasoning: `Presencia de células atípicas con alteraciones nucleares.`
        });
    }

    if (mitoticCount === 0 && !hasNecrosis && atypicalCount === 0) {
        suggestions.push({
            diagnosis: 'Tejido Benigno',
            confidence: 0.82,
            supportingFeatures: [],
            reasoning: 'No se detectaron características de malignidad significativas.'
        });
    }

    return suggestions;
};

/**
 * Generate heatmap data
 */
const generateHeatmap = (features) => {
    const width = 50;
    const height = 50;
    const data = Array(height).fill(0).map(() => Array(width).fill(0));

    // Add heat around detected features with larger radius and higher intensity
    features.forEach(feature => {
        if (!feature.location) return;

        const centerX = Math.floor((feature.location.x / 100) * width);
        const centerY = Math.floor((feature.location.y / 100) * height);
        const radius = 8; // Increased from 5 to 8 for better visibility
        const baseIntensity = feature.confidence || 0.5;

        for (let y = Math.max(0, centerY - radius); y < Math.min(height, centerY + radius); y++) {
            for (let x = Math.max(0, centerX - radius); x < Math.min(width, centerX + radius); x++) {
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (distance <= radius) {
                    // Use exponential falloff for more dramatic visualization
                    const falloff = Math.pow(1 - distance / radius, 2);
                    const heatValue = baseIntensity * falloff * 1.5; // Boost intensity by 1.5x
                    data[y][x] = Math.max(data[y][x], Math.min(1, heatValue));
                }
            }
        }
    });

    // Add some random background heat for realism (very low intensity)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[y][x] === 0 && Math.random() > 0.95) {
                data[y][x] = Math.random() * 0.15; // Low background noise
            }
        }
    }

    console.log('🔥 Heatmap generated:', {
        width,
        height,
        maxValue: Math.max(...data.flat()),
        minValue: Math.min(...data.flat()),
        avgValue: data.flat().reduce((a, b) => a + b, 0) / (width * height)
    });

    return {
        data,
        width,
        height
    };
};

/**
 * Get feature type label in Spanish
 */
export const getFeatureTypeLabel = (type) => {
    const labels = {
        'mitotic_figure': 'Figura Mitótica',
        'necrosis': 'Necrosis',
        'atypical_cell': 'Célula Atípica',
        'positive_staining': 'Tinción Positiva',
        'inflammatory_cell': 'Célula Inflamatoria',
        'vascular_invasion': 'Invasión Vascular',
        'lesion': 'Lesión'
    };
    return labels[type] || type;
};

/**
 * Get confidence level label and color
 */
export const getConfidenceLevel = (confidence) => {
    if (confidence >= 0.9) return { label: 'Muy Alta', color: 'text-green-600', bg: 'bg-green-100' };
    if (confidence >= 0.75) return { label: 'Alta', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (confidence >= 0.6) return { label: 'Media', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Baja', color: 'text-orange-600', bg: 'bg-orange-100' };
};
