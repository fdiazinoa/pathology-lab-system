/**
 * TelemetryService.js
 * Handles anonymous usage tracking for system optimization.
 */
class TelemetryService {
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.storageKey = 'pathai_telemetry_v1';
    }

    /**
     * Logs a usage event.
     * @param {string} module - The module name (e.g., 'AI', 'Comparator').
     * @param {string} action - The action performed (e.g., 'Request', 'Accept').
     * @param {Object} metadata - Additional non-sensitive data.
     */
    async logEvent(module, action, metadata = {}) {
        const event = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            module,
            action,
            metadata
        };

        // In Demo mode, we use localStorage
        const events = this._getEvents();
        events.push(event);
        this._saveEvents(events);

        // In Production mode, we would also send to the database
        if (this.dataProvider && this.dataProvider.isProduction) {
            try {
                // await this.dataProvider.logTelemetry(event);
            } catch (e) {
                console.warn("Failed to log telemetry to production provider", e);
            }
        }

        return event;
    }

    /**
     * Gets aggregated statistics for a given period.
     * @param {number} days - Number of days to look back (0 for all).
     */
    getStats(days = 0) {
        const events = this._getEvents();
        const now = new Date();
        const cutoff = days > 0 ? new Date(now.setDate(now.getDate() - days)) : null;

        const filtered = cutoff
            ? events.filter(e => new Date(e.timestamp) >= cutoff)
            : events;

        const stats = {
            totalEvents: filtered.length,
            byModule: {},
            byAction: {},
            trends: this._calculateTrends(filtered)
        };

        filtered.forEach(e => {
            stats.byModule[e.module] = (stats.byModule[e.module] || 0) + 1;
            const actionKey = `${e.module}:${e.action}`;
            stats.byAction[actionKey] = (stats.byAction[actionKey] || 0) + 1;
        });

        return stats;
    }

    _getEvents() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    _saveEvents(events) {
        // Keep only last 1000 events to avoid bloating localStorage
        const limited = events.slice(-1000);
        localStorage.setItem(this.storageKey, JSON.stringify(limited));
    }

    _calculateTrends(events) {
        // Simple daily aggregation for trends
        const daily = {};
        events.forEach(e => {
            const date = e.timestamp.split('T')[0];
            daily[date] = (daily[date] || 0) + 1;
        });
        return daily;
    }
}

export default TelemetryService;
