import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Save } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useData } from '../services/DataContext';
import { PERMISSION_SECTIONS, ACTION_LABELS, emptyPermissions, normalizePermissions } from '../services/permissions';

export default function RolesManager() {
    const { roles = [], addRole, updateRole, deleteRole, can } = useData();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', permissions: emptyPermissions() });
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const show = (role) => {
        setEditing(role || null);
        setForm(role ? { ...role, permissions: normalizePermissions(role.permissions) } : { name: '', description: '', permissions: emptyPermissions() });
        setError(''); setSearch(''); setOpen(true);
    };
    const toggle = (section, action) => setForm(previous => {
        const permissions = structuredClone(previous.permissions);
        const enabled = !permissions[section][action];
        permissions[section][action] = enabled;
        if (enabled) permissions[section].read = true;
        if (action === 'read' && !enabled) for (const key of Object.keys(permissions[section])) permissions[section][key] = false;
        return { ...previous, permissions };
    });
    const save = async (event) => {
        event.preventDefault(); setSaving(true); setError('');
        try {
            if (editing) await updateRole(form); else await addRole(form);
            setOpen(false);
        } catch (failure) { setError(failure.message); }
        finally { setSaving(false); }
    };
    const remove = async (role) => {
        if (!window.confirm(`¿Eliminar el rol ${role.name}?`)) return;
        try { await deleteRole(role.id); } catch (failure) { setError(failure.message); }
    };
    const writable = editing?.id !== '1' && can('roles', editing ? 'edit' : 'create');
    return <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
            <div><h1 className="text-2xl font-bold">Roles y permisos</h1><p className="text-text-secondary">Configure qué puede ver y hacer cada perfil en cada sección.</p></div>
            <Button permission={['roles', 'create']} onClick={() => show()}><Plus size={18} className="mr-2" />Nuevo rol</Button>
        </div>
        {error && !open && <p role="alert" className="text-red-700">{error}</p>}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{roles.map(role => <Card key={role.id}>
            <div className="flex justify-between gap-2"><div><Shield className="text-primary mb-3" /><h2 className="font-bold">{role.name}</h2><p className="text-sm text-text-secondary">{role.description}</p></div>
                <div className="flex items-start gap-2"><button aria-label={`Ver permisos de ${role.name}`} onClick={() => show(role)} className="p-2"><Edit size={18} /></button>
                    {!role.is_system && !['1','2','3','4'].includes(role.id) && <button aria-label={`Eliminar ${role.name}`} disabled={!can('roles', 'delete')} onClick={() => remove(role)} className="p-2 disabled:opacity-30"><Trash2 size={18} /></button>}</div></div>
            <div className="flex flex-wrap gap-1 mt-4">{PERMISSION_SECTIONS.filter(s => role.id === '1' || normalizePermissions(role.permissions)[s.id].read).map(s => <span className="text-xs bg-slate-100 px-2 py-1 rounded" key={s.id}>{s.label}</span>)}</div>
        </Card>)}</div>
        <Modal isOpen={open} onClose={() => !saving && setOpen(false)} title={editing ? `Permisos: ${editing.name}` : 'Nuevo rol'} maxWidth="max-w-4xl" showFooter={false}>
            <form onSubmit={save} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4"><Input label="Nombre del rol" required value={form.name} disabled={!writable} onChange={e => setForm({ ...form, name: e.target.value })} /><Input label="Descripción" value={form.description} disabled={!writable} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <p className="text-sm bg-blue-50 text-blue-900 p-3 rounded">{editing?.id === '1' ? 'El administrador del sistema conserva acceso completo y está protegido.' : 'Cada acción se concede por separado. Quitar «Ver» desactiva las acciones de esa sección. Los roles nuevos comienzan sin acceso.'}</p>
                <Input label="Buscar sección" placeholder="Ej.: informes, plantillas, doctores…" value={search} onChange={e => setSearch(e.target.value)} />
                <div className="divide-y border rounded-lg">{PERMISSION_SECTIONS.filter(s => s.label.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(s => <fieldset key={s.id} disabled={!writable || saving} className="p-4">
                    <legend className="font-semibold px-1">{s.label}</legend><div className="flex flex-wrap gap-x-6 gap-y-3">{s.actions.map(a => <label key={a} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editing?.id === '1' || form.permissions[s.id]?.[a] === true} onChange={() => toggle(s.id, a)} className="w-4 h-4" />{ACTION_LABELS[a]}</label>)}</div>
                </fieldset>)}</div>
                {error && <p role="alert" className="text-red-700">{error}</p>}
                <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cerrar</Button>{writable && <Button type="submit" isLoading={saving}><Save size={18} className="mr-2" />Guardar permisos</Button>}</div>
            </form>
        </Modal>
    </div>;
}
