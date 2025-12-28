import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Plus, Microscope, Images } from 'lucide-react';
import Button from '../components/Button';
import { useData } from '../services/DataContext';
import BiomarkerCard from '../components/ihc/BiomarkerCard';
import IHCViewer from '../components/ihc/IHCViewer';
import IHCAIPanel from '../components/ihc/IHCAIPanel';
import BiomarkerEditModal from '../components/ihc/BiomarkerEditModal';

const IHCModule = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getCase, updateCase, currentUser } = useData();
    const caseData = getCase(id);

    const [markers, setMarkers] = useState([]);
    const [activeMarker, setActiveMarker] = useState(null);
    const [heImage, setHeImage] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMarker, setEditingMarker] = useState(null);

    // Load data
    useEffect(() => {
        if (caseData) {
            if (caseData.ihc_results) {
                setMarkers(caseData.ihc_results);
            }
            if (caseData.images && caseData.images.length > 0) {
                setHeImage(caseData.images[0]); // Default to first image as H&E reference
            }
        }
    }, [caseData]);

    // Set active marker if none selected but markers exist
    useEffect(() => {
        if (!activeMarker && markers.length > 0) {
            setActiveMarker(markers[0]);
        }
    }, [markers]);

    const handleAddMarker = () => {
        const newMarker = {
            id: Date.now().toString(),
            name: '',
            result: 'Pendiente',
            intensity: '',
            percentage: 0,
            pattern: '',
            control: 'Adecuado',
            notes: '',
            imageUrl: null
        };
        setEditingMarker(newMarker);
        setIsEditModalOpen(true);
    };

    const handleEditMarker = (marker) => {
        setEditingMarker(marker);
        setIsEditModalOpen(true);
    };

    const handleSaveMarker = (markerToSave) => {
        let updatedMarkers;
        // Check if it's a new marker (not in list) or existing
        const exists = markers.find(m => m.id === markerToSave.id);

        if (exists) {
            updatedMarkers = markers.map(m => m.id === markerToSave.id ? markerToSave : m);
        } else {
            updatedMarkers = [...markers, markerToSave];
        }

        setMarkers(updatedMarkers);
        setActiveMarker(markerToSave);
        setIsEditModalOpen(false);
        setEditingMarker(null);
    };

    const handleDeleteMarker = (id) => {
        const updatedMarkers = markers.filter(m => m.id !== id);
        setMarkers(updatedMarkers);
        if (activeMarker?.id === id) {
            setActiveMarker(updatedMarkers.length > 0 ? updatedMarkers[0] : null);
        }
    };

    const handleSave = () => {
        // Generate summary text
        const summary = markers.map(m => `${m.name}: ${m.result} ${m.result === 'Positivo' ? `(${m.percentage}%, ${m.intensity})` : ''}`).join('\n');

        const logEntry = {
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            action: 'Modificación de Inmunohistoquímica',
            details: `Se actualizaron los resultados de IHQ (${markers.length} marcadores).`
        };

        updateCase({
            ...caseData,
            ihc_results: markers,
            ihc: summary, // Sync to main report field
            auditLogs: [...(caseData.auditLogs || []), logEntry]
        });
        alert('Resultados de IHQ guardados.');
    };

    const handleFinalize = () => {
        const summary = markers.map(m => `${m.name}: ${m.result} ${m.result === 'Positivo' ? `(${m.percentage}%, ${m.intensity})` : ''}`).join('\n');

        const logEntry = {
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            action: 'Finalización de Inmunohistoquímica',
            details: 'Módulo de IHQ finalizado.'
        };

        updateCase({
            ...caseData,
            ihc_results: markers,
            ihc: summary,
            auditLogs: [...(caseData.auditLogs || []), logEntry]
        });
        navigate(`/cases/${id}`);
    };

    if (!caseData) return <div>Cargando caso...</div>;

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/cases/${id}`)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Microscope size={20} className="text-purple-600" />
                            Módulo de Inmunohistoquímica
                        </h1>
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
                        Guardar
                    </Button>
                    <Button onClick={handleFinalize}>
                        <CheckCircle size={18} className="mr-2" />
                        Finalizar y Volver
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Biomarker List */}
                <div className="w-1/4 min-w-[300px] bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700">Biomarcadores</h3>
                        <Button size="sm" onClick={handleAddMarker}>
                            <Plus size={16} className="mr-1" /> Agregar
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {markers.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                No hay marcadores agregados.
                            </div>
                        ) : (
                            markers.map(marker => (
                                <BiomarkerCard
                                    key={marker.id}
                                    marker={marker}
                                    isSelected={activeMarker?.id === marker.id}
                                    onSelect={setActiveMarker}
                                    onEdit={handleEditMarker}
                                    onDelete={handleDeleteMarker}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Center: Viewer */}
                <div className="flex-1 bg-gray-900 relative">
                    <IHCViewer
                        activeMarker={activeMarker}
                        heImage={heImage}
                    />
                </div>

                {/* Right: AI Panel */}
                <div className="w-1/4 min-w-[300px] bg-white border-l border-gray-200 overflow-y-auto">
                    <IHCAIPanel
                        activeMarker={activeMarker}
                        onUpdateMarker={handleSaveMarker}
                    />
                </div>
            </div>

            <BiomarkerEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                marker={editingMarker}
                onSave={handleSaveMarker}
            />
        </div>
    );
};

export default IHCModule;
