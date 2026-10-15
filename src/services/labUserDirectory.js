const LEGACY_ROLES = { admin: '1', pathologist: '2', technician: '3', courier: '4' };
export function managedLabUser(profile) {
    return {
        id: profile.id,
        name: profile.full_name || '',
        email: profile.email || '',
        roleId: profile.role === 'admin' ? '1' : profile.permission_role_id || LEGACY_ROLES[profile.role] || '',
        status: profile.role === 'viewer' ? 'Pending' : profile.is_active ? 'Active' : 'Inactive',
        profileRole: profile.role,
        emailConfirmed: profile.email_confirmed === true,
        lastLogin: profile.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleString('es-DO') : ''
    };
}
