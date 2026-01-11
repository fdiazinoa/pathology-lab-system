import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Button from './Button';

const ImageUploader = ({ images = [], onImagesChange }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        await processFiles(files);
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
            };
        });
    };

    const processFiles = async (files) => {
        const newImages = await Promise.all(files.map(async file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            url: await compressImage(file),
            name: file.name
        })));

        onImagesChange([...images, ...newImages]);
    };

    const removeImage = (id) => {
        onImagesChange(images.filter(img => img.id !== id));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        await processFiles(files);
    };

    return (
        <div className="space-y-4">
            <div
                className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary-light/20' : 'border-border hover:border-primary/50 hover:bg-gray-50'}
        `}
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
                <div className="flex flex-col items-center gap-2 text-text-secondary">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload size={24} />
                    </div>
                    <p className="font-medium text-text-main">Haz clic o arrastra imágenes aquí</p>
                    <p className="text-xs">Soporta JPG, PNG (Max 10MB)</p>
                </div>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="relative group rounded-md overflow-hidden border border-border aspect-square bg-gray-100">
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeImage(img.id)}
                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
