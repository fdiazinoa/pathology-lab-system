import React from 'react';
import { Filter, X } from 'lucide-react';
import Button from '../Button';

const ImageFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const imageTypes = [
        { value: 'all', label: 'Todos los tipos' },
        { value: 'macro', label: 'Macroscopía' },
        { value: 'micro_he', label: 'Micro H&E' },
        { value: 'ihc', label: 'Inmunohistoquímica' },
        { value: 'cytology', label: 'Citología' },
        { value: 'heatmap', label: 'Heatmap IA' },
        { value: 'radiology', label: 'Radiología' },
        { value: 'attachment', label: 'Adjuntos' },
        { value: 'wsi_preview', label: 'WSI Preview' }
    ];

    const moduleOrigins = [
        { value: 'all', label: 'Todos los módulos' },
        { value: 'macroscopy', label: 'Macroscopía' },
        { value: 'microscopy', label: 'Microscopía' },
        { value: 'ihc', label: 'IHQ' },
        { value: 'cytology', label: 'Citología' },
        { value: 'radiology', label: 'Radiología' },
        { value: 'tumor_board', label: 'Tumor Board' },
        { value: 'manual', label: 'Carga Manual' }
    ];

    const hasActiveFilters = () => {
        return filters.type !== 'all' ||
            filters.module !== 'all' ||
            filters.inReport !== null ||
            filters.startDate ||
            filters.endDate ||
            (filters.tags && filters.tags.length > 0);
    };

    return (
        <div className="bg-white border-r border-gray-200 p-4 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-600" />
                    <h3 className="font-bold text-gray-900">Filtros</h3>
                </div>
                {hasActiveFilters() && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClearFilters}
                        className="text-xs"
                    >
                        <X size={14} className="mr-1" />
                        Limpiar
                    </Button>
                )}
            </div>

            {/* Type Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Imagen
                </label>
                <select
                    value={filters.type || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                >
                    {imageTypes.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Module Origin Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Módulo de Origen
                </label>
                <select
                    value={filters.module || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, module: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                >
                    {moduleOrigins.map(module => (
                        <option key={module.value} value={module.value}>
                            {module.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Date Range Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Fechas
                </label>
                <div className="space-y-2">
                    <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                        placeholder="Desde"
                    />
                    <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                        placeholder="Hasta"
                    />
                </div>
            </div>

            {/* In Report Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado en Informe
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="inReport"
                            checked={filters.inReport === null}
                            onChange={() => onFilterChange({ ...filters, inReport: null })}
                            className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">Todas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="inReport"
                            checked={filters.inReport === true}
                            onChange={() => onFilterChange({ ...filters, inReport: true })}
                            className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">En informe</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="inReport"
                            checked={filters.inReport === false}
                            onChange={() => onFilterChange({ ...filters, inReport: false })}
                            className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">No en informe</span>
                    </label>
                </div>
            </div>

            {/* Tags Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etiquetas
                </label>
                <input
                    type="text"
                    placeholder="Buscar por etiqueta..."
                    value={filters.tagSearch || ''}
                    onChange={(e) => onFilterChange({ ...filters, tagSearch: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Separa múltiples etiquetas con comas
                </p>
            </div>

            {/* Filter Summary */}
            {hasActiveFilters() && (
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">Filtros activos:</p>
                    <div className="space-y-1 text-xs text-gray-500">
                        {filters.type !== 'all' && (
                            <div>• Tipo: {imageTypes.find(t => t.value === filters.type)?.label}</div>
                        )}
                        {filters.module !== 'all' && (
                            <div>• Módulo: {moduleOrigins.find(m => m.value === filters.module)?.label}</div>
                        )}
                        {filters.inReport !== null && (
                            <div>• {filters.inReport ? 'En informe' : 'No en informe'}</div>
                        )}
                        {(filters.startDate || filters.endDate) && (
                            <div>• Fechas: {filters.startDate || '...'} - {filters.endDate || '...'}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageFilters;
