import React from 'react';
import { MapPin, Clock, Package, CheckCircle, Navigation } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../services/DataContext';

const MyDeliveries = () => {
    const { currentUser, deliveries, cases } = useData();

    // Filter deliveries for current courier
    const myDeliveries = deliveries.filter(d => d.courierId === currentUser.id);

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Mis Entregas</h1>
                <p className="text-text-secondary">Gestione sus rutas y entregas asignadas para hoy.</p>
            </div>

            {myDeliveries.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-100">
                    <Package size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-text-main">No tienes entregas asignadas</h3>
                    <p className="text-text-secondary mt-2">Las nuevas asignaciones aparecerán aquí.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {myDeliveries.map(delivery => {
                        // Get details of cases in this delivery that have been officially dispatched
                        const deliveryCases = cases.filter(c =>
                            delivery.caseIds.includes(c.id) && c.status === 'Despachado'
                        );

                        if (deliveryCases.length === 0) return null;

                        return (
                            <Card key={delivery.id}>
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left: Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                                                    <Package size={20} />
                                                    Entrega #{delivery.id}
                                                </h3>
                                                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                                                    {delivery.status}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-text-main">{new Date(delivery.scheduledDate).toLocaleDateString()}</p>
                                                <p className="text-sm text-text-secondary flex items-center justify-end gap-1">
                                                    <Clock size={14} />
                                                    {delivery.windowStart} - {delivery.windowEnd}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-4">
                                            <h4 className="font-medium text-sm text-text-secondary mb-2 uppercase tracking-wider">Destino</h4>
                                            <div className="flex items-start gap-3">
                                                <div className="bg-gray-100 p-2 rounded-full">
                                                    <MapPin size={20} className="text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-main">Centro Médico Principal</p>
                                                    <p className="text-sm text-text-secondary">Av. Libertador 1234, Consultorio 505</p>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Av. Libertador 1234, Consultorio 505")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 mt-1 cursor-pointer hover:underline flex items-center gap-1"
                                                    >
                                                        <Navigation size={14} />
                                                        Ver en mapa
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-4">
                                            <h4 className="font-medium text-sm text-text-secondary mb-2 uppercase tracking-wider">Contenido ({deliveryCases.length} Casos)</h4>
                                            <ul className="space-y-2">
                                                {deliveryCases.map(c => (
                                                    <li key={c.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                                        <span className="font-medium">{c.id}</span>
                                                        <span className="text-text-secondary">{c.patientName}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col justify-center gap-3 border-l border-gray-100 pl-6 md:w-48">
                                        <Button variant="primary" fullWidth>
                                            Confirmar Entrega
                                        </Button>
                                        <Button variant="secondary" fullWidth>
                                            Reportar Problema
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyDeliveries;
