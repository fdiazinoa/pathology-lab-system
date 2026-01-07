import DataProvider from './DataProvider';
import { MOCK_PATIENTS, MOCK_CASES, MOCK_GLOBAL_CASES } from '../mockData';
import { jwtDecode } from "jwt-decode";

class DemoDataProvider extends DataProvider {
    constructor() {
        super();
        this.initData();
    }

    initData() {
        // Initialize local storage with mock data if empty
        if (!localStorage.getItem('app_cases')) {
            localStorage.setItem('app_cases', JSON.stringify(MOCK_CASES));
        }
        if (!localStorage.getItem('app_patients')) {
            localStorage.setItem('app_patients', JSON.stringify(MOCK_PATIENTS));
        }
        if (!localStorage.getItem('app_global_cases')) {
            localStorage.setItem('app_global_cases', JSON.stringify(MOCK_GLOBAL_CASES));
        }
        if (!localStorage.getItem('app_centers')) {
            const MOCK_CENTERS = [
                { id: '1', name: 'Hospital Central', address: 'Av. Principal 123, Ciudad', phone: '(555) 123-4567', location: 'https://maps.google.com/?q=19.432608,-99.133209' },
                { id: '2', name: 'Clínica San José', address: 'Calle 5 #45-67, Zona Norte', phone: '(555) 987-6543', location: 'https://maps.google.com/?q=19.42847,-99.12766' },
                { id: '3', name: 'Centro Médico del Valle', address: 'Av. Universidad 789, Del Valle', phone: '(555) 246-8135', location: 'https://maps.google.com/?q=19.3794,-99.1591' },
                { id: '4', name: 'Unidad de Patología Especializada', address: 'Calle Roble 22, Consultorio 304', phone: '(555) 369-2580', location: 'https://maps.google.com/?q=19.4000,-99.1700' }
            ];
            localStorage.setItem('app_centers', JSON.stringify(MOCK_CENTERS));
        }
    }

