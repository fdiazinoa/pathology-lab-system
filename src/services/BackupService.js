/**
 * BackupService.js
 * Handles data export, import, and retention policies for the Pathology Lab System.
 */

class BackupService {
    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.STORAGE_KEY = 'app_backups_history';
        this.MAX_DAILY_BACKUPS = 7;
        this.MAX_WEEKLY_BACKUPS = 4;
    }

    /**
     * Creates a full backup of the system data.
     * @param {string} type - 'auto' or 'manual'
     * @returns {Promise<Object>} The backup object
     */
    async createBackup(type = 'manual') {
        try {
            console.log(`Creating ${type} backup...`);

            // Gather all data from provider
            const [
                patients,
                cases,
                users,
                settings,
                auditLog,
                deliveries,
                insurers,
                organs,
                doctors,
                equipment,
                exams
            ] = await Promise.all([
                this.dataProvider.getPatients(),
                this.dataProvider.getCases(),
                this.dataProvider.getUsers(),
                this.dataProvider.getSettings(),
                this.dataProvider.getGlobalAuditLog(),
                this.dataProvider.getDeliveries(),
                this.dataProvider.getInsurers(),
                this.dataProvider.getOrgans(),
                this.dataProvider.getDoctors(),
                this.dataProvider.getEquipment(),
                this.dataProvider.getExams()
            ]);

            const backupData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                type,
                data: {
                    patients,
                    cases,
                    users,
                    settings,
                    auditLog,
                    deliveries,
                    catalogs: {
                        insurers,
                        organs,
                        doctors,
                        equipment,
                        exams
                    }
                }
            };

            // Save to history
            this._saveToHistory({
                id: `bak_${Date.now()}`,
                timestamp: backupData.timestamp,
                type: backupData.type,
                size: JSON.stringify(backupData).length,
                status: 'success',
                data: backupData // In a real app, we'd save a file path or blob ID
            });

            return backupData;
        } catch (error) {
            console.error('Backup failed:', error);
            this._saveToHistory({
                id: `bak_${Date.now()}`,
                timestamp: new Date().toISOString(),
                type,
                status: 'error',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Restores the system from a backup object.
     * @param {Object} backupData - The backup data to restore
     */
    async restoreBackup(backupData) {
        if (!backupData || !backupData.data) {
            throw new Error('Invalid backup data');
        }

        console.log('Restoring backup from:', backupData.timestamp);

        const { data } = backupData;

        // Sequence of restoration to maintain integrity
        // 1. Settings
        if (data.settings) await this.dataProvider.updateSettings(data.settings);

        // 2. Catalogs
        if (data.catalogs) {
            const { insurers, organs, doctors, equipment, exams } = data.catalogs;
            // In a real app, we'd clear and refill or merge. 
            // For simulation, we assume the provider handles it or we just overwrite localStorage keys if we had direct access.
            // Since we use DataProvider, we'd need add/update methods for each.
            // For now, let's assume the main entities are the priority.
        }

        // 3. Patients
        if (data.patients) {
            for (const p of data.patients) {
                await this.dataProvider.addPatient(p);
            }
        }

        // 4. Cases
        if (data.cases) {
            for (const c of data.cases) {
                await this.dataProvider.addCase(c);
            }
        }

        // 5. Audit Log & Deliveries
        if (data.auditLog) {
            for (const log of data.auditLog) {
                await this.dataProvider.addAuditLog(log);
            }
        }

        if (data.deliveries) {
            for (const d of data.deliveries) {
                await this.dataProvider.addDelivery(d);
            }
        }

        return true;
    }

    /**
     * Gets the backup history.
     */
    getHistory() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Internal helper to save backup metadata to history and enforce retention.
     */
    _saveToHistory(entry) {
        let history = this.getHistory();
        history.unshift(entry);

        // Enforce retention (simple version: keep last N)
        const maxBackups = this.MAX_DAILY_BACKUPS + this.MAX_WEEKLY_BACKUPS;
        if (history.length > maxBackups) {
            history = history.slice(0, maxBackups);
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    }

    /**
     * Triggers an automatic backup if needed (e.g., once a day).
     */
    async triggerAutoBackupIfNeeded() {
        const history = this.getHistory();
        const lastAuto = history.find(b => b.type === 'auto' && b.status === 'success');

        const now = new Date();
        if (!lastAuto || (now - new Date(lastAuto.timestamp)) > 24 * 60 * 60 * 1000) {
            return await this.createBackup('auto');
        }
        return null;
    }

    /**
     * Downloads a backup as a JSON file.
     */
    downloadBackup(backupData) {
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_pathology_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export default BackupService;
