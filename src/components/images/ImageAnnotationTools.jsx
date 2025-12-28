import React from 'react';
import { ArrowRight, Circle, Square, Type, Trash2, Palette } from 'lucide-react';

const ImageAnnotationTools = ({
    activeTool,
    onToolChange,
    activeColor,
    onColorChange,
    annotations,
    onDeleteAnnotation,
    onClearAll
}) => {
    const tools = [
        { id: 'arrow', icon: ArrowRight, label: 'Flecha' },
        { id: 'circle', icon: Circle, label: 'Círculo' },
        { id: 'rectangle', icon: Square, label: 'Rectángulo' },
        { id: 'text', icon: Type, label: 'Texto' }
    ];

    const colors = [
        { value: '#ef4444', label: 'Rojo' },
        { value: '#f59e0b', label: 'Naranja' },
        { value: '#eab308', label: 'Amarillo' },
        { value: '#22c55e', label: 'Verde' },
        { value: '#3b82f6', label: 'Azul' },
        { value: '#a855f7', label: 'Morado' },
        { value: '#ffffff', label: 'Blanco' }
    ];

    return (
        <div className="absolute top-20 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="space-y-3">
                {/* Tool Selection */}
                <div>
                    <p className="text-xs text-gray-300 mb-2">Herramientas</p>
                    <div className="flex flex-col gap-2">
                        {tools.map(tool => {
                            const Icon = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => onToolChange(tool.id)}
                                    className={`p-2 rounded flex items-center gap-2 transition-colors ${activeTool === tool.id
                                            ? 'bg-primary text-white'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    title={tool.label}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm">{tool.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Color Picker */}
                <div>
                    <p className="text-xs text-gray-300 mb-2">Color</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {colors.map(color => (
                            <button
                                key={color.value}
                                onClick={() => onColorChange(color.value)}
                                className={`w-8 h-8 rounded border-2 transition-all ${activeColor === color.value
                                        ? 'border-white scale-110'
                                        : 'border-transparent hover:border-white/50'
                                    }`}
                                style={{ backgroundColor: color.value }}
                                title={color.label}
                            />
                        ))}
                    </div>
                </div>

                {/* Annotations List */}
                {annotations.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-300">
                                Anotaciones ({annotations.length})
                            </p>
                            <button
                                onClick={onClearAll}
                                className="text-xs text-red-400 hover:text-red-300"
                            >
                                Limpiar todo
                            </button>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {annotations.map((annotation, index) => (
                                <div
                                    key={annotation.id}
                                    className="flex items-center justify-between p-2 bg-white/5 rounded text-xs"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: annotation.color }}
                                        />
                                        <span className="text-white truncate">
                                            {annotation.type === 'text'
                                                ? annotation.text || 'Nota de texto'
                                                : `${annotation.type} ${index + 1}`
                                            }
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onDeleteAnnotation(annotation.id)}
                                        className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-gray-400">
                        {activeTool === 'arrow' && 'Haz clic y arrastra para dibujar una flecha'}
                        {activeTool === 'circle' && 'Haz clic y arrastra para dibujar un círculo'}
                        {activeTool === 'rectangle' && 'Haz clic y arrastra para dibujar un rectángulo'}
                        {activeTool === 'text' && 'Haz clic donde quieras agregar texto'}
                        {!activeTool && 'Selecciona una herramienta para comenzar'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ImageAnnotationTools;
