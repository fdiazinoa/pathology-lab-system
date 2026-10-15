import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { ORGAN_GROUPS } from '../services/organGroups';
import { useData } from '../services/DataContext';

const OrgansManager = () => {
    const { organs, addOrgan, updateOrgan, deleteOrgan, can } = useData();
    const [isEditing, setIsEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', procedure_type: 'Biopsia', anatomical_group: '', classification_review_required: false });
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('');
    const [needsReview, setNeedsReview] = useState(false);
    const [procedure, setProcedure] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    const filteredOrgans = organs.filter(organ => (!procedure || organ.procedure_type === procedure) && (!group || organ.anatomical_group === group) && (!needsReview || organ.classification_review_required) && terms.every(term => normalize([organ.code, organ.id, organ.name, organ.original_code, organ.procedure_type, organ.anatomical_group].join(' ')).includes(term)));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true); setError('');
        try {
            if (isEditing) await updateOrgan({ ...formData, id: isEditing });
            else await addOrgan(formData);
            cancelEdit();
        } catch (error) {
            setError(error.message || 'No se pudo guardar la localización.');
        } finally { setSaving(false); }
    };

    const handleEdit = (organ) => {
        setError('');
        setFormData({ name: organ.name, procedure_type: organ.procedure_type || 'Biopsia', anatomical_group: organ.anatomical_group || 'Patología Quirúrgica', classification_review_required: organ.classification_review_required === true });
        setIsEditing(organ.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este órgano?')) {
            deleteOrgan(id);
        }
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setShowForm(false);
        setError('');
        setFormData({ name: '', procedure_type: 'Biopsia', anatomical_group: '', classification_review_required: false });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Gestión de Órganos</h1>
                    <p className="text-text-secondary">Administra la lista de órganos y localizaciones.</p>
                </div>
                {!showForm && (
                    <Button permission={['organs', 'create']} onClick={() => setShowForm(true)}>
                        <Plus size={18} className="mr-2" />
                        Nuevo Órgano
                    </Button>
                )}
            </div>

            {showForm && (
                <Card title={isEditing ? "Editar Órgano" : "Nuevo Órgano"} className="animate-fade-in border-primary/20 ring-4 ring-primary/5">
                    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Input
                                label="Nombre del Órgano / Localización"
                                placeholder="Ej. Piel, Mama, Estómago"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <label className="flex flex-col gap-1.5 text-sm font-medium w-full md:w-auto">Procedimiento
                            <select value={formData.procedure_type} onChange={event => setFormData({ ...formData, procedure_type: event.target.value })} required disabled={saving}
                                className="rounded-md border border-border bg-white px-3 py-2">
                                {['Biopsia', 'Citología', 'Líquido'].map(type => <option key={type}>{type}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium">Grupo anatómico
                            <select required disabled={saving} value={formData.anatomical_group} onChange={event => setFormData({ ...formData, anatomical_group: event.target.value, classification_review_required: false })} className="rounded-md border border-border bg-white px-3 py-2">
                                <option value="">Seleccionar grupo…</option>{ORGAN_GROUPS.map(value => <option key={value}>{value}</option>)}
                            </select>
                        </label>
                        <label className="inline-flex gap-2 items-center text-sm pb-2"><input type="checkbox" disabled={saving} checked={formData.classification_review_required} onChange={event => setFormData({ ...formData, classification_review_required: event.target.checked })} />Requiere revisión de clasificación</label>
                        <div className="flex gap-2 pb-1">
                            <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving} aria-label="Cancelar edición">
                                <X size={18} />
                            </Button>
                            <Button type="submit" isLoading={saving}>
                                <Save size={18} className="mr-2" />
                                Guardar
                            </Button>
                        </div>
                    </form>
                    {error && <p role="alert" className="text-red-700 mt-3">{error}</p>}
                </Card>
            )}

            <div className="space-y-3">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Grupos anatómicos">
                    {['', ...ORGAN_GROUPS].map(value => <button key={value} type="button" aria-pressed={group === value} onClick={() => setGroup(value)} className={`rounded-lg border px-3 py-2 text-sm ${group === value ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white'}`}>{value || 'Todos'} ({organs.filter(o => !value || o.anatomical_group === value).length})</button>)}
                </div>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={needsReview} onChange={event => setNeedsReview(event.target.checked)} />Solo pendientes de revisión ({organs.filter(o => o.classification_review_required).length})</label>
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <div className="relative w-full md:max-w-lg">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                        <input type="search" aria-label="Buscar órganos" value={search} onChange={event => setSearch(event.target.value)}
                            placeholder="Buscar por nombre, consecutivo o código original..."
                            className="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2 text-sm" />
                    </div>
                    <select aria-label="Filtrar por procedimiento" value={procedure} onChange={event => setProcedure(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
                        <option value="">Todos los procedimientos</option>
                        {['Biopsia', 'Citología', 'Líquido'].map(type => <option key={type}>{type}</option>)}
                    </select>
                    <p role="status" className="text-sm text-text-secondary md:ml-auto whitespace-nowrap">{filteredOrgans.length} de {organs.length} localizaciones</p>
                </div>
                <div className="overflow-auto max-h-[70vh] rounded-lg border border-border bg-white">
                    <table className="w-full min-w-[700px] text-sm text-left">
                        <caption className="sr-only">Maestro de órganos y localizaciones</caption>
                        <thead className="sticky top-0 bg-gray-50 text-text-secondary"><tr>
                            {['Consecutivo', 'Órgano / Localización', 'Grupo anatómico', 'Procedimiento', 'Código original', 'Acciones'].map(title => <th key={title} scope="col" className="px-4 py-3 font-semibold border-b border-border">{title}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrgans.map(organ => <tr key={organ.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">{organ.code || organ.id}</td>
                                <th scope="row" className="px-4 py-3 font-semibold">{organ.name}</th>
                                <td className="px-4 py-3 text-text-secondary">{organ.anatomical_group || 'Sin clasificar'}{organ.classification_review_required && <span className="block text-xs text-amber-700">Por revisar</span>}</td>
                                <td className="px-4 py-3 text-text-secondary">{organ.procedure_type || '—'}</td>
                                <td className="px-4 py-3 text-text-secondary">{organ.original_code || '—'}</td>
                                <td className="px-4 py-3"><div className="flex gap-1">
                                    <button disabled={!can('organs', 'edit')} onClick={() => handleEdit(organ)} aria-label={`Editar ${organ.name}`} title="Editar" className="p-2 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-md"><Edit2 size={16} /></button>
                                    <button disabled={!can('organs', 'delete')} onClick={() => handleDelete(organ.id)} aria-label={`Eliminar ${organ.name}`} title="Eliminar" className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
                                </div></td>
                            </tr>)}
                            {filteredOrgans.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-text-secondary">{organs.length ? 'No se encontraron localizaciones con esos filtros.' : 'No hay órganos registrados.'}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrgansManager;
