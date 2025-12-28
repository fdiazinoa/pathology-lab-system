import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ShieldCheck, ShieldAlert, Truck, Package, User, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const DispatchModule = () => {
    const { dispatchCase, deliveries, cases, users } = useData();
    const [caseQr, setCaseQr] = useState('');
    const [deliveryQr, setDeliveryQr] = useState('');
    const [status, setStatus] = useState('idle'); // idle, validating, success, error
    const [message, setMessage] = useState('');
    const [lastDispatch, setLastDispatch] = useState(null);

    const caseInputRef = useRef(null);
    const deliveryInputRef = useRef(null);

    useEffect(() => {
        if (caseInputRef.current) caseInputRef.current.focus();
    }, []);

    const handleDispatch = async (e) => {
        if (e) e.preventDefault();
        if (!caseQr || !deliveryQr) return;

        setStatus('validating');
        setMessage('Validando códigos y permisos...');

        // Simulate scan delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const result = dispatchCase(caseQr, deliveryQr);

        if (result.success) {
            setStatus('success');
            setMessage('Despacho validado correctamente.');
            const localCase = cases.find(c => c.id === caseQr);
            const delivery = deliveries.find(d => d.id === deliveryQr);
            setLastDispatch({
                caseId: caseQr,
                deliveryId: deliveryQr,
                patient: localCase?.patientName,
                courier: delivery?.courierName,
                time: new Date().toLocaleTimeString()
            });

            // Reset for next scan
            setCaseQr('');
            setDeliveryQr('');
            if (caseInputRef.current) caseInputRef.current.focus();

            // Clear success message after 3 seconds
            setTimeout(() => {
                if (status === 'success') setStatus('idle');
            }, 3000);
        } else {
            setStatus('error');
            setMessage(result.message);
        }
    };

    // Auto-submit when both fields are filled (simulating rapid QR scanning)
    useEffect(() => {
        if (caseQr && deliveryQr && status === 'idle') {
            handleDispatch();
        }
    }, [caseQr, deliveryQr]);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <ShieldCheck className="text-primary" /> Despacho Controlado de Resultados
                    </h1>
                    <p className="text-text-secondary">Escanee el QR del resultado y el QR de la orden de entrega para validar la salida.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scan Area */}
                <Card className="border-2 border-primary/20">
                    <div className="space-y-6 py-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-text-main mb-2 flex items-center gap-2">
                                <QrCode size={16} className="text-primary" /> 1. Escanear QR del Resultado (Caso)
                            </label>
                            <input
                                ref={caseInputRef}
                                type="text"
                                className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center font-mono text-xl focus:border-primary focus:bg-white outline-none transition-all"
                                placeholder="Esperando escaneo..."
                                value={caseQr}
                                onChange={(e) => setCaseQr(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && deliveryInputRef.current?.focus()}
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-text-main mb-2 flex items-center gap-2">
                                <Truck size={16} className="text-primary" /> 2. Escanear QR de Entrega (Manifiesto)
                            </label>
                            <input
                                ref={deliveryInputRef}
                                type="text"
                                className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center font-mono text-xl focus:border-primary focus:bg-white outline-none transition-all"
                                placeholder="Esperando escaneo..."
                                value={deliveryQr}
                                onChange={(e) => setDeliveryQr(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleDispatch()}
                            />
                        </div>

                        {status !== 'idle' && (
                            <div className={`p-4 rounded-lg flex items-center gap-3 animate-pulse ${status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                {status === 'success' && <CheckCircle size={20} />}
                                {status === 'error' && <ShieldAlert size={20} />}
                                {status === 'validating' && <Search size={20} className="animate-spin" />}
                                <span className="font-medium">{message}</span>
                            </div>
                        )}

                        <Button
                            fullWidth
                            size="lg"
                            onClick={handleDispatch}
                            disabled={!caseQr || !deliveryQr || status === 'validating'}
                        >
                            Validar y Despachar
                        </Button>
                    </div>
                </Card>

                {/* Info & Last Dispatch */}
                <div className="space-y-6">
                    <Card title="Último Despacho Exitoso">
                        {lastDispatch ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Package className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-600 font-bold uppercase">Caso Despachado</p>
                                        <p className="font-bold text-text-main">{lastDispatch.caseId}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-xs text-text-secondary">{lastDispatch.time}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-text-secondary text-xs mb-1">Paciente</p>
                                        <p className="font-medium truncate">{lastDispatch.patient}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-text-secondary text-xs mb-1">Repartidor</p>
                                        <p className="font-medium truncate">{lastDispatch.courier}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center text-text-secondary opacity-50">
                                <Package size={48} className="mx-auto mb-2" />
                                <p>No se han realizado despachos en esta sesión.</p>
                            </div>
                        )}
                    </Card>

                    <Card title="Reglas de Validación" className="bg-gray-50">
                        <ul className="space-y-3 text-sm text-text-secondary">
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                                <span>El caso debe existir en el sistema.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                                <span>El caso debe estar asignado a la orden de entrega escaneada.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
                                <span>El estado del caso debe ser "En Reparto".</span>
                            </li>
                            <li className="flex gap-2">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <span>Cualquier inconsistencia bloqueará el proceso y se registrará en auditoría.</span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DispatchModule;
