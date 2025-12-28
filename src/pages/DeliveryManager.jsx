import React, { useState } from 'react';
import { Truck, Package, Calendar, Clock, User, QrCode, CheckCircle, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';
import { QRCodeCanvas } from 'qrcode.react';

const DeliveryManager = () => {
    const { cases, users, addDelivery, updateCase, currentUser } = useData();
    const [selectedCases, setSelectedCases] = useState([]);
    const [selectedCourier, setSelectedCourier] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [deliveryTimeStart, setDeliveryTimeStart] = useState('');
    const [deliveryTimeEnd, setDeliveryTimeEnd] = useState('');
    const [generatedDelivery, setGeneratedDelivery] = useState(null);

    // Filter cases ready for dispatch
    const readyCases = cases.filter(c => c.status === 'Listo para despacho');

    // Filter couriers (Role ID 4)
    const couriers = users.filter(u => u.roleId === '4');

    const handleCaseToggle = (caseId) => {
        if (selectedCases.includes(caseId)) {
            setSelectedCases(selectedCases.filter(id => id !== caseId));
        } else {
            setSelectedCases([...selectedCases, caseId]);
        }
    };

    const handleAssignDelivery = () => {
        if (selectedCases.length === 0 || !selectedCourier || !deliveryDate || !deliveryTimeStart || !deliveryTimeEnd) {
            alert("Por favor complete todos los campos y seleccione al menos un caso.");
            return;
        }

        // Final security check: Ensure all selected cases have diagnosis and signature
        const invalidCases = selectedCases.filter(caseId => {
            const c = cases.find(item => item.id === caseId);
            return !c || !c.diagnosis || !c.digitalSignature;
        });

        if (invalidCases.length > 0) {
            alert(`Seguridad: Los siguientes casos no pueden ser asignados porque no tienen diagnóstico o firma digital: ${invalidCases.join(', ')}`);
            return;
        }

        const deliveryId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const courier = couriers.find(c => c.id === selectedCourier);

        const newDelivery = {
            id: deliveryId,
            courierId: selectedCourier,
            courierName: courier.name,
            caseIds: selectedCases,
            status: 'Asignado',
            scheduledDate: deliveryDate,
            windowStart: deliveryTimeStart,
            windowEnd: deliveryTimeEnd,
            assignedBy: currentUser.id,
            assignedAt: new Date().toISOString()
        };

        // Save delivery
        addDelivery(newDelivery);

        // Update cases status
        selectedCases.forEach(caseId => {
            const caseData = cases.find(c => c.id === caseId);
            if (caseData) {
                updateCase({
                    ...caseData,
                    status: 'En Reparto',
                    deliveryId: deliveryId,
                    auditLogs: [
                        ...caseData.auditLogs,
                        {
                            date: new Date().toISOString(),
                            user: currentUser.name,
                            action: 'Asignación de Reparto',
                            details: `Asignado a ${courier.name} (ID: ${deliveryId})`
                        }
                    ]
                });
            }
        });

        setGeneratedDelivery(newDelivery);
        setSelectedCases([]);
        setSelectedCourier('');
        alert("Reparto asignado exitosamente.");
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Gestión de Logística y Entregas</h1>
                <p className="text-text-secondary">Asigne casos listos para despacho a los repartidores disponibles.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Case Selection */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title={`Casos Listos para Despacho (${readyCases.length})`}>
                        {readyCases.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary">
                                <Package size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No hay casos pendientes de despacho.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-text-secondary border-b border-gray-100">
                                            <th className="p-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCases(readyCases.map(c => c.id));
                                                        else setSelectedCases([]);
                                                    }}
                                                    checked={selectedCases.length === readyCases.length && readyCases.length > 0}
                                                />
                                            </th>
                                            <th className="p-3 font-medium">Caso ID</th>
                                            <th className="p-3 font-medium">Paciente</th>
                                            <th className="p-3 font-medium">Médico/Centro</th>
                                            <th className="p-3 font-medium">Fecha Liberación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {readyCases.map(c => (
                                            <tr key={c.id} className={`hover:bg-gray-50 ${selectedCases.includes(c.id) ? 'bg-blue-50' : ''}`}>
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCases.includes(c.id)}
                                                        onChange={() => handleCaseToggle(c.id)}
                                                    />
                                                </td>
                                                <td className="p-3 font-medium text-primary">{c.id}</td>
                                                <td className="p-3">{c.patientName}</td>
                                                <td className="p-3">Dr. Remitente</td>
                                                <td className="p-3 text-xs text-text-secondary">
                                                    {c.releasedAt ? new Date(c.releasedAt).toLocaleDateString() : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: Assignment Form */}
                <div className="space-y-6">
                    <Card title="Asignar Reparto">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-1">Repartidor</label>
                                <select
                                    className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    value={selectedCourier}
                                    onChange={e => setSelectedCourier(e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    {couriers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                type="date"
                                label="Fecha de Entrega"
                                value={deliveryDate}
                                onChange={e => setDeliveryDate(e.target.value)}
                                icon={<Calendar size={18} />}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="time"
                                    label="Inicio Ventana"
                                    value={deliveryTimeStart}
                                    onChange={e => setDeliveryTimeStart(e.target.value)}
                                    icon={<Clock size={18} />}
                                />
                                <Input
                                    type="time"
                                    label="Fin Ventana"
                                    value={deliveryTimeEnd}
                                    onChange={e => setDeliveryTimeEnd(e.target.value)}
                                    icon={<Clock size={18} />}
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm mb-4">
                                    <span className="text-text-secondary">Casos seleccionados:</span>
                                    <span className="font-bold text-primary">{selectedCases.length}</span>
                                </div>
                                <Button
                                    fullWidth
                                    onClick={handleAssignDelivery}
                                    disabled={selectedCases.length === 0}
                                >
                                    <Truck size={18} className="mr-2" />
                                    Generar Orden de Reparto
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {generatedDelivery && (
                        <Card title="Manifiesto de Entrega" className="printable-manifest">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                                    <CheckCircle size={20} />
                                    <span className="font-medium">Orden #{generatedDelivery.id} Creada</span>
                                </div>

                                <p className="text-sm text-text-secondary mb-4">
                                    Utilice los <strong>Códigos QR originales</strong> de los siguientes casos para el seguimiento de la entrega:
                                </p>

                                <div className="space-y-2 mb-4">
                                    {generatedDelivery.caseIds.map(id => (
                                        <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                            <span className="font-mono font-bold text-text-main">{id}</span>
                                            <QrCode size={16} className="text-text-secondary" />
                                        </div>
                                    ))}
                                </div>

                                <Button variant="secondary" size="sm" fullWidth onClick={() => window.print()}>
                                    Imprimir Manifiesto
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryManager;
