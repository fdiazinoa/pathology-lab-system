/**
 * Pathology Data Helpers
 * Utilities for managing the hierarchical data structure (Case -> Specimens -> Blocks)
 * ensuring immutability for React state and localStorage persistence.
 */

/**
 * Generates a unique ID (UUID v4 compatible or fallback)
 * @returns {string} Unique Identifier
 */
export const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Adds a new specimen to a case object.
 * @param {Object} caseData - The current case state.
 * @param {Object} specimenData - The specimen data to add (type, description, etc.).
 * @returns {Object} A new case object with the specimen added.
 */
export const addSpecimenToCase = (caseData, specimenData) => {
    const newSpecimen = {
        id: generateId(),
        blocks: [],
        collectionDate: new Date().toISOString(),
        ...specimenData
    };

    return {
        ...caseData,
        specimens: [...(caseData.specimens || []), newSpecimen]
    };
};

/**
 * Adds a new block to a specific specimen within a case.
 * @param {Object} caseData - The current case state.
 * @param {string} specimenId - The ID of the specimen to add the block to.
 * @param {Object} blockData - The block data (label, notes, etc.).
 * @returns {Object} A new case object with the block added to the correct specimen.
 */
export const addBlockToSpecimen = (caseData, specimenId, blockData) => {
    if (!caseData.specimens) return caseData;

    const updatedSpecimens = caseData.specimens.map(specimen => {
        if (specimen.id === specimenId) {
            const newBlock = {
                id: generateId(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                ...blockData
            };
            return {
                ...specimen,
                blocks: [...(specimen.blocks || []), newBlock]
            };
        }
        return specimen;
    });

    return {
        ...caseData,
        specimens: updatedSpecimens
    };
};

/**
 * Templates for creating new objects
 */
export const TEMPLATES = {
    SPECIMEN: {
        type: '',
        description: '',
        collectionDate: ''
    },
    BLOCK: {
        label: '',
        status: 'pending',
        notes: ''
    }
};
