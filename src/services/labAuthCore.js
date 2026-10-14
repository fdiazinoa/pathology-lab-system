const roles = { admin: '1', administrador: '1', pathologist: '2', patologo: '2', 'patólogo': '2', technician: '3', tecnico: '3', 'técnico': '3', courier: '4', repartidor: '4' };
export const createLabAuth = (client) => ({
    async google() {
        const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
        return data;
    },
    async register({ name, email, password }) {
        const { error } = await client.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
        // Registration never grants a role or an application session.
        await client.auth.signOut();
    },
    async authorizedUser() {
        const { data, error } = await client.auth.getUser();
        if (error || !data?.user) return null;
        const { data: profile, error: profileError } = await client.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        if (profileError) throw new Error('No se pudo verificar su autorización. Contacte al administrador para completar la configuración de usuarios.');
        const roleId = roles[profile?.role?.toLowerCase()] || (['1', '2', '3', '4'].includes(profile?.roleId) ? profile.roleId : null);
        if (!profile || !roleId || profile.is_active === false || (profile.status && !['Active', 'Activo'].includes(profile.status))) return null;
        return { id: data.user.id, email: data.user.email, name: profile.full_name, roleId: roleId === '1' ? '1' : profile.permission_role_id || roleId };
    },
    async password(email, password) {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) return { success: false, message: error.message };
        try {
            const user = await this.authorizedUser();
            if (user) return { success: true, user };
            await client.auth.signOut();
            return { success: false, message: 'Su cuenta está pendiente de autorización por el administrador.' };
        } catch (error) {
            await client.auth.signOut();
            return { success: false, message: error.message };
        }
    }
});
