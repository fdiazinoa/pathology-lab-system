/**
 * Help Context Rules
 * 
 * Defines prioritization rules for help sections based on:
 * - User role (Administrador, Patólogo, Técnico)
 * - System mode (DEMO, PRODUCTION)
 * - Active module/path
 */

export const HELP_CONTEXT_RULES = {
    // Priority by user role
    byRole: {
        '1': [ // Administrador
            'backup-restore',
            'operation-manual',
            'collaboration'
        ],
        '2': [ // Patólogo
            'ia-guide',
            'comparator',
            'second-look',
            'consistency',
            'operation-manual'
        ],
        '3': [ // Técnico
            'operation-manual',
            'ia-guide'
        ]
    },

    // Priority by system mode
    byMode: {
        demo: [
            'operation-manual',
            'ia-guide'
        ],
        production: [
            'backup-restore',
            'operation-manual',
            'consistency'
        ]
    },

    // Priority by active path/module
    byPath: {
        '/case': [
            'ia-guide',
            'second-look',
            'consistency',
            'comparator'
        ],
        '/settings': [
            'backup-restore',
            'operation-manual'
        ],
        '/dashboard': [
            'operation-manual'
        ],
        '/tumor-board': [
            'collaboration'
        ],
        '/macroscopy': [
            'operation-manual',
            'ia-guide'
        ],
        '/microscopy': [
            'ia-guide',
            'second-look',
            'comparator'
        ]
    }
};

/**
 * Get prioritized help section IDs based on current context
 * @param {Object} context - Current user context
 * @param {string} context.roleId - User role ID
 * @param {boolean} context.isProductionMode - System mode
 * @param {string} context.currentPath - Current route path
 * @returns {string[]} Array of prioritized section IDs
 */
export function getPrioritizedHelpSections(context) {
    const { roleId, isProductionMode, currentPath } = context;
    const prioritySet = new Set();

    // Add priorities by role
    if (roleId && HELP_CONTEXT_RULES.byRole[roleId]) {
        HELP_CONTEXT_RULES.byRole[roleId].forEach(id => prioritySet.add(id));
    }

    // Add priorities by mode
    const mode = isProductionMode ? 'production' : 'demo';
    if (HELP_CONTEXT_RULES.byMode[mode]) {
        HELP_CONTEXT_RULES.byMode[mode].forEach(id => prioritySet.add(id));
    }

    // Add priorities by path (match partial paths)
    if (currentPath) {
        Object.keys(HELP_CONTEXT_RULES.byPath).forEach(pathPattern => {
            if (currentPath.includes(pathPattern)) {
                HELP_CONTEXT_RULES.byPath[pathPattern].forEach(id => prioritySet.add(id));
            }
        });
    }

    return Array.from(prioritySet);
}
