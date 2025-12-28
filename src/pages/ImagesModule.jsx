import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, FileCheck, Download, Grid, List } from 'lucide-react';
import { useData } from '../services/DataContext';
import Button from '../components/Button';
import ImageGallery from '../components/images/ImageGallery';
import ImageFilters from '../components/images/ImageFilters';
import AdvancedImageUploader from '../components/images/AdvancedImageUploader';
import AdvancedImageViewer from '../components/images/AdvancedImageViewer';
import { applyFilters, exportGalleryAsZip } from '../services/imageUtils';

const ImagesModule = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getCase, addImage, deleteImage, bulkDeleteImages, toggleImageInReport, updateImage } = useData();

    const caseData = getCase(id);
    const images = caseData?.images || [];

    const [selectedImages, setSelectedImages] = useState([]);
    const [showUploader, setShowUploader] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [viewerImage, setViewerImage] = useState(null);
    const [filters, setFilters] = useState({
        type: 'all',
        module: 'all',
        inReport: null,
        startDate: '',
        endDate: '',
        tagSearch: ''
    });

    // Apply filters to images
    const filteredImages = useMemo(() => {
        return applyFilters(images, filters);
    }, [images, filters]);

    // Handle image selection toggle
    const handleSelectImage = (imageId) => {
        setSelectedImages(prev => {
            if (prev.includes(imageId)) {
                return prev.filter(id => id !== imageId);
            } else {
                return [...prev, imageId];
            }
        });
    };

    // Handle image upload
    const handleUpload = (newImages) => {
        newImages.forEach(imageData => {
            addImage(id, imageData);
        });
        setShowUploader(false);
    };

    // Handle image deletion
    const handleDeleteImage = (imageId) => {
        if (confirm('¿Estás seguro de eliminar esta imagen?')) {
            deleteImage(id, imageId);
            setSelectedImages(prev => prev.filter(id => id !== imageId));
        }
    };

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (selectedImages.length === 0) {
            alert('Selecciona al menos una imagen');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar ${selectedImages.length} imagen${selectedImages.length !== 1 ? 'es' : ''}?`)) {
            bulkDeleteImages(id, selectedImages);
            setSelectedImages([]);
        }
    };

    // Handle add to report
    const handleAddToReport = () => {
        if (selectedImages.length === 0) {
            alert('Selecciona al menos una imagen');
            return;
        }

        const section = prompt('¿En qué sección del informe? (macro/micro/ihc)', 'macro');
        if (!section) return;

        if (!['macro', 'micro', 'ihc'].includes(section.toLowerCase())) {
            alert('Sección inválida. Usa: macro, micro o ihc');
            return;
        }

        selectedImages.forEach(imageId => {
            toggleImageInReport(id, imageId, section.toLowerCase());
        });

        setSelectedImages([]);
        alert(`${selectedImages.length} imagen${selectedImages.length !== 1 ? 'es agregadas' : ' agregada'} al informe`);
    };

    // Handle export
    const handleExport = () => {
        const imagesToExport = selectedImages.length > 0
            ? images.filter(img => selectedImages.includes(img.id))
            : filteredImages;

        exportGalleryAsZip(id, imagesToExport);
    };

    // Clear filters
    const handleClearFilters = () => {
        setFilters({
            type: 'all',
            module: 'all',
            inReport: null,
            startDate: '',
            endDate: '',
            tagSearch: ''
        });
    };

    // Handle view image - open advanced viewer
    const handleViewImage = (image) => {
        setViewerImage(image);
    };

    // Viewer navigation
    const handleViewerNext = () => {
        const currentIndex = filteredImages.findIndex(img => img.id === viewerImage.id);
        if (currentIndex < filteredImages.length - 1) {
            setViewerImage(filteredImages[currentIndex + 1]);
        }
    };

    const handleViewerPrev = () => {
        const currentIndex = filteredImages.findIndex(img => img.id === viewerImage.id);
        if (currentIndex > 0) {
            setViewerImage(filteredImages[currentIndex - 1]);
        }
    };

    // Handle save annotations
    const handleSaveAnnotations = (imageId, annotations) => {
        updateImage(id, imageId, { annotations });
    };

    if (!caseData) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-gray-500">Cargando caso...</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate(`/cases/${id}`)}>
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Galería de Imágenes</h1>
                            <p className="text-sm text-gray-500">
                                {caseData.id} - {caseData.organ} • {filteredImages.length} imagen{filteredImages.length !== 1 ? 'es' : ''}
                                {selectedImages.length > 0 && ` • ${selectedImages.length} seleccionada${selectedImages.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex border border-gray-300 rounded-md overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <Button variant="secondary" onClick={() => setShowUploader(true)}>
                            <Upload size={18} className="mr-2" />
                            Subir Imágenes
                        </Button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedImages.length > 0 && (
                    <div className="mt-4 flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <span className="text-sm font-medium text-primary">
                            {selectedImages.length} seleccionada{selectedImages.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex-1" />
                        <Button size="sm" variant="secondary" onClick={handleAddToReport}>
                            <FileCheck size={16} className="mr-2" />
                            Agregar al Informe
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleExport}>
                            <Download size={16} className="mr-2" />
                            Exportar
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                            <Trash2 size={16} className="mr-2" />
                            Eliminar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedImages([])}>
                            Cancelar
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Filters Sidebar */}
                <div className="w-64 flex-shrink-0">
                    <ImageFilters
                        filters={filters}
                        onFilterChange={setFilters}
                        onClearFilters={handleClearFilters}
                    />
                </div>

                {/* Gallery */}
                <div className="flex-1 overflow-y-auto p-6">
                    <ImageGallery
                        images={filteredImages}
                        selectedImages={selectedImages}
                        onSelectImage={handleSelectImage}
                        onViewImage={handleViewImage}
                        onDeleteImage={handleDeleteImage}
                        viewMode={viewMode}
                    />
                </div>
            </div>

            {/* Upload Modal */}
            {showUploader && (
                <AdvancedImageUploader
                    onUpload={handleUpload}
                    onClose={() => setShowUploader(false)}
                />
            )}

            {/* Advanced Image Viewer */}
            {viewerImage && (
                <AdvancedImageViewer
                    image={viewerImage}
                    images={filteredImages}
                    caseId={id}
                    onClose={() => setViewerImage(null)}
                    onNext={handleViewerNext}
                    onPrev={handleViewerPrev}
                    onToggleReport={toggleImageInReport}
                    onDelete={handleDeleteImage}
                    onSaveAnnotations={handleSaveAnnotations}
                />
            )}
        </div>
    );
};

export default ImagesModule;
