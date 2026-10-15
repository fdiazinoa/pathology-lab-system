import React, { useState } from 'react';
import { User, Mail, Shield, Edit, Trash2, Plus, Save, Search, UserCheck, RefreshCw } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useData } from '../services/DataContext';

const UsersManager = () => {
    const { users, roles, addUser, updateUser, deleteUser, admitUser, refreshUsers, can, isCloudMode } = useData();
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        roleId: '',
        status: 'Active'
    });

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ ...user });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                roleId: '',
                status: 'Active'
            });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            if (editingUser?.status === 'Pending') await admitUser(editingUser.id, formData.roleId);
            else if (editingUser) await updateUser(formData); else await addUser(formData);
            setIsModalOpen(false);
        } catch (failure) { setError(failure.message); }
        finally { setSaving(false); }
    };

    const pending = editingUser?.status === 'Pending';
    const filteredUsers = users.filter(u =>
        (statusFilter === 'all' || u.status === statusFilter) &&
        `${u.name} ${u.email}`.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
    );
    const refresh = async () => {
        setRefreshing(true); setError('');
        try { await refreshUsers(); } catch (failure) { setError(failure.message); }
        finally { setRefreshing(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Usuarios</h1>
                    <p className="text-text-secondary">Administre los usuarios y sus asignaciones de roles.</p>
                </div>
                <div className="flex gap-2">
                <Button variant="secondary" onClick={refresh} isLoading={refreshing}><RefreshCw size={18} className="mr-2" />Actualizar</Button>
                <Button permission={['users', 'create']} disabled={isCloudMode} onClick={() => handleOpenModal()}>
                    <Plus size={20} className="mr-2" />
                    Nuevo Usuario
                </Button>
                </div>
            </div>

            {isCloudMode && <p className="text-sm text-text-secondary">Los usuarios se registran desde el acceso al sistema. Los registros aparecen como pendientes: confirme el correo, seleccione un rol y pulse «Admitir y asignar rol». Después puede modificar o desactivar el acceso.</p>}
            {error && <p role="alert" className="text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar usuarios por estado">
                {[['all', 'Todos'], ['Pending', 'Pendientes de admisión'], ['Active', 'Activos'], ['Inactive', 'Inactivos']].map(([value, label]) => <button type="button" key={value} aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} className={`rounded-lg border px-3 py-2 text-sm ${statusFilter === value ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white'}`}>{label} ({users.filter(u => value === 'all' || u.status === value).length})</button>)}
            </div>
            <Card>
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-text-secondary text-sm border-b border-border">
                                <th className="p-4 font-medium">Usuario</th>
                                <th className="p-4 font-medium">Rol</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium">Último Acceso</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map(user => {
                                const role = roles.find(r => r.id === user.roleId);
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-text-main">{user.name}</p>
                                                    <p className="text-xs text-text-secondary flex items-center gap-1">
                                                        <Mail size={12} /> {user.email}
                                                    </p>
                                                    {isCloudMode && <p className={`text-xs ${user.emailConfirmed ? 'text-green-700' : 'text-amber-700'}`}>{user.emailConfirmed ? 'Correo confirmado' : 'Correo pendiente de confirmación'}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                <Shield size={12} />
                                                {user.status === 'Pending' ? 'Por asignar' : role?.name || 'Sin rol'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {user.status === 'Pending' ? 'Pendiente de admisión' : user.status === 'Active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-text-secondary">
                                            {user.lastLogin || 'Sin acceso registrado'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.status === 'Pending' && <Button size="sm" variant="secondary"
                                                    disabled={!can('users', 'assignRole') || !can('users', 'deactivate')}
                                                    onClick={() => handleOpenModal(user)}><UserCheck size={16} className="mr-1" />Admitir</Button>}
                                                <button
                                                    disabled={user.status === 'Pending' || !['edit', 'assignRole', 'deactivate'].some(a => can('users', a))}
                                                    onClick={() => handleOpenModal(user)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    disabled={user.status === 'Pending' || !can('users', 'deactivate')}
                                                    onClick={async () => {
                                                        if (window.confirm('¿Desactivar usuario?')) { try { await deleteUser(user.id); } catch (failure) { setError(failure.message); } }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Desactivar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-text-secondary">No hay usuarios que coincidan con esta búsqueda.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                showFooter={false}
                isOpen={isModalOpen}
                onClose={() => !saving && setIsModalOpen(false)}
                title={pending ? "Admitir usuario" : editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {pending && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">Esta cuenta todavía no tiene acceso. Seleccione el rol que recibirá al admitirla. {editingUser.emailConfirmed ? 'El correo ya está confirmado.' : 'El usuario debe confirmar su correo antes de ser admitido.'}</p>}
                    {error && <p role="alert" className="text-red-700">{error}</p>}
                    <Input
                        disabled={saving || pending || !can('users', 'edit')}
                        label="Nombre Completo"
                        icon={<User size={18} />}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        disabled={isCloudMode || !can('users', 'edit')}
                        label="Correo Electrónico"
                        type="email"
                        icon={<Mail size={18} />}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required={!isCloudMode}
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-text-secondary">Rol Asignado</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none bg-white"
                                aria-label="Rol asignado"
                                disabled={saving || !can('users', 'assignRole') || editingUser?.profileRole === 'admin'}
                                value={formData.roleId}
                                onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Rol...</option>
                                {roles.filter(role => role.is_active !== false).map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!pending && <div className="space-y-1">
                        <label className="text-sm font-medium text-text-secondary">Estado</label>
                        <select
                            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                            disabled={!can('users', 'deactivate')}
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Active">Activo</option>
                            <option value="Inactive">Inactivo</option>
                        </select>
                    </div>}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" disabled={saving} onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={saving} disabled={pending && (!editingUser.emailConfirmed || !formData.roleId || !can('users', 'assignRole') || !can('users', 'deactivate'))}>
                            <Save size={18} className="mr-2" />
                            {pending ? 'Admitir y asignar rol' : 'Guardar usuario'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UsersManager;
