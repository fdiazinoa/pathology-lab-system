import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Move, SplitSquareHorizontal, Maximize } from 'lucide-react';

const IHCViewer = ({ activeMarker, heImage }) => {
    const [scale, setScale] = useState(1);
    const [showComparison, setShowComparison] = useState(false);

    if (!activeMarker) {
        return (
            <div className="flex-1 bg-gray-900 flex items-center justify-center text-gray-500">
                <p>Seleccione un marcador para ver su imagen</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-900 relative overflow-hidden">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex gap-4 text-white z-20 items-center">
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))} className="hover:text-blue-400"><ZoomOut size={20} /></button>
                <span className="text-sm font-mono min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(4, s + 0.5))} className="hover:text-blue-400"><ZoomIn size={20} /></button>
                <div className="w-px bg-white/20 mx-1"></div>
                <button onClick={() => setShowComparison(!showComparison)} className={`hover:text-blue-400 ${showComparison ? 'text-blue-400' : ''}`} title="Comparar con H&E">
                    <SplitSquareHorizontal size={20} />
                </button>
            </div>

            <div className="flex-1 flex">
                {/* IHC Image */}
                <div className={`flex-1 relative overflow-hidden flex items-center justify-center ${showComparison ? 'border-r border-gray-700' : ''}`}>
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        IHC: {activeMarker.name}
                    </div>
                    {activeMarker.imageUrl ? (
                        <img
                            src={activeMarker.imageUrl}
                            alt={activeMarker.name}
                            className="max-w-full max-h-full object-contain transition-transform duration-200"
                            style={{ transform: `scale(${scale})` }}
                        />
                    ) : (
                        <div className="text-gray-500">Sin imagen asignada</div>
                    )}
                </div>

                {/* Comparison H&E Image */}
                {showComparison && (
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            H&E (Referencia)
                        </div>
                        {heImage ? (
                            <img
                                src={heImage.url}
                                alt="H&E Reference"
                                className="max-w-full max-h-full object-contain transition-transform duration-200"
                                style={{ transform: `scale(${scale})` }}
                            />
                        ) : (
                            <div className="text-gray-500">Sin imagen H&E disponible</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IHCViewer;
