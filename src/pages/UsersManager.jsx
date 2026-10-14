import React, { useState } from 'react';
import { User, Mail, Shield, Edit, Trash2, Plus, Save, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useData } from '../services/DataContext';

const UsersManager = () => {
    const { users, roles, addUser, updateUser, deleteUser, can, isCloudMode } = useData();
    const [error, setError] = useState('');
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
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            if (editingUser) await updateUser(formData); else await addUser(formData);
            setIsModalOpen(false);
        } catch (failure) { setError(failure.message); }
        finally { setSaving(false); }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Usuarios</h1>
                    <p className="text-text-secondary">Administre los usuarios y sus asignaciones de roles.</p>
                </div>
                <Button permission={['users', 'create']} disabled={isCloudMode} onClick={() => handleOpenModal()}>
                    <Plus size={20} className="mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {isCloudMode && <p className="text-sm text-text-secondary">Los usuarios se registran desde el acceso al sistema. Aquí puede asignarles un rol y activar o desactivar su acceso.</p>}
            {error && <p role="alert" className="text-red-700">{error}</p>}
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
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                <Shield size={12} />
                                                {role?.name || 'Sin Rol'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {user.status === 'Active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-text-secondary">
                                            {user.lastLogin || 'Nunca'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    disabled={!['edit', 'assignRole', 'deactivate'].some(a => can('users', a))}
                                                    onClick={() => handleOpenModal(user)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    disabled={!can('users', 'deactivate')}
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
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                showFooter={false}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        disabled={!can('users', 'edit')}
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
                                disabled={!can('users', 'assignRole') || editingUser?.profileRole === 'admin'}
                                value={formData.roleId}
                                onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Rol...</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
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
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={saving}>
                            <Save size={18} className="mr-2" />
                            Guardar Usuario
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UsersManager;
