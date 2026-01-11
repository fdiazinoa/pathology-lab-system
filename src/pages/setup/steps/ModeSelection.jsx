import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Server, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../../components/Button';
import { useSetup } from '../../../context/SetupContext';

const ModeSelection = () => {
    const navigate = useNavigate();
    const { config, updateConfig } = useSetup();

    const handleModeSelect = (mode) => {
        updateConfig('root', 'mode', mode);
    };

    const handleNext = () => {
        if (config.mode === 'DEMO') {
            navigate('/setup/ai'); // Skip Database config in Demo
        } else {
            navigate('/setup/database');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 space-y-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Seleccione el Modo Operativo</h2>
                    <p className="text-gray-600 mt-2">Defina cómo operará el sistema y dónde se almacenarán los datos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* DEMO MODE */}
                    <div
                        onClick={() => handleModeSelect('DEMO')}
                        className={`cursor-pointer border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${config.mode === 'DEMO'
                                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${config.mode === 'DEMO' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                            <Database size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Modo Demo / Local</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">
                            Ideal para pruebas, desarrollo o uso personal sin servidor.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">✅ Sin configuración de servidor</li>
                            <li className="flex items-center">✅ Datos guardados en el navegador</li>
                            <li className="flex items-center">⚠️ Los datos se pierden si limpia caché</li>
                        </ul>
                    </div>

                    {/* PRODUCTION MODE */}
                    <div
                        onClick={() => handleModeSelect('PROD')}
                        className={`cursor-pointer border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${config.mode === 'PROD'
                                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${config.mode === 'PROD' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                            <Server size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Modo Producción</h3>
                        <p className="text-sm text-gray-500 mt-2 mb-4">
                            Para laboratorios reales. Requiere conexión a PostgreSQL y Object Storage.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">✅ Persistencia segura en Base de Datos</li>
                            <li className="flex items-center">✅ Soporte multi-usuario</li>
                            <li className="flex items-center">✅ Copias de seguridad automáticas</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between">
                <Button onClick={() => navigate('/setup/welcome')} variant="secondary">
                    <ArrowLeft size={18} className="mr-2" /> Atrás
                </Button>
                <Button onClick={handleNext}>
                    Siguiente <ArrowRight size={18} className="ml-2" />
                </Button>
            </div>
        </div>
    );
};

export default ModeSelection;
