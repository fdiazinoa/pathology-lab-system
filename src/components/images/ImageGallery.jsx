import React from 'react';
import ImageCard from './ImageCard';
import { Grid, List } from 'lucide-react';

const ImageGallery = ({ images, selectedImages, onSelectImage, onViewImage, onDeleteImage, viewMode = 'grid' }) => {
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = images.map(img => img.id);
            allIds.forEach(id => {
                if (!selectedImages.includes(id)) {
                    onSelectImage(id);
                }
            });
        } else {
            images.forEach(img => {
                if (selectedImages.includes(img.id)) {
                    onSelectImage(img.id);
                }
            });
        }
    };

    const allSelected = images.length > 0 && images.every(img => selectedImages.includes(img.id));
    const someSelected = images.some(img => selectedImages.includes(img.id)) && !allSelected;

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Grid size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No hay imágenes</p>
                <p className="text-sm mt-1">Sube imágenes o ajusta los filtros</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Select All Header */}
            <div className="flex items-center gap-3 px-2">
                <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                        if (input) input.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600">
                    {selectedImages.length > 0 ? (
                        <span className="font-medium text-primary">
                            {selectedImages.length} seleccionada{selectedImages.length !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        'Seleccionar todas'
                    )}
                </span>
                <span className="text-sm text-gray-400 ml-auto">
                    {images.length} imagen{images.length !== 1 ? 'es' : ''}
                </span>
            </div>

            {/* Image Grid */}
            <div className={`grid gap-4 ${viewMode === 'grid'
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    : 'grid-cols-1 md:grid-cols-2'
                }`}>
                {images.map(image => (
                    <ImageCard
                        key={image.id}
                        image={image}
                        isSelected={selectedImages.includes(image.id)}
                        onSelect={onSelectImage}
                        onView={onViewImage}
                        onDelete={onDeleteImage}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageGallery;
