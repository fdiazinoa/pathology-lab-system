import DataProvider from './DataProvider';

class ProductionDataProvider extends DataProvider {
    constructor() {
        super();
        console.log("Initializing ProductionDataProvider (Local Simulation)...");
    }

    // Helper to simulate async delay
    async _delay(ms = 200) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- Authentication & Users ---
    async login(email, password) {
        await this._delay();
        const users = await this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user && user.password === password) { // Simple check for simulation
            localStorage.setItem('prod_user', JSON.stringify(user));
            return { success: true, user };
        }
        // Admin fallback
        if (email === 'admin@lab.com' && password === 'admin123') {
            const adminUser = { id: '1', name: 'Admin Producción', email: 'admin@lab.com', roleId: '1' };
            localStorage.setItem('prod_user', JSON.stringify(adminUser));
            return { success: true, user: adminUser };
        }
        return { success: false, message: 'Credenciales inválidas en Producción' };
    }

    async loginWithGoogle(credentialResponse) {
        // For production simulation, we can reuse the demo logic or just mock it
        return { success: false, message: "Google Login not configured for Prod Simulation" };
    }

    async logout() {
        localStorage.removeItem('prod_user');
        return true;
    }

    async getCurrentUser() {
        const saved = localStorage.getItem('prod_user');
        return saved ? JSON.parse(saved) : null;
    }

    async getUsers() {
        const saved = localStorage.getItem('prod_users');
        return saved ? JSON.parse(saved) : [];
    }

    async addUser(user) {
        const users = await this.getUsers();
        // Check duplicate
        if (users.find(u => u.email === user.email)) return user;
        const newUsers = [...users, user];
        localStorage.setItem('prod_users', JSON.stringify(newUsers));
        return user;
    }

    // --- Patients ---
    async getPatients() {
        await this._delay();
        const saved = localStorage.getItem('prod_patients');
        return saved ? JSON.parse(saved) : [];
    }

    async addPatient(patient) {
        await this._delay();
        const patients = await this.getPatients();
        // Check duplicate by ID
        if (patients.find(p => p.id === patient.id)) return patient;
        const newPatients = [patient, ...patients];
        localStorage.setItem('prod_patients', JSON.stringify(newPatients));
        return patient;
    }

    async updatePatient(patient) {
        await this._delay();
        const patients = await this.getPatients();
        const newPatients = patients.map(p => p.id === patient.id ? patient : p);
        localStorage.setItem('prod_patients', JSON.stringify(newPatients));
        return patient;
    }

    // --- Cases ---
    async getCases() {
        await this._delay();
        const saved = localStorage.getItem('prod_cases');
        return saved ? JSON.parse(saved) : [];
    }

    async getCase(id) {
        const cases = await this.getCases();
        return cases.find(c => c.id === id);
    }

    async addCase(newCase) {
        await this._delay();
        const cases = await this.getCases();
        if (cases.find(c => c.id === newCase.id)) return newCase;
        const updatedCases = [newCase, ...cases];
        localStorage.setItem('prod_cases', JSON.stringify(updatedCases));
        return newCase;
    }

    async updateCase(updatedCase) {
        await this._delay();
        const cases = await this.getCases();
        const newCases = cases.map(c => c.id === updatedCase.id ? updatedCase : c);
        localStorage.setItem('prod_cases', JSON.stringify(newCases));
        return updatedCase;
    }

    async deleteCase(id) {
        await this._delay();
        const cases = await this.getCases();
        const newCases = cases.filter(c => c.id !== id);
        localStorage.setItem('prod_cases', JSON.stringify(newCases));
        return true;
    }

    async getGlobalCases() {
        return []; // Prod starts empty
    }

    async publishToGlobal(caseId, description) {
        // ... implementation similar to demo if needed
        return { success: false, message: "Global network disabled in Prod Simulation" };
    }

    // --- Audit Log ---
    async getGlobalAuditLog() {
        const saved = localStorage.getItem('prod_audit_log');
        return saved ? JSON.parse(saved) : [];
    }

    async addAuditLog(logEntry) {
        const logs = await this.getGlobalAuditLog();
        localStorage.setItem('prod_audit_log', JSON.stringify([logEntry, ...logs]));
        return logEntry;
    }

    // --- Settings ---
    async getSettings() {
        const defaultSettings = {
            labName: 'Laboratorio Patología (PROD)',
            address: '',
            phone: '',
            email: '',
            logo: null,
            openaiApiKey: '',
            aiEnabled: true,
            enableLabWorkflow: true,
            enableMicrophone: false,
            requireInternalQRScan: true, // Stricter in prod
            printImagesInReport: true,
            paperSize: 'Letter',
            printerConfig: { printers: [], autoPrintLabels: false }
        };
        const saved = localStorage.getItem('prod_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    async updateSettings(settings) {
        await this._delay();
        const current = await this.getSettings();
        const newSettings = { ...current, ...settings };
        localStorage.setItem('prod_settings', JSON.stringify(newSettings));
        return newSettings;
    }

    async getConfigHistory() { return []; }

    async getConnectionConfig() {
        const saved = localStorage.getItem('app_connection_config');
        return saved ? JSON.parse(saved) : null;
    }
    async saveConnectionConfig(config) {
        localStorage.setItem('app_connection_config', JSON.stringify(config));
        return config;
    }

    // --- Logistics ---
    async getDeliveries() {
        const saved = localStorage.getItem('prod_deliveries');
        return saved ? JSON.parse(saved) : [];
    }
    async addDelivery(delivery) {
        const deliveries = await this.getDeliveries();
        localStorage.setItem('prod_deliveries', JSON.stringify([delivery, ...deliveries]));
        return delivery;
    }

    // --- Catalogs ---
    // In a real prod app, these would come from DB. For simulation, we'll use the same hardcoded ones OR allow them to be migrated/edited.
    // For now, let's use the same hardcoded ones as Demo to ensure consistency, but we could also store them in localStorage.

    async getInsurers() {
        return [
            { id: '1', name: 'ARS Humano', tariff: '80%' },
            { id: '2', name: 'ARS Palic', tariff: '100%' },
            { id: '3', name: 'ARS Universal', tariff: 'Fixed $1500' }
        ];
    }

    async getOrgans() {
        // Extended list for Prod
        return [
            { id: '1', name: 'Piel' },
            { id: '2', name: 'Mama' },
            { id: '3', name: 'Estómago' },
            { id: '4', name: 'Colon' },
            { id: '5', name: 'Próstata' },
            { id: '6', name: 'Tiroides' },
            { id: '7', name: 'Ganglio Linfático' },
            { id: '8', name: 'Útero' },
            { id: '9', name: 'Ovario' },
            { id: '10', name: 'Pulmón' },
            { id: '11', name: 'Riñón' },
            { id: '12', name: 'Vejiga' },
            // Add the one from the screenshot to fix the bug
            { id: '99', name: 'Por definir (Macro)' }
        ];
    }

    async getDoctors() {
        // In prod, this should probably be migrated.
        // For now, return default + any migrated if we stored them (we didn't implement storeDoctors yet)
        return [
            { id: '1', name: 'Dr. Alejandro Pérez', license: 'MP 12345', email: 'alejandro.perez@lab.com' }
        ];
    }

    async getEquipment() {
        return [
            { id: '1', name: 'Microtomo Leica RM2235', type: 'Microtomo', status: 'Online' },
            { id: '2', name: 'Procesador de Tejidos Leica ASP300', type: 'Procesador', status: 'Processing' },
            { id: '3', name: 'Escáner Aperio GT 450', type: 'Escáner WSI', status: 'Online' }
        ];
    }

    // --- Roles ---
    async getRoles() {
        const saved = localStorage.getItem('prod_roles');
        if (saved) return JSON.parse(saved);
        // Default roles for prod simulation
        return [
            { id: '1', name: 'Administrador', permissions: ['all'] },
            { id: '2', name: 'Patólogo', permissions: ['read_cases', 'edit_cases', 'sign_reports'] },
            { id: '3', name: 'Técnico', permissions: ['read_cases', 'edit_cases'] },
            { id: '4', name: 'Secretaria', permissions: ['read_cases', 'create_cases'] }
        ];
    }

    async addRole(role) {
        const roles = await this.getRoles();
        const newRole = { ...role, id: Date.now().toString() };
        const newRoles = [...roles, newRole];
        localStorage.setItem('prod_roles', JSON.stringify(newRoles));
        return newRole;
    }

    async updateRole(role) {
        const roles = await this.getRoles();
        const newRoles = roles.map(r => r.id === role.id ? role : r);
        localStorage.setItem('prod_roles', JSON.stringify(newRoles));
        return role;
    }

    async deleteRole(id) {
        const roles = await this.getRoles();
        const newRoles = roles.filter(r => r.id !== id);
        localStorage.setItem('prod_roles', JSON.stringify(newRoles));
        return true;
    }

    // --- Centers ---
    async getCenters() {
        const saved = localStorage.getItem('prod_centers');
        return saved ? JSON.parse(saved) : [];
    }

    async addCenter(center) {
        const centers = await this.getCenters();
        const newCenter = { ...center, id: Date.now().toString() };
        centers.push(newCenter);
        localStorage.setItem('prod_centers', JSON.stringify(centers));
        return newCenter;
    }

    async updateCenter(id, updates) {
        const centers = await this.getCenters();
        const index = centers.findIndex(c => c.id === id);
        if (index !== -1) {
            centers[index] = { ...centers[index], ...updates };
            localStorage.setItem('prod_centers', JSON.stringify(centers));
            return centers[index];
        }
        return null;
    }

    async deleteCenter(id) {
        const centers = await this.getCenters();
        const filtered = centers.filter(c => c.id !== id);
        localStorage.setItem('prod_centers', JSON.stringify(filtered));
        return true;
    }

    async getExams() {
        return [
            { id: '1', code: '88305', name: 'Biopsia Nivel IV', pricePrivate: 2500 },
            { id: '2', code: '88307', name: 'Biopsia Nivel V', pricePrivate: 4500 },
            { id: '3', code: '88112', name: 'Citología Líquida', pricePrivate: 1200 },
            { id: '4', code: '88342', name: 'Inmunohistoquímica', pricePrivate: 3000 },
            // Add generic Biopsia if needed
            { id: '5', code: 'GEN', name: 'Biopsia', pricePrivate: 3500 }
        ];
    }
}

export default ProductionDataProvider;
