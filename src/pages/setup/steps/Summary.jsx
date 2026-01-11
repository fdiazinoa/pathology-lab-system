import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Info, Save, ArrowLeft } from 'lucide-react';
import Button from '../../../components/Button';
import { useSetup } from '../../../context/SetupContext';

const Summary = () => {
    const navigate = useNavigate();
    const { config, finishSetup } = useSetup();
    const [saving, setSaving] = useState(false);

    const handleFinish = async () => {
        setSaving(true);
        try {
            await finishSetup();
            // Redirect to main app or login
            // Using window.location to force a full reload and state reset
            window.location.href = '/';
        } catch (error) {
            console.error("Error saving setup:", error);
            alert("Error al guardar la configuración. Revise la consola.");
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 space-y-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Configuración Lista</h2>
                    <p className="text-gray-600 mt-2">
                        Revise los parámetros antes de finalizar la instalación.
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
                        Resumen del Sistema
                    </div>
                    <div className="divide-y divide-gray-100">
                        <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <span className="text-gray-500">Modo Operativo</span>
                            <span className={`font-bold px-2 py-1 rounded text-xs ${config.mode === 'PROD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {config.mode === 'PROD' ? 'PRODUCCIÓN' : 'DEMO / LOCAL'}
                            </span>
                        </div>

                        {config.mode === 'PROD' && (
                            <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="text-gray-500">Base de Datos</span>
                                <span className="font-medium text-gray-900">{config.database.host} ({config.database.database})</span>
                            </div>
                        )}

                        <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <span className="text-gray-500">Inteligencia Artificial</span>
                            <span className={`font-medium ${config.ai.enabled ? 'text-purple-600' : 'text-gray-400'}`}>
                                {config.ai.enabled ? `Activado (${config.ai.provider})` : 'Desactivado'}
                            </span>
                        </div>

                        <div className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <span className="text-gray-500">Respaldos</span>
                            <span className={`font-medium ${config.backups.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                                {config.backups.enabled ? `Automático (${config.backups.frequency})` : 'Manual'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 border border-blue-100">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-800">
                        Al finalizar, el sistema guardará estas preferencias y estará listo para su uso inmediato.
                        Puede modificar esta configuración posteriormente desde el panel de Administración.
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between items-center">
                <Button onClick={() => navigate('/setup/backups')} variant="secondary" disabled={saving}>
                    <ArrowLeft size={18} className="mr-2" /> Atrás
                </Button>

                <Button onClick={handleFinish} variant="success" size="lg" isLoading={saving} className="shadow-md hover:shadow-lg transition-shadow">
                    <Save size={18} className="mr-2" />
                    Finalizar Instalación
                </Button>
            </div>
        </div>
    );
};

export default Summary;
