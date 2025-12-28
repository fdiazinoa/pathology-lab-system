import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Maximize, SplitSquareHorizontal, Flame } from 'lucide-react';
import HeatmapOverlay from './HeatmapOverlay';

const ImageViewer = ({ images, activeImage, setActiveImage, onUpload, heatmapData, showHeatmap, setShowHeatmap, onRegionClick, selectedRegion }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Reset zoom/pan when image changes
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [activeImage]);

    // Handle external region click (center on region)
    useEffect(() => {
        if (selectedRegion && containerRef.current) {
            const { x, y } = selectedRegion; // Percentages (0-100)

            // Target scale for inspection
            const targetScale = 2.5;
            setScale(targetScale);

            // Calculate position to center the point (x%, y%)
            // If the image is centered in the container:
            // The point is at offset (x - 50)% of width and (y - 50)% of height from the center.
            // We need to move the image in the opposite direction.
            // We assume the image fills the container mostly (or at least the container dimensions are a good proxy for movement scale)

            const containerW = containerRef.current.offsetWidth;
            const containerH = containerRef.current.offsetHeight;

            // Calculate shift in pixels
            // If x=50, shift is 0. If x=0 (left), shift should be +50% of width * scale?
            // Let's trace: 
            // Center of container is (0,0) in our translation space.
            // Point P on image is at ( (x-50)/100 * W, (y-50)/100 * H ) relative to image center.
            // We want P to be at (0,0) after translation.
            // So NewPos = -P * Scale? (Since we translate then scale? No, usually scale applies to the object, then translate moves it? Or translate then scale?)
            // Our CSS: transform: translate(pos.x, pos.y) scale(scale)
            // This means: Translate the div by pos.x, pos.y. THEN scale it around the center.
            // So the point P (which is at vector V from center) will end up at Center + V*Scale.
            // We want Center + V*Scale = ScreenCenter.
            // Since we are translating relative to ScreenCenter (0,0) offset), we want:
            // (0,0) + V*Scale + Translation = (0,0)  => Translation = -V * Scale.

            // V = ( (x-50)/100 * W, (y-50)/100 * H )
            // So Translation = -1 * ( (x-50)/100 * W ) * Scale

            // Note: This assumes image width = container width. If object-contain makes it smaller, this is an approximation, but usually "good enough" to bring it into view.

            const newX = -1 * ((x - 50) / 100) * containerW * targetScale;
            const newY = -1 * ((y - 50) / 100) * containerH * targetScale;

            setPosition({ x: newX, y: newY });
        }
    }, [selectedRegion]);

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.5, scale + delta), 4);
        setScale(newScale);
    };

    const handleMouseDown = (e) => {
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
        document.getElementById('hidden-upload-input').click();
    };

    if (!activeImage) {
        return (
            <div className="flex-1 flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-900">
                    <p className="mb-4">No hay imágenes seleccionadas</p>
                    <button
                        onClick={handleUploadClick}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Subir Imágenes
                    </button>
                    <input
                        id="hidden-upload-input"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={onUpload}
                    />
                </div>
                {/* Still show strip to allow uploading via strip if preferred */}
                <div className="h-24 bg-gray-800 border-t border-gray-700 p-2 flex gap-2 overflow-x-auto z-10 items-center">
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
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex gap-4 text-white z-20 items-center">
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))} className="hover:text-blue-400"><ZoomOut size={20} /></button>
                <span className="text-sm font-mono min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(4, s + 0.5))} className="hover:text-blue-400"><ZoomIn size={20} /></button>
                <div className="w-px bg-white/20 mx-1"></div>
                <button onClick={() => setPosition({ x: 0, y: 0 })} className="hover:text-blue-400" title="Reset"><Move size={20} /></button>
                <div className="w-px bg-white/20 mx-1"></div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowHeatmap(!showHeatmap);
                    }}
                    className={`transition-colors flex items-center gap-2 ${showHeatmap ? 'text-orange-400' : 'hover:text-orange-400'}`}
                    title={showHeatmap ? "Ocultar Heatmap" : "Mostrar Heatmap de Áreas Sospechosas"}
                >
                    <Flame size={20} className={showHeatmap ? "fill-current" : ""} />
                    {showHeatmap && <span className="text-xs font-bold">ON</span>}
                </button>
            </div>

            {/* Main Canvas */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden bg-gray-900 relative cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        transformOrigin: 'center',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative' // Needed for absolute children
                    }}
                >
                    <div className="relative max-w-full max-h-full shadow-2xl">
                        <img
                            src={activeImage.url}
                            alt="Microscopy"
                            className="max-w-full max-h-full object-contain pointer-events-none select-none block"
                        />
                        {/* Heatmap Overlay - Positioned absolutely over the image */}
                        <HeatmapOverlay
                            data={heatmapData}
                            visible={showHeatmap}
                            scale={scale}
                            onRegionClick={onRegionClick}
                        />
                    </div>
                </div>
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

                {/* Upload Button in Strip */}
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

export default ImageViewer;
