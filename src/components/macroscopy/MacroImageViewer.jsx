import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, RotateCw, Type } from 'lucide-react';

const MacroImageViewer = ({ images, activeImage, setActiveImage, onUpload }) => {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [markers, setMarkers] = useState([]); // {x, y, label}
    const [isAddingMarker, setIsAddingMarker] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        // Only reset if the image ID changes, not just the object reference
        if (activeImage?.id) {
            // Optional: persist zoom per image if we wanted, but for now just don't reset if it's the same image
            // Actually, we WANT to reset if it's a new image.
            // But we want to avoid resetting if it's a re-render of the same image.
            // So we depend on ID.
            setScale(1);
            setRotation(0);
            setPosition({ x: 0, y: 0 });
            setMarkers([]);
        }
    }, [activeImage?.id]);

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.5, scale + delta), 4);
        setScale(newScale);
    };

    const handleMouseDown = (e) => {
        if (isAddingMarker) {
            const rect = containerRef.current.getBoundingClientRect();

            // 1. Click coordinates relative to container top-left
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // 2. Center of container
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // 3. Vector from center (accounting for pan)
            // The visual center of the image is at (centerX + position.x, centerY + position.y)
            const vecX = clickX - (centerX + position.x);
            const vecY = clickY - (centerY + position.y);

            // 4. Scale adjustment
            const unscaledX = vecX / scale;
            const unscaledY = vecY / scale;

            // 5. Rotation adjustment (inverse rotation)
            // Angle in radians
            const rad = -rotation * (Math.PI / 180);
            const finalX = unscaledX * Math.cos(rad) - unscaledY * Math.sin(rad);
            const finalY = unscaledX * Math.sin(rad) + unscaledY * Math.cos(rad);

            setMarkers([...markers, { x: finalX, y: finalY, label: markers.length + 1 }]);
            setIsAddingMarker(false);
            return;
        }

        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleUploadClick = () => {
        document.getElementById('macro-upload-input').click();
    };

    const handleToolbarClick = (e, action) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };

    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [activeImage]);

    if (!activeImage || imageError) {
        return (
            <div className="flex-1 flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-900">
                    <p className="mb-4">{imageError ? 'Error al cargar la imagen (URL caducada)' : 'No hay imágenes macroscópicas'}</p>
                    <button
                        onClick={handleUploadClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Subir Fotos
                    </button>
                    <input
                        id="macro-upload-input"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={onUpload}
                    />
                </div>
                {/* Show strip even if error, so user can pick another image */}
                {images.length > 0 && (
                    <div className="h-24 bg-gray-800 border-t border-gray-700 p-2 flex gap-2 overflow-x-auto z-10 items-center w-full">
                        {images.map((img, idx) => (
                            <div
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`relative min-w-[80px] h-full cursor-pointer rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === img ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-80'}`}
                            >
                                <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                            </div>
                        ))}
                        <label className="min-w-[80px] h-full flex flex-col items-center justify-center bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-500 text-gray-400 hover:text-white flex-shrink-0">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={onUpload}
                            />
                            <span className="text-2xl font-light">+</span>
                            <span className="text-[10px]">Subir</span>
                        </label>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full relative">
            {/* Main Canvas */}
            <div
                ref={containerRef}
                className={`flex-1 overflow-hidden bg-gray-900 relative z-0 ${isAddingMarker ? 'cursor-crosshair' : 'cursor-move'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        transformOrigin: 'center',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}
                >
                    <img
                        src={activeImage.url}
                        alt="Macroscopy"
                        className="max-w-full max-h-full object-contain pointer-events-none select-none shadow-2xl"
                        onError={() => setImageError(true)}
                    />

                    {/* Markers Layer - simplified positioning */}
                    {markers.map((m, idx) => (
                        <div
                            key={idx}
                            className="absolute w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-md pointer-events-none"
                            style={{
                                left: '50%', // Centered relative to container
                                top: '50%',
                                transform: `translate(${m.x}px, ${m.y}px)` // Offset from center
                            }}
                        >
                            {m.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Toolbar - Moved after Canvas to ensure stacking on top */}
            <div
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full px-4 py-2 flex gap-4 text-white z-[100] items-center shadow-xl border border-white/10 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <button type="button" onClick={(e) => handleToolbarClick(e, () => setScale(s => Math.max(0.5, s - 0.5)))} className="hover:text-blue-400 transition-colors p-1"><ZoomOut size={20} /></button>
                <span className="text-sm font-mono min-w-[3ch] text-center select-none">{Math.round(scale * 100)}%</span>
                <button type="button" onClick={(e) => handleToolbarClick(e, () => setScale(s => Math.min(4, s + 0.5)))} className="hover:text-blue-400 transition-colors p-1"><ZoomIn size={20} /></button>
                <div className="w-px bg-white/20 mx-1"></div>
                <button type="button" onClick={(e) => handleToolbarClick(e, () => setRotation(r => r + 90))} className="hover:text-blue-400 transition-colors p-1" title="Rotar"><RotateCw size={20} /></button>
                <div className="w-px bg-white/20 mx-1"></div>
                <button
                    type="button"
                    onClick={(e) => handleToolbarClick(e, () => setIsAddingMarker(!isAddingMarker))}
                    className={`hover:text-blue-400 transition-colors p-1 ${isAddingMarker ? 'text-blue-400' : ''}`}
                    title="Añadir Marcador Numérico"
                >
                    <Type size={20} />
                </button>
            </div>

            {/* Thumbnail Strip */}
            <div className="h-24 bg-gray-800 border-t border-gray-700 p-2 flex gap-2 overflow-x-auto z-10 items-center">
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`relative min-w-[80px] h-full cursor-pointer rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === img ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-80'}`}
                    >
                        <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                    </div>
                ))}

                <label className="min-w-[80px] h-full flex flex-col items-center justify-center bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-500 text-gray-400 hover:text-white flex-shrink-0">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={onUpload}
                    />
                    <span className="text-2xl font-light">+</span>
                    <span className="text-[10px]">Subir</span>
                </label>
            </div>
        </div>
    );
};

export default MacroImageViewer;
