import SupabaseDataProvider from './SupabaseDataProvider';
import { labAuth } from '../supabaseAuth';

// Keep cloud authorization independent of local demo sessions.
export default class AuthenticatedSupabaseDataProvider extends SupabaseDataProvider {
    async login(email, password) { return labAuth.password(email, password); }
    async getCurrentUser() {
        try { return await labAuth.authorizedUser(); }
        catch { return null; }
    }
}
