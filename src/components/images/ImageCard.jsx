import React from 'react';
import { X, Image as ImageIcon, Calendar, User, Tag, FileCheck, MapPin } from 'lucide-react';
import { getImageTypeLabel, getModuleOriginLabel, formatImageSize, getTypeBadgeColor } from '../../services/imageUtils';

const ImageCard = ({ image, isSelected, onSelect, onView, onDelete }) => {
    const handleClick = (e) => {
        if (e.target.closest('.action-button')) return;
        onView(image);
    };

    const handleCheckboxChange = (e) => {
        e.stopPropagation();
        onSelect(image.id);
    };

    return (
        <div
            className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/50'
                }`}
            onClick={handleClick}
        >
            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image.id);
                }}
                className="action-button absolute top-2 right-2 z-10 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
                <X size={14} />
            </button>

            {/* Image Preview */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {image.url ? (
                    <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-300" />
                    </div>
                )}

                {/* Type Badge */}
                <div className="absolute bottom-2 left-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadgeColor(image.type)}`}>
                        {getImageTypeLabel(image.type)}
                    </span>
                </div>

                {/* Used in Report Badge */}
                {image.usedInReport && (
                    <div className="absolute bottom-2 right-2">
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1">
                            <FileCheck size={12} />
                            En Informe
                        </span>
                    </div>
                )}
            </div>

            {/* Image Info */}
            <div className="p-3 bg-white">
                <p className="text-sm font-medium text-gray-900 truncate" title={image.name}>
                    {image.name}
                </p>
                <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span>{getModuleOriginLabel(image.moduleOrigin)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>{new Date(image.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    {image.size && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <ImageIcon size={12} />
                            <span>{formatImageSize(image.size)}</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {image.tags && image.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {image.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                #{tag}
                            </span>
                        ))}
                        {image.tags.length > 2 && (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                +{image.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}

                {/* Annotation Count */}
                {image.annotations && image.annotations.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                        {image.annotations.length} anotación{image.annotations.length !== 1 ? 'es' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageCard;
