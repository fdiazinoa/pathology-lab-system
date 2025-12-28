import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, FileText, Images } from 'lucide-react';
import Button from '../components/Button';
import MicroscopyEditor from '../components/microscopy/MicroscopyEditor';
import ImageViewer from '../components/microscopy/ImageViewer';
import AIPanel from '../components/microscopy/AIPanel';
import RegionsPanel from '../components/microscopy/RegionsPanel';
import { useData } from '../services/DataContext';
import { generateHeatmapData, validateHistologyImage } from '../services/aiService';

const MicroscopyModule = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getCase, updateCase, addImage, settings, currentUser } = useData();

    // Load case data
    const caseData = getCase(id);

    const [activeImage, setActiveImage] = useState(null);
    const [microscopyData, setMicroscopyData] = useState({
        architecture: '',
        pattern: '',
        cytology: '',
        stroma: '',
        mitosis: '',
        necrosis: '',
        infiltration: '',
        differential: '',
        ihq: ''
    });

    // Heatmap State
    const [heatmapData, setHeatmapData] = useState([]);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState(null);

    // Initialize data if exists
    useEffect(() => {
        if (caseData) {
            // In a real app, we would parse the existing text or load structured data
            // For now, we'll start empty or load if we saved structured data before
            if (caseData.microscopyStructured) {
                setMicroscopyData(caseData.microscopyStructured);
            }
            // Load images from centralized storage
            if (caseData.images && caseData.images.length > 0 && !activeImage) {
                const microImages = caseData.images.filter(img => img.moduleOrigin === 'microscopy');
                if (microImages.length > 0) {
                    setActiveImage(microImages[0]);
                }
            }
        }
    }, [caseData]);

    // Generate Heatmap when toggled ON for the first time
    useEffect(() => {
        if (showHeatmap && activeImage && heatmapData.length === 0) {
            const loadHeatmap = async () => {
                const data = await generateHeatmapData(activeImage);
                setHeatmapData(data);
            };
            loadHeatmap();
        }
    }, [showHeatmap, activeImage]);

    // Reset heatmap when image changes
    useEffect(() => {
        setHeatmapData([]);
        setShowHeatmap(false);
    }, [activeImage]);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validFiles = [];
        for (const file of files) {
            // Skip AI validation if disabled
            if (settings?.aiEnabled) {
                const validation = await validateHistologyImage(file, settings?.openaiApiKey);
                if (!validation.isValid) {
                    alert(`Archivo rechazado (${file.name}): ${validation.reason}`);
                    continue;
                }
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        const newImages = await Promise.all(validFiles.map(async (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    // Add to centralized image storage
                    const imageData = {
                        url: reader.result,
                        name: file.name,
                        type: 'micro_he',
                        moduleOrigin: 'microscopy',
                        size: file.size
                    };
                    const savedImage = addImage(id, imageData);
                    resolve(savedImage);
                };
                reader.readAsDataURL(file);
            });
        }));

        // Set the first new image as active if none was active
        if (!activeImage && newImages.length > 0) {
            setActiveImage(newImages[0]);
        }
    };

    const handleSave = () => {
        const logEntry = {
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            action: 'Modificación de Microscopía',
            details: 'Se actualizaron los datos microscópicos estructurados.'
        };

        updateCase({
            ...caseData,
            microscopyStructured: microscopyData,
            microscopy: generateText(microscopyData), // Sync to main report field
            auditLogs: [...(caseData.auditLogs || []), logEntry]
        });
        alert('Datos de microscopía guardados y sincronizados con el informe.');
    };

    const handleFinalize = () => {
        // Logic to update status or notify
        navigate(`/cases/${id}/edit`);
    };

    const generateText = (data) => {
        // Simple generation logic
        const parts = [];
        if (data.architecture) parts.push(`Arquitectura: ${data.architecture}.`);
        if (data.pattern) parts.push(`Patrón: ${data.pattern}.`);
        if (data.cytology) parts.push(`Citología: ${data.cytology}.`);
        if (data.stroma) parts.push(`Estroma: ${data.stroma}.`);
        if (data.mitosis) parts.push(`Actividad mitótica: ${data.mitosis}.`);
        if (data.necrosis) parts.push(`Necrosis: ${data.necrosis}.`);
        if (data.infiltration) parts.push(`Infiltración: ${data.infiltration}.`);
        if (data.differential) parts.push(`Diagnósticos diferenciales: ${data.differential}.`);
        if (data.ihq) parts.push(`IHQ sugerida: ${data.ihq}.`);
        return parts.join(' ');
    };

    const handleRegionClick = (region) => {
        setSelectedRegion(region);
        // Logic to center image on region would go here (passed to ImageViewer via activeImage prop update or context)
        // For now, we just select it in the panel
    };

    if (!caseData) return <div>Cargando caso...</div>;

    // Get microscopy images from centralized storage
    const microscopyImages = caseData.images ? caseData.images.filter(img => img.moduleOrigin === 'microscopy') : [];

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/cases/${id}/edit`)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Módulo de Microscopía</h1>
                        <p className="text-xs text-gray-500">{caseData.id} - {caseData.organ}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/cases/${id}/images`)}>
                        <Images size={18} className="mr-2" />
                        Ver Galería
                    </Button>
                    <Button variant="secondary" onClick={handleSave}>
                        <Save size={18} className="mr-2" />
                        Guardar Borrador
                    </Button>
                    <Button onClick={handleFinalize}>
                        <CheckCircle size={18} className="mr-2" />
                        Finalizar y Volver
                    </Button>
                </div>
            </div>

            {/* Main Content - 3 Columns */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Editor */}
                <div className="w-1/4 min-w-[350px] bg-white border-r border-gray-200 overflow-y-auto">
                    <MicroscopyEditor
                        data={microscopyData}
                        onChange={setMicroscopyData}
                        organ={caseData.organ}
                    />
                </div>

                {/* Center: Image Viewer */}
                <div className="flex-1 bg-gray-900 relative overflow-hidden flex flex-col">
                    <ImageViewer
                        images={caseData.images || []}
                        activeImage={activeImage}
                        setActiveImage={setActiveImage}
                        onUpload={handleUpload}
                        heatmapData={heatmapData}
                        showHeatmap={showHeatmap}
                        setShowHeatmap={setShowHeatmap}
                        onRegionClick={handleRegionClick}
                        selectedRegion={selectedRegion}
                        aiEnabled={settings?.aiEnabled}
                    />
                </div>

                {/* Right: AI Panel or Regions Panel */}
                {settings?.aiEnabled && (
                    <div className="w-1/4 min-w-[300px] bg-white border-l border-gray-200 overflow-y-auto">
                        {showHeatmap ? (
                            <RegionsPanel
                                regions={heatmapData}
                                onRegionClick={handleRegionClick}
                                onClose={() => setShowHeatmap(false)}
                            />
                        ) : (
                            <AIPanel
                                activeImage={activeImage}
                                microscopyData={microscopyData}
                                showHeatmap={showHeatmap}
                                onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
                                onUpdateData={(newData) => setMicroscopyData({ ...microscopyData, ...newData })}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MicroscopyModule;
