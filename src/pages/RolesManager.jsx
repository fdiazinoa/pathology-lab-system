import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Check, X, Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useData } from '../services/DataContext';

const MODULES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'patients', label: 'Pacientes' },
    { id: 'cases', label: 'Casos' },
    { id: 'reports', label: 'Reportes' },
    { id: 'settings', label: 'Configuración' },
    { id: 'security', label: 'Seguridad (Usuarios/Roles)' },
    { id: 'financials', label: 'Finanzas / Costos' }
];

const ACTIONS = [
    { id: 'read', label: 'Ver' },
    { id: 'write', label: 'Crear/Editar' },
    { id: 'delete', label: 'Eliminar' }
];

const RolesManager = () => {
    const { roles = [], addRole, updateRole, deleteRole } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: {}
    });

    // Initialize permissions object
    const initialPermissions = {};
    MODULES.forEach(m => {
        initialPermissions[m.id] = { read: false, write: false, delete: false };
    });

    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({ ...role });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                description: '',
                permissions: JSON.parse(JSON.stringify(initialPermissions))
            });
        }
        setIsModalOpen(true);
    };

    const handlePermissionChange = (moduleId, actionId) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleId]: {
                    ...prev.permissions[moduleId],
                    [actionId]: !prev.permissions[moduleId]?.[actionId]
                }
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingRole) {
            updateRole(formData);
        } else {
            addRole(formData);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Roles y Permisos</h1>
                    <p className="text-text-secondary">Defina los perfiles de acceso al sistema.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={20} className="mr-2" />
                    Nuevo Rol
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(roles || []).map(role => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50 border-none shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                                    <Shield size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-text-main tracking-tight">{role.name}</h3>
                                    <p className="text-sm text-text-secondary">{role.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(role)}
                                    className="p-1.5 text-text-tertiary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('¿Seguro que desea eliminar este rol?')) {
                                            deleteRole(role.id);
                                        }
                                    }}
                                    className="p-1.5 text-text-tertiary hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100">
                            <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Acceso a Módulos</h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(role.permissions || {}).map(([module, perms]) => {
                                    if (!perms.read) return null;
                                    const moduleLabel = MODULES.find(m => m.id === module)?.label || module;
                                    return (
                                        <span key={module} className="px-2 py-1 bg-white text-text-secondary text-xs font-medium rounded-full border border-gray-100 shadow-sm">
                                            {moduleLabel}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRole ? "Editar Rol" : "Nuevo Rol"}
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre del Rol"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Descripción"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-text-tertiary font-semibold uppercase tracking-wider text-xs border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Módulo</th>
                                    {ACTIONS.map(action => (
                                        <th key={action.id} className="px-6 py-3 text-center">{action.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {MODULES.map(module => (
                                    <tr key={module.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-text-main">{module.label}</td>
                                        {ACTIONS.map(action => (
                                            <td key={action.id} className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/20 cursor-pointer"
                                                    checked={formData.permissions[module.id]?.[action.id] || false}
                                                    onChange={() => handlePermissionChange(module.id, action.id)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            <Save size={18} className="mr-2" />
                            Guardar Rol
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RolesManager;
