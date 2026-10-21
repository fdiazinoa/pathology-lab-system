import { managedLabUser } from '../labUserDirectory';
import { patientFromRow, patientPayload } from '../patientRecords';
import DataProvider from './DataProvider';
import { supabase } from '../supabaseClient';
import { buildLabInfoPayload, labInfoToSettings } from '../labSettings';
import { caseReportMetadata, caseWithReport } from '../caseReportMetadata';
import { caseStage } from '../caseStages';

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
        const { data, error } = await supabase.from('patients').select('*').order('full_name');
        if (error) throw error;
        return data.map(patientFromRow);
    }
    async addPatient(patient) {
        const { data, error } = await supabase.from('patients').insert([patientPayload(patient)]).select().single();
        if (error) throw error;
        return patientFromRow(data);
    }
    async updatePatient(patient) {
        const { data, error } = await supabase.from('patients').update(patientPayload(patient)).eq('id', patient.id).select().single();
        if (error) throw error;
        return patientFromRow(data);
    }

    // --- Cases ---
    async getCases() {
        const cases = [];
        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase.from('cases').select('*, patients(*)')
                .order('created_at', { ascending: false }).order('id')
                .range(offset, offset + pageSize - 1);
            if (error) throw error;
            cases.push(...data.map(caseWithReport));
            if (data.length < pageSize) return cases;
        }
    }

    async getCase(id) {
        const { data, error } = await supabase
            .from('cases')
            .select('*, patients(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return caseWithReport(data);
    }

    async addCase(newCase) {
        // En un entorno real, el case_number podría ser autogenerado por una función de DB o aquí
        const { data, error } = await supabase
            .from('cases')
            .insert([{
                ...(newCase.case_number ? { case_number: newCase.case_number } : {}),
                patient_id: newCase.patient_id || newCase.patientId,
                type: newCase.type,
                organ: newCase.organ,
                diagnosis: newCase.diagnosis || null,
                status: newCase.status || 'Borrador',
                current_stage: caseStage(newCase),
                payment_method: newCase.payment_method || newCase.paymentType || 'Privado',
                total_cost: newCase.total_cost ?? newCase.price ?? newCase.cost ?? 0,
                metadata: caseReportMetadata(newCase)
            }])
            .select('*, patients(*)')
            .single();
        if (error) throw error;
        return caseWithReport(data);
    }

    async updateCase(updatedCase) {
        const { data: existing, error: readError } = await supabase.from('cases').select('metadata').eq('id', updatedCase.id).single();
        if (readError) throw readError;
        const { data, error } = await supabase
            .from('cases')
            .update({
                patient_id: updatedCase.patientId,
                type: updatedCase.type,
                organ: updatedCase.organ,
                payment_method: updatedCase.paymentType,
                status: updatedCase.status,
                current_stage: caseStage(updatedCase),
                diagnosis: updatedCase.diagnosis,
                total_cost: updatedCase.price ?? updatedCase.total_cost ?? updatedCase.cost,
                metadata: caseReportMetadata(updatedCase, existing.metadata || {})
            })
            .eq('id', updatedCase.id)
            .select('*, patients(*)')
            .single();
        if (error) throw error;
        return caseWithReport(data);
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
        const { data, error } = await supabase.from('permission_audit_log').select('*').order('created_at', { ascending: false }).limit(500);
        if (error) throw error;
        return (data || []).map(log => ({ id: log.id, date: log.created_at, user: log.actor || 'Sistema', action: `${log.operation}: ${log.resource}`, details: `Registro ${log.target}: ${JSON.stringify(log.changes)}` }));
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
            const { data: existing, error: readError } = await supabase.from('lab_info').select('*').limit(1).maybeSingle();
            if (readError) throw readError;
            const payload = buildLabInfoPayload(existing, newSettings);

            if (existing) {
                const { error } = await supabase
                    .from('lab_info')
                    .update(payload)
                    .eq('id', existing.id)
                    .select('id')
                    .single();
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('lab_info')
                    .insert([payload]);
                if (error) throw error;
            }
            return labInfoToSettings({ ...existing, ...payload });
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
    async checkPermission(section, action) {
        const { data, error } = await supabase.rpc('has_app_permission', { section_name: section, action_name: action });
        if (error) throw error;
        return data === true;
    }
    async getRoles() {
        const { data, error } = await supabase.from('app_roles').select('*').order('name');
        if (error) throw error;
        return data || [];
    }
    async addRole(role) {
        const { data, error } = await supabase.from('app_roles').insert({ id: crypto.randomUUID(), name: role.name, description: role.description, permissions: role.permissions }).select().single();
        if (error) throw error;
        return data;
    }
    async updateRole(role) {
        const { data, error } = await supabase.from('app_roles').update({ name: role.name, description: role.description, permissions: role.permissions }).eq('id', role.id).select().single();
        if (error) throw error;
        return data;
    }
    async deleteRole(id) {
        const { data, error } = await supabase.from('app_roles').delete().eq('id', id).select('id').single();
        if (error) throw error;
        return data;
    }
    async getUsers() {
        const { data, error } = await supabase.rpc('list_lab_users');
        if (error) throw error;
        return (data || []).map(managedLabUser);
    }
    async admitUser(id, roleId) {
        const { error } = await supabase.rpc('admit_lab_user', { target_user_id: id, selected_role_id: roleId });
        if (error) throw error;
        return (await this.getUsers()).find(user => user.id === id);
    }
    async updateUser(user) {
        const { data, error } = await supabase.from('profiles').update({ full_name: user.name, permission_role_id: user.roleId, is_active: user.status === 'Active' }).eq('id', user.id).select().single();
        if (error) throw error;
        return { ...user, name: data.full_name };
    }
    async deleteUser(id) {
        const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id).select('id').single();
        if (error) throw error;
        return true;
    }
    async getExams() {
        const { data, error } = await supabase.from('exams').select('*').eq('is_active', true).order('name');
        if (error) throw error;
        return data.map(exam => ({ ...exam, pricePrivate: exam.price_private, priceInsurance: exam.price_insurance }));
    }
    async getCenters() { return []; }
}

export default SupabaseDataProvider;
