import DemoDataProvider from './providers/DemoDataProvider';

class MigrationService {
    constructor(targetProvider) {
        this.sourceProvider = new DemoDataProvider();
        this.targetProvider = targetProvider;
    }

    async getMigrationSummary() {
        const patients = await this.sourceProvider.getPatients();
        const cases = await this.sourceProvider.getCases();
        const users = await this.sourceProvider.getUsers();
        const deliveries = await this.sourceProvider.getDeliveries();

        return {
            patients: patients.length,
            cases: cases.length,
            users: users.length,
            deliveries: deliveries.length
        };
    }

    async migrateData(options = { patients: true, cases: true, users: false, deliveries: false }) {
        const report = {
            success: true,
            details: [],
            stats: { patients: 0, cases: 0, users: 0, deliveries: 0 },
            errors: []
        };

        try {
            // 1. Migrate Patients
            if (options.patients) {
                const patients = await this.sourceProvider.getPatients();
                for (const patient of patients) {
                    try {
                        // Check if exists (simple check by ID)
                        // In real prod, we might check by national ID or name
                        // For now, we assume targetProvider.addPatient handles duplicates or we catch error
                        await this.targetProvider.addPatient(patient);
                        report.stats.patients++;
                    } catch (e) {
                        report.errors.push(`Error migrando paciente ${patient.id}: ${e.message}`);
                    }
                }
                report.details.push(`Migrados ${report.stats.patients} pacientes.`);
            }

            // 2. Migrate Users (Optional)
            if (options.users) {
                const users = await this.sourceProvider.getUsers();
                for (const user of users) {
                    try {
                        await this.targetProvider.addUser(user);
                        report.stats.users++;
                    } catch (e) {
                        report.errors.push(`Error migrando usuario ${user.email}: ${e.message}`);
                    }
                }
                report.details.push(`Migrados ${report.stats.users} usuarios.`);
            }

            // 3. Migrate Cases
            if (options.cases) {
                const cases = await this.sourceProvider.getCases();
                for (const c of cases) {
                    try {
                        // Ensure patient exists if we are enforcing FKs (ProductionDataProvider might enforce)
                        // If we migrated patients, they should be there.
                        await this.targetProvider.addCase(c);
                        report.stats.cases++;
                    } catch (e) {
                        report.errors.push(`Error migrando caso ${c.id}: ${e.message}`);
                    }
                }
                report.details.push(`Migrados ${report.stats.cases} casos.`);
            }

            // 4. Migrate Deliveries
            if (options.deliveries) {
                const deliveries = await this.sourceProvider.getDeliveries();
                for (const d of deliveries) {
                    try {
                        await this.targetProvider.addDelivery(d);
                        report.stats.deliveries++;
                    } catch (e) {
                        report.errors.push(`Error migrando entrega ${d.id}: ${e.message}`);
                    }
                }
                report.details.push(`Migradas ${report.stats.deliveries} entregas.`);
            }

        } catch (globalError) {
            report.success = false;
            report.errors.push(`Error crítico de migración: ${globalError.message}`);
        }

        return report;
    }
}

export default MigrationService;
