/**
 * Base DataProvider class defining the interface for data access.
 * All methods should return Promises.
 */
class DataProvider {
    constructor() {
        if (this.constructor === DataProvider) {
            throw new Error("Abstract class 'DataProvider' cannot be instantiated directly.");
        }
    }

    // --- Authentication & Users ---
    async login(email, password) { throw new Error("Method 'login' must be implemented."); }
    async loginWithGoogle(credentialResponse) { throw new Error("Method 'loginWithGoogle' must be implemented."); }
    async logout() { throw new Error("Method 'logout' must be implemented."); }
    async getCurrentUser() { throw new Error("Method 'getCurrentUser' must be implemented."); }
    async getUsers() { throw new Error("Method 'getUsers' must be implemented."); }
    async addUser(user) { throw new Error("Method 'addUser' must be implemented."); }
    async updateUser(user) { throw new Error("Method 'updateUser' must be implemented."); }
    async deleteUser(id) { throw new Error("Method 'deleteUser' must be implemented."); }
    async getRoles() { throw new Error("Method 'getRoles' must be implemented."); }
    async addRole(role) { throw new Error("Method 'addRole' must be implemented."); }
    async updateRole(role) { throw new Error("Method 'updateRole' must be implemented."); }
    async deleteRole(id) { throw new Error("Method 'deleteRole' must be implemented."); }

    // --- Patients ---
    async getPatients() { throw new Error("Method 'getPatients' must be implemented."); }
    async addPatient(patient) { throw new Error("Method 'addPatient' must be implemented."); }
    async updatePatient(patient) { throw new Error("Method 'updatePatient' must be implemented."); }

    // --- Cases ---
    async getCases() { throw new Error("Method 'getCases' must be implemented."); }
    async getCase(id) { throw new Error("Method 'getCase' must be implemented."); }
    async addCase(newCase) { throw new Error("Method 'addCase' must be implemented."); }
    async updateCase(updatedCase) { throw new Error("Method 'updateCase' must be implemented."); }
    async deleteCase(id) { throw new Error("Method 'deleteCase' must be implemented."); }
    async getGlobalCases() { throw new Error("Method 'getGlobalCases' must be implemented."); }
    async publishToGlobal(caseId, description) { throw new Error("Method 'publishToGlobal' must be implemented."); }

    // --- Audit Log ---
    async getGlobalAuditLog() { throw new Error("Method 'getGlobalAuditLog' must be implemented."); }
    async addAuditLog(logEntry) { throw new Error("Method 'addAuditLog' must be implemented."); }

    // --- Settings & Configuration ---
    async getSettings() { throw new Error("Method 'getSettings' must be implemented."); }
    async updateSettings(settings) { throw new Error("Method 'updateSettings' must be implemented."); }
    async getConfigHistory() { throw new Error("Method 'getConfigHistory' must be implemented."); }
    async getConnectionConfig() { throw new Error("Method 'getConnectionConfig' must be implemented."); }
    async saveConnectionConfig(config) { throw new Error("Method 'saveConnectionConfig' must be implemented."); }

    // --- Logistics ---
    async getDeliveries() { throw new Error("Method 'getDeliveries' must be implemented."); }
    async addDelivery(delivery) { throw new Error("Method 'addDelivery' must be implemented."); }

    // --- Catalogs (Insurers, Organs, Doctors, Equipment, Exams) ---
    async getInsurers() { throw new Error("Method 'getInsurers' must be implemented."); }
    async addInsurer(insurer) { throw new Error("Method 'addInsurer' must be implemented."); }
    async updateInsurer(insurer) { throw new Error("Method 'updateInsurer' must be implemented."); }
    async deleteInsurer(id) { throw new Error("Method 'deleteInsurer' must be implemented."); }

    async getOrgans() { throw new Error("Method 'getOrgans' must be implemented."); }
    async addOrgan(organ) { throw new Error("Method 'addOrgan' must be implemented."); }
    async updateOrgan(organ) { throw new Error("Method 'updateOrgan' must be implemented."); }
    async deleteOrgan(id) { throw new Error("Method 'deleteOrgan' must be implemented."); }

    async getDoctors() { throw new Error("Method 'getDoctors' must be implemented."); }
    async addDoctor(doctor) { throw new Error("Method 'addDoctor' must be implemented."); }
    async updateDoctor(doctor) { throw new Error("Method 'updateDoctor' must be implemented."); }
    async deleteDoctor(id) { throw new Error("Method 'deleteDoctor' must be implemented."); }

    async getEquipment() { throw new Error("Method 'getEquipment' must be implemented."); }
    async addEquipment(item) { throw new Error("Method 'addEquipment' must be implemented."); }
    async updateEquipment(item) { throw new Error("Method 'updateEquipment' must be implemented."); }
    async deleteEquipment(id) { throw new Error("Method 'deleteEquipment' must be implemented."); }

    async getExams() { throw new Error("Method 'getExams' must be implemented."); }
    async addExam(exam) { throw new Error("Method 'addExam' must be implemented."); }
    async updateExam(exam) { throw new Error("Method 'updateExam' must be implemented."); }
    async deleteExam(id) { throw new Error("Method 'deleteExam' must be implemented."); }
}

export default DataProvider;
