import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Tag as TagIcon } from 'lucide-react';
import Button from '../Button';
import { validateImageFile, fileToBase64, getImageTypeLabel } from '../../services/imageUtils';

const AdvancedImageUploader = ({ onUpload, onClose }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [imageType, setImageType] = useState('macro');
    const [moduleOrigin, setModuleOrigin] = useState('manual');
    const [tags, setTags] = useState('');
    const [uploading, setUploading] = useState(false);

    const imageTypes = [
        { value: 'macro', label: 'Macroscopía' },
        { value: 'micro_he', label: 'Micro H&E' },
        { value: 'ihc', label: 'Inmunohistoquímica' },
        { value: 'cytology', label: 'Citología' },
        { value: 'radiology', label: 'Radiología' },
        { value: 'attachment', label: 'Adjunto Clínico' }
    ];

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        addFiles(files);
    };

    const addFiles = (files) => {
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            const validation = validateImageFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        if (errors.length > 0) {
            alert('Algunos archivos no son válidos:\n' + errors.join('\n'));
        }

        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        addFiles(files);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            alert('Selecciona al menos una imagen');
            return;
        }

        setUploading(true);

        try {
            const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);

            const imagePromises = selectedFiles.map(async (file) => {
                const url = await fileToBase64(file);
                return {
                    url,
                    name: file.name,
                    type: imageType,
                    moduleOrigin: moduleOrigin,
                    size: file.size,
                    tags: tagArray
                };
            });

            const images = await Promise.all(imagePromises);
            onUpload(images);
            onClose();
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Error al subir las imágenes');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Subir Imágenes</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Drag and Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Upload size={32} className="text-gray-400" />
                            </div>
                            <p className="font-medium text-gray-900">Arrastra imágenes aquí o haz clic para seleccionar</p>
                            <p className="text-sm text-gray-500">Soporta JPG, PNG, GIF, WebP (Max 10MB cada una)</p>
                        </div>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Archivos seleccionados ({selectedFiles.length})
                            </h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                                        <ImageIcon size={16} className="text-gray-400" />
                                        <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </span>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Image Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Imagen *
                        </label>
                        <select
                            value={imageType}
                            onChange={(e) => setImageType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        >
                            {imageTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Etiquetas (opcional)
                        </label>
                        <div className="relative">
                            <TagIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="ej: lesion, biopsia, control"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Separa múltiples etiquetas con comas
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={uploading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
                        {uploading ? 'Subiendo...' : `Subir ${selectedFiles.length} imagen${selectedFiles.length !== 1 ? 'es' : ''}`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedImageUploader;
