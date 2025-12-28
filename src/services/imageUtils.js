// Image utility functions for the Image Gallery Module

/**
 * Filter images by type
 */
export const getImagesByType = (images, type) => {
    if (!type || type === 'all') return images;
    return images.filter(img => img.type === type);
};

/**
 * Filter images by module origin
 */
export const getImagesByModule = (images, module) => {
    if (!module || module === 'all') return images;
    return images.filter(img => img.moduleOrigin === module);
};

/**
 * Filter images by date range
 */
export const getImagesByDateRange = (images, startDate, endDate) => {
    if (!startDate && !endDate) return images;
    return images.filter(img => {
        const imgDate = new Date(img.uploadedAt);
        if (startDate && imgDate < new Date(startDate)) return false;
        if (endDate && imgDate > new Date(endDate)) return false;
        return true;
    });
};

/**
 * Filter images by user
 */
export const getImagesByUser = (images, userId) => {
    if (!userId || userId === 'all') return images;
    return images.filter(img => img.uploadedBy === userId);
};

/**
 * Filter images by tags
 */
export const getImagesByTags = (images, tags) => {
    if (!tags || tags.length === 0) return images;
    return images.filter(img => {
        if (!img.tags) return false;
        return tags.some(tag => img.tags.includes(tag));
    });
};

/**
 * Filter images used in report
 */
export const getImagesInReport = (images, inReport) => {
    if (inReport === null || inReport === undefined) return images;
    return images.filter(img => img.usedInReport === inReport);
};

/**
 * Format file size in human-readable format
 */
export const formatImageSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Validate image file before upload
 */
export const validateImageFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'El archivo debe ser una imagen' };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Tipo de imagen no soportado. Use JPG, PNG, GIF o WebP' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'La imagen no debe superar 10MB' };
    }

    return { valid: true };
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

/**
 * Get image type label in Spanish
 */
export const getImageTypeLabel = (type) => {
    const labels = {
        'macro': 'Macroscopía',
        'micro': 'Microscopía',
        'micro_he': 'Micro H&E',
        'ihc': 'Inmunohistoquímica',
        'cytology': 'Citología',
        'radiology': 'Radiología',
        'heatmap': 'Heatmap IA',
        'attachment': 'Adjunto',
        'wsi_preview': 'WSI Preview'
    };
    return labels[type] || type;
};

/**
 * Get module origin label in Spanish
 */
export const getModuleOriginLabel = (module) => {
    const labels = {
        'macroscopy': 'Macroscopía',
        'microscopy': 'Microscopía',
        'ihc': 'IHQ',
        'cytology': 'Citología',
        'radiology': 'Radiología',
        'tumor_board': 'Tumor Board',
        'manual': 'Carga Manual'
    };
    return labels[module] || module;
};

/**
 * Get module route for navigation
 */
export const getModuleRoute = (caseId, module) => {
    const routes = {
        'macroscopy': `/cases/${caseId}/macroscopy`,
        'microscopy': `/cases/${caseId}/microscopy`,
        'ihc': `/cases/${caseId}/immunohistochemistry`,
        'cytology': `/cases/${caseId}/cytology`,
        'tumor_board': `/tumor-board/${caseId}`
    };
    return routes[module] || `/cases/${caseId}`;
};

/**
 * Get type badge color
 */
export const getTypeBadgeColor = (type) => {
    const colors = {
        'macro': 'bg-orange-100 text-orange-700',
        'micro': 'bg-blue-100 text-blue-700',
        'micro_he': 'bg-blue-100 text-blue-700',
        'ihc': 'bg-purple-100 text-purple-700',
        'cytology': 'bg-green-100 text-green-700',
        'radiology': 'bg-gray-100 text-gray-700',
        'heatmap': 'bg-red-100 text-red-700',
        'attachment': 'bg-yellow-100 text-yellow-700',
        'wsi_preview': 'bg-indigo-100 text-indigo-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
};

/**
 * Export gallery as ZIP (mock implementation)
 * In production, this would use a library like JSZip
 */
export const exportGalleryAsZip = async (caseId, images) => {
    // Mock implementation - in production use JSZip
    console.log(`Exporting ${images.length} images for case ${caseId}`);
    alert(`Función de exportación en desarrollo. Se exportarían ${images.length} imágenes.`);
    return true;
};

/**
 * Apply multiple filters to images
 */
export const applyFilters = (images, filters) => {
    let filtered = images;

    if (filters.type && filters.type !== 'all') {
        filtered = getImagesByType(filtered, filters.type);
    }

    if (filters.module && filters.module !== 'all') {
        filtered = getImagesByModule(filtered, filters.module);
    }

    if (filters.user && filters.user !== 'all') {
        filtered = getImagesByUser(filtered, filters.user);
    }

    if (filters.startDate || filters.endDate) {
        filtered = getImagesByDateRange(filtered, filters.startDate, filters.endDate);
    }

    if (filters.tags && filters.tags.length > 0) {
        filtered = getImagesByTags(filtered, filters.tags);
    }

    if (filters.inReport !== null && filters.inReport !== undefined) {
        filtered = getImagesInReport(filtered, filters.inReport);
    }

    return filtered;
};
