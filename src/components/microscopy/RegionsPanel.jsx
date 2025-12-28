import React from 'react';
import { AlertTriangle, MapPin, CheckCircle, X } from 'lucide-react';

const RegionsPanel = ({ regions, onRegionClick, onClose }) => {
    if (!regions || regions.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 text-sm">
                No se han detectado regiones sospechosas aún.
            </div>
        );
    }

    const getBadgeColor = (prob) => {
        if (prob >= 0.9) return 'bg-red-100 text-red-800 border-red-200';
        if (prob >= 0.7) return 'bg-orange-100 text-orange-800 border-orange-200';
        if (prob >= 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    return (
        <div className="flex flex-col gap-3 p-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-500" />
                    Regiones Detectadas ({regions.length})
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    title="Cerrar Heatmap"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex flex-col gap-2">
                {regions.map((region) => (
                    <div
                        key={region.id}
                        onClick={() => onRegionClick(region)}
                        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-900 text-sm">{region.finding}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getBadgeColor(region.probability)}`}>
                                {Math.round(region.probability * 100)}%
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {region.description}
                        </p>
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                                <MapPin size={12} />
                                Localizar
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RegionsPanel;
