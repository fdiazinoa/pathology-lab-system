import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Server, Activity, Power, Settings, Trash2, RefreshCw, Monitor, Database } from 'lucide-react';
import { useData } from '../services/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';

const EquipmentManager = () => {
    const navigate = useNavigate();
    const { equipment, addEquipment, updateEquipment, deleteEquipment, lisConnection, toggleLisConnection, simulateLisDataTransfer } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('equipment'); // 'equipment' or 'lis'

    const [formData, setFormData] = useState({
        name: '',
        type: 'Microtomo',
        serialNumber: '',
        status: 'Online',
        lastMaintenance: ''
    });

    // Simulate LIS traffic periodically if connected
    useEffect(() => {
        let interval;
        if (lisConnection.status === 'Connected') {
            interval = setInterval(() => {
                if (Math.random() > 0.7) {
                    simulateLisDataTransfer();
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [lisConnection.status, simulateLisDataTransfer]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                type: 'Microtomo',
                serialNumber: '',
                status: 'Online',
                lastMaintenance: new Date().toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            updateEquipment({ ...formData, id: editingItem.id });
        } else {
            addEquipment(formData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Está seguro de eliminar este equipo?')) {
            deleteEquipment(id);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Online': return 'bg-green-100 text-green-800 border-green-200';
            case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Offline': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getIconByType = (type) => {
        switch (type) {
            case 'Escáner WSI': return <Monitor size={24} className="text-purple-600" />;
            case 'Procesador': return <RefreshCw size={24} className="text-blue-600" />;
            case 'Teñidor': return <Database size={24} className="text-pink-600" />; // Placeholder
            default: return <Settings size={24} className="text-gray-600" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Gestión de Equipos e Integración</h1>
                        <p className="text-text-secondary">Monitoreo de dispositivos de laboratorio y conexión LIS.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'equipment' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('equipment')}
                    >
                        <Settings size={18} className="mr-2" />
                        Equipos
                    </Button>
                    <Button
                        variant={activeTab === 'lis' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('lis')}
                    >
                        <Server size={18} className="mr-2" />
                        Integración LIS
                    </Button>
                </div>
            </div>

            {activeTab === 'equipment' && (
                <>
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => handleOpenModal()}>
                            <Plus size={20} className="mr-2" />
                            Agregar Equipo
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {equipment.map(item => (
                            <div key={item.id} className="bg-white rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        {getIconByType(item.type)}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                                        {item.status.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-text-main mb-1">{item.name}</h3>
                                <p className="text-sm text-text-secondary mb-4">{item.type} • {item.serialNumber}</p>

                                <div className="text-xs text-gray-500 mb-4">
                                    Mantenimiento: {item.lastMaintenance}
                                </div>

                                <div className="flex gap-2 border-t border-gray-100 pt-4">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)} className="flex-1">
                                        Editar
                                    </Button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'lis' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Card title="Estado de Conexión">
                            <div className="flex flex-col items-center py-6 text-center">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${lisConnection.status === 'Connected' ? 'bg-green-100 text-green-600' :
                                        lisConnection.status === 'Connecting...' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-red-100 text-red-600'
                                    }`}>
                                    <Server size={40} />
                                </div>
                                <h3 className="text-xl font-bold mb-1">{lisConnection.status === 'Connected' ? 'Conectado' : lisConnection.status === 'Connecting...' ? 'Conectando...' : 'Desconectado'}</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    {lisConnection.status === 'Connected' ? `Sincronizado: ${new Date(lisConnection.lastSync).toLocaleTimeString()}` : 'Sin conexión al servidor central'}
                                </p>
                                <Button
                                    onClick={toggleLisConnection}
                                    variant={lisConnection.status === 'Connected' ? 'danger' : 'primary'}
                                    className="w-full"
                                >
                                    <Power size={18} className="mr-2" />
                                    {lisConnection.status === 'Connected' ? 'Desconectar' : 'Conectar al LIS'}
                                </Button>
                            </div>
                        </Card>

                        <Card title="Configuración">
                            <div className="space-y-4">
                                <Input label="Dirección IP del Servidor" value="192.168.1.200" readOnly />
                                <Input label="Puerto HL7" value="2575" readOnly />
                                <Input label="Protocolo" value="HL7 v2.5 over MLLP" readOnly />
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card title="Logs de Transmisión de Datos">
                            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-[500px] overflow-y-auto shadow-inner">
                                {lisConnection.logs.length === 0 ? (
                                    <div className="text-gray-500 italic">Esperando conexión...</div>
                                ) : (
                                    lisConnection.logs.map((log, idx) => (
                                        <div key={idx} className="mb-1 border-b border-gray-800 pb-1 last:border-0">
                                            {log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? "Editar Equipo" : "Agregar Nuevo Equipo"}
                confirmText="Guardar"
                onConfirm={handleSubmit}
            >
                <div className="space-y-4">
                    <Input
                        label="Nombre del Equipo"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-main">Tipo</label>
                        <select
                            className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="Microtomo">Microtomo</option>
                            <option value="Procesador">Procesador de Tejidos</option>
                            <option value="Teñidor">Teñidor Automático</option>
                            <option value="Escáner WSI">Escáner Digital (WSI)</option>
                            <option value="Impresora">Impresora de Cassettes</option>
                        </select>
                    </div>
                    <Input
                        label="Número de Serie"
                        value={formData.serialNumber}
                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-main">Estado Actual</label>
                        <select
                            className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Online">Online (Operativo)</option>
                            <option value="Processing">Procesando</option>
                            <option value="Maintenance">Mantenimiento</option>
                            <option value="Offline">Offline (Fuera de Servicio)</option>
                        </select>
                    </div>
                    <Input
                        label="Último Mantenimiento"
                        type="date"
                        value={formData.lastMaintenance}
                        onChange={e => setFormData({ ...formData, lastMaintenance: e.target.value })}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default EquipmentManager;
