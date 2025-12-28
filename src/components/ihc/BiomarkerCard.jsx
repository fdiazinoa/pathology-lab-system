import React from 'react';
import { Trash2, Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../Button';

const BiomarkerCard = ({ marker, onEdit, onDelete, onSelect, isSelected }) => {
    const getIntensityColor = (intensity) => {
        switch (intensity) {
            case '3+': return 'bg-red-100 text-red-800 border-red-200';
            case '2+': return 'bg-orange-100 text-orange-800 border-orange-200';
            case '1+': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div
            className={`p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300'}`}
            onClick={() => onSelect(marker)}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-800">{marker.name}</h4>
                <div className="flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(marker); }}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-100"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(marker.id); }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${marker.result === 'Positivo' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                    {marker.result}
                </span>
                {marker.result === 'Positivo' && (
                    <>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getIntensityColor(marker.intensity)}`}>
                            {marker.intensity}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                            {marker.percentage}%
                        </span>
                    </>
                )}
            </div>

            <div className="text-xs text-gray-500 space-y-1">
                <p><span className="font-medium">Patrón:</span> {marker.pattern || 'N/A'}</p>
                {marker.control && (
                    <p className="flex items-center gap-1">
                        <span className="font-medium">Control:</span>
                        {marker.control === 'Adecuado' ? (
                            <span className="text-green-600 flex items-center gap-0.5"><CheckCircle size={10} /> OK</span>
                        ) : (
                            <span className="text-red-600 flex items-center gap-0.5"><AlertCircle size={10} /> Fallo</span>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
};

export default BiomarkerCard;
