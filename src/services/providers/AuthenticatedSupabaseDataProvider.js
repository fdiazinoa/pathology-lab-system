import SupabaseDataProvider from './SupabaseDataProvider';
import { supabase } from '../supabaseClient';
import { labAuth } from '../supabaseAuth';

// Keep cloud authorization independent of local demo sessions.
export default class AuthenticatedSupabaseDataProvider extends SupabaseDataProvider {
    async getDoctors() {
        const { data, error } = await supabase.from('doctors').select('*').order('name');
        if (error) throw error;
        return data.map(doctor => ({ ...doctor, signatureUrl: doctor.signature_url, license: doctor.license || '' }));
    }
    async addDoctor(doctor) {
        const { signatureUrl, ...fields } = doctor;
        const { data, error } = await supabase.from('doctors').insert([{ ...fields, signature_url: signatureUrl }]).select().single();
        if (error) throw error;
        return { ...data, signatureUrl: data.signature_url };
    }
    async updateDoctor(doctor) {
        const { id, signatureUrl, ...fields } = doctor;
        const { data, error } = await supabase.from('doctors').update({ ...fields, signature_url: signatureUrl }).eq('id', id).select().single();
        if (error) throw error;
        return { ...data, signatureUrl: data.signature_url };
    }
    async deleteDoctor(id) {
        const { error } = await supabase.from('doctors').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
    async getCenters() {
        const { data, error } = await supabase.from('centers').select('*').order('name');
        if (error) throw error;
        return data;
    }
    async addCenter(center) {
        const { data, error } = await supabase.from('centers').insert([center]).select().single();
        if (error) throw error;
        return data;
    }
    async updateCenter(id, updates) {
        const { data, error } = await supabase.from('centers').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
    async deleteCenter(id) {
        const { error } = await supabase.from('centers').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
    async login(email, password) { return labAuth.password(email, password); }
    async getCurrentUser() {
        try { return await labAuth.authorizedUser(); }
        catch { return null; }
    }
}