    // Helper to simulate async delay
    async _delay(ms = 300) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- Authentication & Users ---
    async login(email, password) {
        await this._delay(800);
        const users = await this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            if (password === 'admin123' || password === '123456') {
                localStorage.setItem('app_user', JSON.stringify(user));
                return { success: true, user };
            } else {
                return { success: false, message: 'Contraseña incorrecta' };
            }
        } else {
            if (email === 'admin@lab.com' && password === 'admin123') {
                const adminUser = { id: '1', name: 'Admin User', email: 'admin@lab.com', roleId: '1' };
                localStorage.setItem('app_user', JSON.stringify(adminUser));
                return { success: true, user: adminUser };
            }
            return { success: false, message: 'Usuario no encontrado' };
        }
    }

    async loginWithGoogle(credentialResponse) {
        await this._delay(500);
        try {
            if (!credentialResponse.credential) return { success: false, message: 'No credentials' };
            const decoded = jwtDecode(credentialResponse.credential);
            const { email, name, picture, sub } = decoded;

            let users = await this.getUsers();
            let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                user = {
                    id: `google_${sub}`,
                    name: name,
                    email: email,
                    roleId: '2',
                    status: 'Active',
                    lastLogin: new Date().toISOString(),
                    avatar: picture,
                    authProvider: 'google'
                };
                // In demo, we don't persist new google users to the main list automatically unless we want to
                // For now, just return the user session
            }
            localStorage.setItem('app_user', JSON.stringify(user));
            return { success: true, user };
        } catch (e) {
            console.error(e);
            return { success: false, message: 'Google login error' };
        }
    }

    async logout() {
        localStorage.removeItem('app_user');
        return true;
    }

    async getCurrentUser() {
        const saved = localStorage.getItem('app_user');
        return saved ? JSON.parse(saved) : null;
    }

    async getUsers() {
        // Mock users list
        return [
            { id: '1', name: 'Admin User', email: 'admin@lab.com', roleId: '1', status: 'Active', lastLogin: '2023-12-01 08:00' },
            { id: '2', name: 'Dra. Ana Pérez', email: 'ana.perez@lab.com', roleId: '2', status: 'Active', lastLogin: '2023-12-01 09:30' },
            { id: '3', name: 'Téc. Juan Soto', email: 'juan.soto@lab.com', roleId: '3', status: 'Active', lastLogin: '2023-12-01 07:45' },
            { id: '4', name: 'Carlos Mensajero', email: 'carlos.mensajero@lab.com', roleId: '4', status: 'Active', lastLogin: '2023-12-01 10:00' }
        ];
    }

    async getRoles() {
        return [
            { id: '1', name: 'Administrador', permissions: { dashboard: { read: true, write: true, delete: true }, patients: { read: true, write: true, delete: true }, cases: { read: true, write: true, delete: true }, reports: { read: true, write: true, delete: true }, settings: { read: true, write: true, delete: true }, security: { read: true, write: true, delete: true }, financials: { read: true, write: true, delete: true } } },
            { id: '2', name: 'Patólogo', permissions: { dashboard: { read: true }, patients: { read: true }, cases: { read: true, write: true }, reports: { read: true, write: true }, settings: { read: true }, security: { read: false }, financials: { read: false } } },
            { id: '3', name: 'Técnico', permissions: { dashboard: { read: true }, patients: { read: true, write: true }, cases: { read: true, write: true }, reports: { read: false }, settings: { read: false }, security: { read: false }, financials: { read: false } } },
            { id: '4', name: 'Repartidor', permissions: { dashboard: { read: true }, logistics: { read: true, write: true } } }
        ];
    }

    // --- Patients ---
    async getPatients() {
        await this._delay();
        const saved = localStorage.getItem('app_patients');
        return saved ? JSON.parse(saved) : MOCK_PATIENTS;
    }

    async addPatient(patient) {
        await this._delay();
        const patients = await this.getPatients();
        const newPatients = [patient, ...patients];
        localStorage.setItem('app_patients', JSON.stringify(newPatients));
        return patient;
    }

    async updatePatient(patient) {
        await this._delay();
        const patients = await this.getPatients();
        const newPatients = patients.map(p => p.id === patient.id ? patient : p);
        localStorage.setItem('app_patients', JSON.stringify(newPatients));
        return patient;
    }

    // --- Cases ---
    async getCases() {
        await this._delay();
        const saved = localStorage.getItem('app_cases');
        return saved ? JSON.parse(saved) : MOCK_CASES;
    }

    async getCase(id) {
        const cases = await this.getCases();
        return cases.find(c => c.id === id);
    }

    async addCase(newCase) {
        await this._delay();
        const cases = await this.getCases();
        const updatedCases = [newCase, ...cases];
        localStorage.setItem('app_cases', JSON.stringify(updatedCases));
        return newCase;
    }

    async updateCase(updatedCase) {
        await this._delay();
        const cases = await this.getCases();
        const newCases = cases.map(c => c.id === updatedCase.id ? updatedCase : c);
        localStorage.setItem('app_cases', JSON.stringify(newCases));
        return updatedCase;
    }

    async deleteCase(id) {
        await this._delay();
        const cases = await this.getCases();
        const newCases = cases.filter(c => c.id !== id);
        localStorage.setItem('app_cases', JSON.stringify(newCases));
        return true;
    }

    async getGlobalCases() {
        await this._delay();
        const saved = localStorage.getItem('app_global_cases');
        return saved ? JSON.parse(saved) : MOCK_GLOBAL_CASES;
    }

    async publishToGlobal(caseId, description) {
        await this._delay();
        const cases = await this.getCases();
        const localCase = cases.find(c => c.id === caseId);
        if (!localCase) throw new Error('Case not found');

        const globalEntry = {
            id: `GL-${Date.now().toString().substr(-4)}`,
            diagnosis: localCase.diagnosis || 'Diagnóstico no especificado',
            organ: localCase.organ,
            institution: 'Laboratorio Patología Digital',
            country: 'República Dominicana',
            description: description || localCase.clinicalData || 'Sin descripción.',
            imageUrl: localCase.images?.[0]?.url || 'https://via.placeholder.com/640x480',
            likes: 0,
            comments: 0,
            date: new Date().toISOString().split('T')[0],
            originalCaseId: localCase.id
        };

        const globalCases = await this.getGlobalCases();
        localStorage.setItem('app_global_cases', JSON.stringify([globalEntry, ...globalCases]));
        return { success: true, globalId: globalEntry.id };
    }

    // --- Audit Log ---
    async getGlobalAuditLog() {
        const saved = localStorage.getItem('app_global_audit_log');
        return saved ? JSON.parse(saved) : [];
    }

    async addAuditLog(logEntry) {
        const logs = await this.getGlobalAuditLog();
        localStorage.setItem('app_global_audit_log', JSON.stringify([logEntry, ...logs]));
        return logEntry;
    }

    // --- Settings ---
    async getSettings() {
        const defaultSettings = {
            labName: 'Laboratorio Patología Digital',
            address: 'Av. Principal 123, Ciudad Médica',
            phone: '(555) 123-4567',
            email: 'contacto@labpatologia.com',
            logo: null,
            openaiApiKey: '',
            aiEnabled: true,
            enableLabWorkflow: true,
            enableMicrophone: false,
            requireInternalQRScan: false,
            printImagesInReport: true,
            paperSize: 'A4',
            printerConfig: {
                printers: [
                    { id: '1', name: 'Zebra ZD420 (Default)', type: 'Label', connection: 'USB', driver: 'ZPL', status: 'Online' },
                    { id: '2', name: 'HP LaserJet (Default)', type: 'Report', connection: 'System', driver: 'PDF', status: 'Online' }
                ],
                autoPrintLabels: false
            }
        };
        const saved = localStorage.getItem('app_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    async updateSettings(settings) {
        await this._delay();
        const current = await this.getSettings();
        const newSettings = { ...current, ...settings };
        localStorage.setItem('app_settings', JSON.stringify(newSettings));
        return newSettings;
    }

    async getConfigHistory() {
        const saved = localStorage.getItem('app_config_history');
        return saved ? JSON.parse(saved) : [];
    }

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
        const saved = localStorage.getItem('app_deliveries');
        return saved ? JSON.parse(saved) : [];
    }

    async addDelivery(delivery) {
        const deliveries = await this.getDeliveries();
        localStorage.setItem('app_deliveries', JSON.stringify([delivery, ...deliveries]));
        return delivery;
    }

    // --- Catalogs ---
    async getInsurers() {
        return [
            { id: '1', name: 'ARS Humano', tariff: '80%' },
            { id: '2', name: 'ARS Palic', tariff: '100%' },
            { id: '3', name: 'ARS Universal', tariff: 'Fixed $1500' }
        ];
    }

    async getOrgans() {
        return [
            { id: '1', name: 'Piel' },
            { id: '2', name: 'Mama' },
            { id: '3', name: 'Estómago' },
            { id: '4', name: 'Colon' },
            { id: '5', name: 'Próstata' },
            { id: '6', name: 'Tiroides' },
            { id: '7', name: 'Ganglio Linfático' },
            { id: '99', name: 'Por definir (Macro)' }
        ];
    }

    async getDoctors() {
        return [
            { id: '1', name: 'Dr. Alejandro Pérez', license: 'MP 12345', email: 'alejandro.perez@lab.com' }
        ];
    }

    async getEquipment() {
        return [
            { id: '1', name: 'Microtomo Leica RM2235', type: 'Microtomo', status: 'Online' },
            { id: '2', name: 'Procesador de Tejidos Leica ASP300', type: 'Procesador', status: 'Processing' },
            { id: '3', name: 'Escáner Aperio GT 450', type: 'Escáner WSI', status: 'Online' },
            { id: '4', name: 'Teñidor Automático Sakura', type: 'Teñidor', status: 'Maintenance' }
        ];
    }

    async getExams() {
        return [
            { id: '1', code: '88305', name: 'Biopsia Nivel IV', pricePrivate: 2500 },
            { id: '2', code: '88307', name: 'Biopsia Nivel V', pricePrivate: 4500 },
            { id: '3', code: '88112', name: 'Citología Líquida', pricePrivate: 1200 },
            { id: '4', code: '88342', name: 'Inmunohistoquímica', pricePrivate: 3000 },
            { id: '5', code: 'GEN', name: 'Biopsia', pricePrivate: 3500 }
        ];
    }

    // Stub methods for catalog mutations (in demo these might just be in-memory or ignored if not critical)
    async addInsurer(i) { return i; }
    async updateInsurer(i) { return i; }
    async deleteInsurer(id) { return true; }

    async addOrgan(o) { return o; }
    async updateOrgan(o) { return o; }
    async deleteOrgan(id) { return true; }

    async addDoctor(d) { return d; }
    async updateDoctor(d) { return d; }
    async deleteDoctor(id) { return true; }

    async addEquipment(e) { return e; }
    async updateEquipment(e) { return e; }
    async deleteEquipment(id) { return true; }

    async addExam(e) { return e; }
    async updateExam(e) { return e; }
    async deleteExam(id) { return true; }
}

export default DemoDataProvider;
