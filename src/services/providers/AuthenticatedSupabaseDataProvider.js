import SupabaseDataProvider from './SupabaseDataProvider';
import { supabase } from '../supabaseClient';
import { labAuth } from '../supabaseAuth';

// Keep cloud authorization independent of local demo sessions.
export default class AuthenticatedSupabaseDataProvider extends SupabaseDataProvider {
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
