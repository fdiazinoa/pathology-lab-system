import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Package, Images } from 'lucide-react';
import Button from '../components/Button';
import MacroscopyEditor from '../components/macroscopy/MacroscopyEditor';
import MacroImageViewer from '../components/macroscopy/MacroImageViewer';
import MacroAIPanel from '../components/macroscopy/MacroAIPanel';
import { useData } from '../services/DataContext';

const MacroscopyModule = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getCase, updateCase, addImage, settings, currentUser } = useData();

    // Load case data
    const caseData = getCase(id);

    const [activeImage, setActiveImage] = useState(null);
    const [macroscopyData, setMacroscopyData] = useState({
        sampleType: '',
        fragmentCount: '',
        dimensions: '',
        color: '',
        consistency: '',
        margins: '',
        orientation: '',
        findings: '',
        lesions: '',
        observations: ''
    });

    // Initialize data if exists
    useEffect(() => {
        if (caseData) {
            if (caseData.macroscopyStructured) {
                setMacroscopyData(caseData.macroscopyStructured);
            }
            // Load images from centralized storage
            if (caseData.images && caseData.images.length > 0 && !activeImage) {
                // First try to load macroscopy-specific images
                const macroImages = caseData.images.filter(img => img.moduleOrigin === 'macroscopy');
                if (macroImages.length > 0) {
                    setActiveImage(macroImages[0]);
                } else if (caseData.images.length > 0) {
                    // If no macroscopy images, load any available image
                    setActiveImage(caseData.images[0]);
                }
            }
        }
    }, [caseData]);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        const newImages = await Promise.all(files.map(async file => {
            const url = await toBase64(file);
            // Add to centralized image storage
            const imageData = {
                url,
                name: file.name,
                type: 'macro',
                moduleOrigin: 'macroscopy',
                size: file.size
            };
            return addImage(id, imageData);
        }));

        if (!activeImage && newImages.length > 0) {
            setActiveImage(newImages[0]);
        }
    };

    const handleSave = () => {
        const generatedText = generateText(macroscopyData);

        const logEntry = {
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            action: 'Modificación de Macroscopía',
            details: 'Se actualizaron los datos macroscópicos estructurados.'
        };

        updateCase({
            ...caseData,
            macroscopyStructured: macroscopyData,
            macroscopy_text: generatedText,
            macroscopy: generatedText, // Sync to main report field
            auditLogs: [...(caseData.auditLogs || []), logEntry]
        });
        alert('Datos de macroscopía guardados y sincronizados con el informe.');
    };

    const handleFinalize = () => {
        const generatedText = generateText(macroscopyData);

        const logEntry = {
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            action: 'Finalización de Macroscopía',
            details: 'Módulo de macroscopía finalizado y enviado a procesamiento.'
        };

        updateCase({
            ...caseData,
            macroscopyStructured: macroscopyData,
            macroscopy_text: generatedText,
            macroscopy: generatedText,
            status: 'Procesamiento', // Update status
            auditLogs: [...(caseData.auditLogs || []), logEntry]
        });
        alert('Macroscopía finalizada. Caso enviado a Procesamiento Histológico.');
        navigate(`/cases/${id}/edit`);
    };

    const generateText = (data) => {
        const parts = [];
        if (data.sampleType) parts.push(`Se recibe ${data.sampleType}.`);
        if (data.fragmentCount) parts.push(`Consistente en ${data.fragmentCount} fragmento(s).`);
        if (data.dimensions) parts.push(`Dimensiones: ${data.dimensions}.`);
        if (data.color) parts.push(`Color: ${data.color}.`);
        if (data.consistency) parts.push(`Consistencia: ${data.consistency}.`);
        if (data.orientation) parts.push(`Orientación: ${data.orientation}.`);
        if (data.findings) parts.push(`Hallazgos: ${data.findings}.`);
        if (data.lesions) parts.push(`Lesiones: ${data.lesions}.`);
        if (data.margins) parts.push(`Márgenes: ${data.margins}.`);
        if (data.observations) parts.push(`Observaciones: ${data.observations}.`);
        return parts.join(' ');
    };

    if (!caseData) return <div>Cargando caso...</div>;

    // Get all case images (prioritize macroscopy-tagged, but show all)
    const macroscopyImages = caseData.images || [];

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/cases/${id}/edit`)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Módulo de Macroscopía</h1>
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
                    <Button onClick={handleFinalize} className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Package size={18} className="mr-2" />
                        Enviar a Procesamiento
                    </Button>
                </div>
            </div>

            {/* Main Content - 3 Columns */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Editor */}
                <div className="w-1/4 min-w-[350px] bg-white border-r border-gray-200 overflow-y-auto">
                    <MacroscopyEditor
                        data={macroscopyData}
                        onChange={setMacroscopyData}
                        organ={caseData.organ}
                    />
                </div>

                {/* Center: Image Viewer */}
                <div className="flex-1 bg-gray-900 relative overflow-hidden flex flex-col">
                    <MacroImageViewer
                        images={caseData.images || []}
                        activeImage={activeImage}
                        setActiveImage={setActiveImage}
                        onUpload={handleUpload}
                    />
                </div>

                {/* Right: AI Panel */}
                {settings?.aiEnabled && (
                    <div className="w-1/4 min-w-[300px] bg-white border-l border-gray-200 overflow-y-auto">
                        <MacroAIPanel
                            activeImage={activeImage}
                            macroscopyData={macroscopyData}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MacroscopyModule;
