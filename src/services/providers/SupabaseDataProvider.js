import DataProvider from './DataProvider';
import { supabase } from '../supabaseClient';

class SupabaseDataProvider extends DataProvider {
    constructor() {
        super();
        console.log("Initializing SupabaseDataProvider (Production)...");
    }

    // --- Authentication & Users ---
    async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, message: error.message };
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return { success: true, user: { ...data.user, ...profile } };
    }

    async logout() {
        const { error } = await supabase.auth.signOut();
        return !error;
    }

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        return { ...user, ...profile };
    }

    // --- Patients ---
    async getPatients() {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('full_name');
        if (error) throw error;
        return data;
    }

    async addPatient(patient) {
        const { data, error } = await supabase
            .from('patients')
            .insert([{
                full_name: patient.name || patient.full_name,
                birth_date: patient.birth_date || null,
                identification_number: patient.identification_number || null,
                sex: patient.sex || 'Otro',
                city: patient.city || null,
                region: patient.region || null,
                medical_history: patient.history || patient.medical_history || null
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async updatePatient(patient) {
        const { data, error } = await supabase
            .from('patients')
            .update({
                full_name: patient.full_name,
                sex: patient.sex,
                city: patient.city,
                region: patient.region,
                medical_history: patient.medical_history
            })
            .eq('id', patient.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // --- Cases ---
    async getCases() {
        const { data, error } = await supabase
            .from('cases')
            .select('*, patients(*), ars_providers(*)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    async getCase(id) {
        const { data, error } = await supabase
            .from('cases')
            .select('*, patients(*), ars_providers(*), case_tracking(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    async addCase(newCase) {
        // En un entorno real, el case_number podría ser autogenerado por una función de DB o aquí
        const { data, error } = await supabase
            .from('cases')
            .insert([{
                case_number: newCase.case_number || newCase.id || `C-${Date.now()}`,
                patient_id: newCase.patient_id || newCase.patientId,
                type: newCase.type,
                organ: newCase.organ,
                status: newCase.status || 'Borrador',
                current_stage: newCase.current_stage || newCase.stage || 'recepcion',
                payment_method: newCase.payment_method || newCase.paymentType || 'Privado',
                total_cost: newCase.total_cost || newCase.cost || 0,
                metadata: newCase.metadata || newCase.tracking || {}
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async updateCase(updatedCase) {
        const { data, error } = await supabase
            .from('cases')
            .update({
                status: updatedCase.status,
                current_stage: updatedCase.current_stage || updatedCase.stage,
                diagnosis: updatedCase.diagnosis,
                total_cost: updatedCase.total_cost || updatedCase.cost,
                metadata: updatedCase.metadata
            })
            .eq('id', updatedCase.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // --- Global Cases ---
    async getGlobalCases() {
        const { data, error } = await supabase
            .from('global_cases')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    // --- Audit Log ---
    async getGlobalAuditLog() {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, profiles(full_name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    // --- Catalogs ---
    async getInsurers() {
        const { data, error } = await supabase
            .from('ars_providers')
            .select('*')
            .eq('is_active', true)
            .order('name');
        if (error) throw error;
        return data;
    }

    // --- Settings & Lab Info ---
    async getSettings() {
        try {
            const { data, error } = await supabase
                .from('lab_info')
                .select('*')
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            
            if (!data) {
                return {
                    labName: 'Laboratorio de Patología',
                    address: '',
                    phone: '',
                    email: '',
                    logo_url: '',
                    aiEnabled: true
                };
            }

            return {
                labName: data.name,
                address: data.address,
                phone: data.phone,
                email: data.email,
                logo_url: data.logo_url,
                ...data.settings
            };
        } catch (error) {
            console.error("Error fetching settings:", error);
            return { labName: 'Laboratorio de Patología', aiEnabled: true };
        }
    }

    async updateSettings(newSettings) {
        try {
            // Check if record exists
            const { data: existing } = await supabase.from('lab_info').select('id').limit(1).maybeSingle();

            const payload = {
                name: newSettings.labName,
                address: newSettings.address,
                phone: newSettings.phone,
                email: newSettings.email,
                logo_url: newSettings.logo_url,
                settings: {
                    aiEnabled: newSettings.aiEnabled,
                    enableLabWorkflow: newSettings.enableLabWorkflow,
                    requireStepQR: newSettings.requireStepQR
                }
            };

            if (existing) {
                const { error } = await supabase
                    .from('lab_info')
                    .update(payload)
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('lab_info')
                    .insert([payload]);
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error("Error updating settings:", error);
            throw error;
        }
    }

    async getConfigHistory() { return []; }
    async getConnectionConfig() { return null; }

    // --- Logistics ---
    async getDeliveries() { return []; }

    // --- Catalogs ---
    async getOrgans() { return []; }
    async getDoctors() { return []; }
    async getEquipment() { return []; }
    async getRoles() { return []; }
    async getUsers() { return []; }
    async getExams() { return []; }
    async getCenters() { return []; }
}

export default SupabaseDataProvider;
