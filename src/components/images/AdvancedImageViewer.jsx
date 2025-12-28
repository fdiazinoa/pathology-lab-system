import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Maximize, ChevronLeft, ChevronRight, ExternalLink, FileCheck, Sun, Moon, Edit3, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import ImageAnnotationTools from './ImageAnnotationTools';
import AnnotationLayer from './AnnotationLayer';
import AIAnalysisPanel from './AIAnalysisPanel';
import AIHeatmapOverlay from './AIHeatmapOverlay';
import { getImageTypeLabel, getModuleOriginLabel, getModuleRoute, formatImageSize } from '../../services/imageUtils';
import { analyzeGalleryImage } from '../../services/imageAIService';

const AdvancedImageViewer = ({ image, images, caseId, onClose, onNext, onPrev, onToggleReport, onDelete, onSaveAnnotations }) => {
    const navigate = useNavigate();
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    // Viewer state
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Annotation state
    const [showAnnotations, setShowAnnotations] = useState(false);
    const [activeTool, setActiveTool] = useState(null);
    const [activeColor, setActiveColor] = useState('#ef4444');
    const [annotations, setAnnotations] = useState(image.annotations || []);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentAnnotation, setCurrentAnnotation] = useState(null);

    // AI state
    const [showAI, setShowAI] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Current image index
    const currentIndex = images.findIndex(img => img.id === image.id);
    const hasNext = currentIndex < images.length - 1;
    const hasPrev = currentIndex > 0;

    // Reset view when image changes
    useEffect(() => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
        setBrightness(100);
        setContrast(100);
        setAnnotations(image.annotations || []);
        setActiveTool(null);
        setShowAnnotations(false);
        setAiAnalysis(null);
        setShowAI(false);
        setShowHeatmap(false);
    }, [image.id]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts when typing in text input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape') {
                if (activeTool) {
                    setActiveTool(null);
                } else {
                    onClose();
                }
            }
            if (e.key === 'ArrowLeft' && hasPrev && !activeTool) onPrev();
            if (e.key === 'ArrowRight' && hasNext && !activeTool) onNext();
            if (e.key === '+' || e.key === '=') handleZoomIn();
            if (e.key === '-') handleZoomOut();
            if (e.key === 'r') handleRotate();
            if (e.key === 'f') toggleFullscreen();
            if (e.key === 'a') setShowAnnotations(prev => !prev);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasPrev, hasNext, zoom, rotation, activeTool]);

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
    const handleZoomFit = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Rotation
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    // Get relative coordinates for annotations
    const getRelativeCoordinates = (e) => {
        if (!imageRef.current) return { x: 0, y: 0 };
        const rect = imageRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    };

    // Annotation handlers
    const handleAnnotationMouseDown = (e) => {
        if (!activeTool || !imageRef.current) return;

        e.preventDefault();
        const coords = getRelativeCoordinates(e);

        if (activeTool === 'text') {
            const text = prompt('Ingresa el texto de la anotación:');
            if (text) {
                const newAnnotation = {
                    id: Date.now().toString(),
                    type: 'text',
                    text,
                    color: activeColor,
                    coordinates: { x: coords.x, y: coords.y }
                };
                setAnnotations(prev => [...prev, newAnnotation]);
            }
        } else {
            setIsDrawing(true);
            setCurrentAnnotation({
                id: Date.now().toString(),
                type: activeTool,
                color: activeColor,
                coordinates: {
                    x1: coords.x,
                    y1: coords.y,
                    x2: coords.x,
                    y2: coords.y
                }
            });
        }
    };

    const handleAnnotationMouseMove = (e) => {
        if (!isDrawing || !currentAnnotation || !imageRef.current) return;

        const coords = getRelativeCoordinates(e);
        setCurrentAnnotation(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                x2: coords.x,
                y2: coords.y
            }
        }));
    };

    const handleAnnotationMouseUp = () => {
        if (isDrawing && currentAnnotation) {
            setAnnotations(prev => [...prev, currentAnnotation]);
            setCurrentAnnotation(null);
            setIsDrawing(false);
        }
    };

    // Pan/drag (only when not in annotation mode)
    const handleMouseDown = (e) => {
        if (activeTool) {
            handleAnnotationMouseDown(e);
        } else if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (activeTool && isDrawing) {
            handleAnnotationMouseMove(e);
        } else if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        if (activeTool) {
            handleAnnotationMouseUp();
        } else {
            setIsDragging(false);
        }
    };

    // Fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Navigate to original module
    const handleOpenInModule = () => {
        if (image.moduleOrigin && image.moduleOrigin !== 'manual') {
            const route = getModuleRoute(caseId, image.moduleOrigin);
            navigate(route);
        }
    };

    // Annotation management
    const handleDeleteAnnotation = (annotationId) => {
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    };

    const handleClearAllAnnotations = () => {
        if (confirm('¿Estás seguro de eliminar todas las anotaciones?')) {
            setAnnotations([]);
        }
    };

    const handleSaveAnnotations = () => {
        if (onSaveAnnotations) {
            onSaveAnnotations(image.id, annotations);
        }
        alert('Anotaciones guardadas correctamente');
    };

    // Toggle annotation mode
    const toggleAnnotationMode = () => {
        setShowAnnotations(prev => !prev);
        if (!showAnnotations) {
            setActiveTool('arrow'); // Default tool
        } else {
            setActiveTool(null);
        }
    };

    // AI Analysis
    const handleAnalyzeWithAI = async () => {
        setShowAI(true);
        setIsAnalyzing(true);

        try {
            const analysis = await analyzeGalleryImage(image);
            setAiAnalysis(analysis);
        } catch (error) {
            console.error('AI Analysis Error:', error);
            alert('Error al analizar la imagen con IA');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAcceptSuggestion = (suggestion) => {
        // Add suggestion as annotation
        const newAnnotation = {
            id: suggestion.id,
            type: suggestion.type,
            color: suggestion.color,
            coordinates: suggestion.coordinates,
            text: suggestion.label
        };
        setAnnotations(prev => [...prev, newAnnotation]);

        // Mark suggestion as accepted
        setAiAnalysis(prev => ({
            ...prev,
            suggestedAnnotations: prev.suggestedAnnotations.map(s =>
                s.id === suggestion.id ? { ...s, accepted: true } : s
            )
        }));
    };

    const handleRejectSuggestion = (suggestionId) => {
        setAiAnalysis(prev => ({
            ...prev,
            suggestedAnnotations: prev.suggestedAnnotations.map(s =>
                s.id === suggestionId ? { ...s, rejected: true } : s
            )
        }));
    };

    const toggleHeatmap = () => {
        setShowHeatmap(prev => !prev);
    };

    // Convert AI analysis to heatmap regions format (like Microscopy)
    const heatmapRegions = React.useMemo(() => {
        if (!aiAnalysis || !showHeatmap) return [];

        // Use features from AI analysis to create regions
        if (aiAnalysis.features && aiAnalysis.features.length > 0) {
            return aiAnalysis.features.map((feature, index) => ({
                id: index + 1,
                x: feature.location.x,
                y: feature.location.y,
                radius: 12,
                probability: feature.confidence,
                finding: feature.name,
                description: feature.description
            }));
        }

        // Fallback demo regions
        return [
            {
                id: 1,
                x: 30,
                y: 40,
                radius: 15,
                probability: 0.95,
                finding: "Área de Alta Atención",
                description: "Región detectada por IA"
            },
            {
                id: 2,
                x: 60,
                y: 70,
                radius: 12,
                probability: 0.85,
                finding: "Área de Atención",
                description: "Región detectada por IA"
            },
            {
                id: 3,
                x: 75,
                y: 25,
                radius: 10,
                probability: 0.70,
                finding: "Área de Interés",
                description: "Región detectada por IA"
            }
        ];
    }, [aiAnalysis, showHeatmap]);

    // Image style
    const imageStyle = {
        transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
        cursor: activeTool ? 'crosshair' : (zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'),
        transition: (isDragging || isDrawing) ? 'none' : 'transform 0.2s ease-out',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Top Toolbar */}
            <div className="bg-black/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    >
                        <X size={20} />
                    </button>
                    <div className="text-white">
                        <h3 className="font-medium">{image.name}</h3>
                        <p className="text-xs text-gray-300">
                            {getImageTypeLabel(image.type)} • {getModuleOriginLabel(image.moduleOrigin)}
                            {currentIndex >= 0 && ` • ${currentIndex + 1} de ${images.length}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {image.moduleOrigin && image.moduleOrigin !== 'manual' && (
                        <Button size="sm" variant="secondary" onClick={handleOpenInModule}>
                            <ExternalLink size={16} className="mr-2" />
                            Abrir en {getModuleOriginLabel(image.moduleOrigin)}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant={showAI ? 'primary' : 'secondary'}
                        onClick={showAI ? () => setShowAI(false) : handleAnalyzeWithAI}
                    >
                        <Brain size={16} className="mr-2" />
                        {showAI ? 'Cerrar IA' : 'Analizar con IA'}
                    </Button>
                    <Button
                        size="sm"
                        variant={showAnnotations ? 'primary' : 'secondary'}
                        onClick={toggleAnnotationMode}
                    >
                        <Edit3 size={16} className="mr-2" />
                        {showAnnotations ? 'Cerrar Anotaciones' : 'Anotar'}
                    </Button>
                    {showAnnotations && annotations.length > 0 && (
                        <Button size="sm" variant="secondary" onClick={handleSaveAnnotations}>
                            <FileCheck size={16} className="mr-2" />
                            Guardar Anotaciones
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant={image.usedInReport ? 'primary' : 'secondary'}
                        onClick={() => onToggleReport(image.id, 'macro')}
                    >
                        <FileCheck size={16} className="mr-2" />
                        {image.usedInReport ? 'En Informe' : 'Agregar al Informe'}
                    </Button>
                </div>
            </div>

            {/* Main Viewer Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Image Viewer Container */}
                <div ref={viewerRef} className="flex-1 relative overflow-hidden flex items-center justify-center">
                    {/* Annotation Tools */}
                    {showAnnotations && (
                        <ImageAnnotationTools
                            activeTool={activeTool}
                            onToolChange={setActiveTool}
                            activeColor={activeColor}
                            onColorChange={setActiveColor}
                            annotations={annotations}
                            onDeleteAnnotation={handleDeleteAnnotation}
                            onClearAll={handleClearAllAnnotations}
                        />
                    )}

                    {/* Image Container with Annotations */}
                    <div className="relative">
                        <img
                            ref={imageRef}
                            src={image.url}
                            alt={image.name}
                            style={imageStyle}
                            onMouseDown={handleMouseDown}
                            draggable={false}
                            className="select-none"
                        />

                        {/* Annotation Layer */}
                        {showAnnotations && (
                            <AnnotationLayer
                                annotations={[...annotations, currentAnnotation].filter(Boolean)}
                                imageRef={imageRef}
                                zoom={zoom}
                                rotation={rotation}
                                position={position}
                            />
                        )}

                        {/* AI Heatmap Overlay */}
                        {showHeatmap && (
                            <AIHeatmapOverlay
                                data={heatmapRegions}
                                visible={showHeatmap}
                                scale={zoom}
                            />
                        )}
                    </div>

                    {/* Navigation Arrows */}
                    {hasPrev && (
                        <button
                            onClick={onPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                            <ChevronLeft size={32} />
                        </button>
                    )}
                    {hasNext && (
                        <button
                            onClick={onNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                            <ChevronRight size={32} />
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="bg-black/50 backdrop-blur-sm px-4 py-3 border-t border-white/10">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.25}
                            className="p-2 hover:bg-white/10 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ZoomOut size={20} />
                        </button>
                        <span className="text-white text-sm font-medium min-w-[60px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 5}
                            className="p-2 hover:bg-white/10 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ZoomIn size={20} />
                        </button>
                        <button
                            onClick={handleZoomFit}
                            className="px-3 py-1.5 hover:bg-white/10 rounded text-white text-sm transition-colors"
                        >
                            Ajustar
                        </button>
                    </div>

                    {/* Rotation & Fullscreen */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRotate}
                            className="p-2 hover:bg-white/10 rounded text-white transition-colors"
                            title="Rotar 90° (R)"
                        >
                            <RotateCw size={20} />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-white/10 rounded text-white transition-colors"
                            title="Pantalla completa (F)"
                        >
                            <Maximize size={20} />
                        </button>
                    </div>

                    {/* Brightness & Contrast */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Sun size={16} className="text-white" />
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={brightness}
                                onChange={(e) => setBrightness(Number(e.target.value))}
                                className="w-24"
                                title="Brillo"
                            />
                            <span className="text-white text-xs min-w-[35px]">{brightness}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Moon size={16} className="text-white" />
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={contrast}
                                onChange={(e) => setContrast(Number(e.target.value))}
                                className="w-24"
                                title="Contraste"
                            />
                            <span className="text-white text-xs min-w-[35px]">{contrast}%</span>
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="text-center mt-2">
                    <p className="text-xs text-gray-400">
                        Atajos: ← → (navegar) | +/- (zoom) | R (rotar) | F (pantalla completa) | A (anotar) | ESC (cerrar)
                    </p>
                </div>
            </div>

            {/* AI Analysis Panel - Absolute Overlay */}
            {showAI && (
                <div className="absolute left-0 top-0 bottom-0 z-30">
                    <AIAnalysisPanel
                        analysis={aiAnalysis}
                        isAnalyzing={isAnalyzing}
                        onAcceptSuggestion={handleAcceptSuggestion}
                        onRejectSuggestion={handleRejectSuggestion}
                        onToggleHeatmap={toggleHeatmap}
                        showHeatmap={showHeatmap}
                    />
                </div>
            )}

            {/* Metadata Sidebar (Optional - can be toggled) */}
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/70 backdrop-blur-sm border-l border-white/10 p-4 overflow-y-auto hidden lg:block">
                <h4 className="text-white font-bold mb-4">Información de la Imagen</h4>

                <div className="space-y-3 text-sm">
                    <div>
                        <p className="text-gray-400">Nombre</p>
                        <p className="text-white">{image.name}</p>
                    </div>

                    <div>
                        <p className="text-gray-400">Tipo</p>
                        <p className="text-white">{getImageTypeLabel(image.type)}</p>
                    </div>

                    <div>
                        <p className="text-gray-400">Módulo de Origen</p>
                        <p className="text-white">{getModuleOriginLabel(image.moduleOrigin)}</p>
                    </div>

                    {image.size && (
                        <div>
                            <p className="text-gray-400">Tamaño</p>
                            <p className="text-white">{formatImageSize(image.size)}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-gray-400">Fecha de Subida</p>
                        <p className="text-white">{new Date(image.uploadedAt).toLocaleString()}</p>
                    </div>

                    {image.tags && image.tags.length > 0 && (
                        <div>
                            <p className="text-gray-400 mb-1">Etiquetas</p>
                            <div className="flex flex-wrap gap-1">
                                {image.tags.map((tag, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-white/10 text-white text-xs rounded">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {image.usedInReport && (
                        <div>
                            <p className="text-gray-400">Estado</p>
                            <p className="text-green-400">✓ Incluida en informe ({image.reportSection})</p>
                        </div>
                    )}

                    {image.annotations && image.annotations.length > 0 && (
                        <div>
                            <p className="text-gray-400">Anotaciones</p>
                            <p className="text-white">{image.annotations.length} anotación{image.annotations.length !== 1 ? 'es' : ''}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedImageViewer;
