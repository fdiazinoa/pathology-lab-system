import React, { useState } from 'react';
import { DollarSign, Plus, Edit, Trash2, Search, FileText, CreditCard } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useData } from '../services/DataContext';

const TariffsManager = () => {
    const { exams, addExam, updateExam, deleteExam, can } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        pricePrivate: '',
        priceInsurance: ''
    });

    const handleOpenModal = (exam = null) => {
        setSaveError('');
        if (exam) {
            setEditingExam(exam);
            setFormData({ ...exam, description: exam.description || '', pricePrivate: exam.pricePrivate ?? exam.price_private ?? '', priceInsurance: exam.priceInsurance ?? exam.price_insurance ?? '' });
        } else {
            setEditingExam(null);
            setFormData({
                code: '',
                name: '',
                description: '',
                pricePrivate: '',
                priceInsurance: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaveError('');
        const dataToSave = {
            ...formData,
            pricePrivate: Number(formData.pricePrivate),
            priceInsurance: Number(formData.priceInsurance)
        };

        if ([formData.pricePrivate, formData.priceInsurance].some(value => String(value ?? '').trim() === '') ||
            ![dataToSave.pricePrivate, dataToSave.priceInsurance].every(price => Number.isFinite(price) && price >= 0)) {
            setSaveError('Ingrese precios válidos mayores o iguales a cero.');
            return;
        }
        setSaving(true);
        try {
            if (editingExam) await updateExam(dataToSave);
            else await addExam(dataToSave);
            setIsModalOpen(false);
        } catch (error) {
            setSaveError(error.message || 'No se pudo guardar la tarifa. Intente nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    const filteredExams = exams.filter(e =>
        (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined || amount === '' || !Number.isFinite(Number(amount))) return 'Sin configurar';
        return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(amount));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Tarifas por Examen</h1>
                    <p className="text-text-secondary">Gestione el catálogo de exámenes y sus precios diferenciados.</p>
                </div>
                <Button permission={['exams', 'create']} onClick={() => handleOpenModal()}>
                    <Plus size={20} className="mr-2" />
                    Nuevo Examen
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por código o nombre..."
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
                                <th className="p-4 font-medium">Código</th>
                                <th className="p-4 font-medium">Examen</th>
                                <th className="p-4 font-medium text-right text-blue-600">Precio Privado</th>
                                <th className="p-4 font-medium text-right text-green-600">Precio Aseguradora</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredExams.map(exam => (
                                <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-sm text-text-secondary">
                                        {exam.code}
                                    </td>
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-text-main">{exam.name}</p>
                                            <p className="text-xs text-text-secondary">{exam.description}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-medium text-text-main">
                                        {formatCurrency(exam.pricePrivate ?? exam.price_private)}
                                    </td>
                                    <td className="p-4 text-right font-medium text-text-main">
                                        {formatCurrency(exam.priceInsurance ?? exam.price_insurance)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                disabled={!can('exams', 'edit')} onClick={() => handleOpenModal(exam)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('¿Eliminar este examen?')) deleteExam(exam.id);
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => { if (!saving) setIsModalOpen(false); }}
                title={editingExam ? "Editar Examen" : "Nuevo Examen"}
                showFooter={false}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <Input
                                label="Código (CPT/CUP)"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                required
                                placeholder="Ej. 88305"
                            />
                        </div>
                        <div className="col-span-2">
                            <Input
                                label="Nombre del Examen"
                                icon={<FileText size={18} />}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <Input
                        label="Descripción"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Breve descripción del procedimiento"
                    />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                                <DollarSign size={16} /> Tarifa Privada
                            </h4>
                            <Input
                                type="number"
                                aria-label="Precio privado"
                                step="0.01"
                                value={formData.pricePrivate}
                                onChange={e => setFormData({ ...formData, pricePrivate: e.target.value })}
                                required
                                placeholder="0.00"
                                min="0"
                            />
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                            <h4 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                                <CreditCard size={16} /> Tarifa Aseguradora
                            </h4>
                            <Input
                                type="number"
                                aria-label="Precio asegurado"
                                step="0.01"
                                value={formData.priceInsurance}
                                onChange={e => setFormData({ ...formData, priceInsurance: e.target.value })}
                                required
                                placeholder="0.00"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" disabled={saving} onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={saving}>
                            {editingExam ? 'Guardar Cambios' : 'Crear Examen'}
                        </Button>
                    </div>
                    {saveError && <p role="alert" className="text-sm text-danger">{saveError}</p>}
                </form>
            </Modal>
        </div>
    );
};

export default TariffsManager;
