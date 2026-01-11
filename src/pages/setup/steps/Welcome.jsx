import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, AlertTriangle } from 'lucide-react';
import Button from '../../../components/Button';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full min-h-[500px]">
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Activity size={48} />
                </div>

                <div className="space-y-4 max-w-2xl">
                    <h2 className="text-3xl font-bold text-gray-900">Bienvenido al Sistema de Patología</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Este asistente le guiará a través de la configuración inicial de su entorno.
                        Definiremos el modo operativo, la conexión a la base de datos, los servicios de IA y la estrategia de respaldo.
                    </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-2xl text-left flex gap-4 shadow-sm">
                    <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
                    <div>
                        <h4 className="font-bold text-yellow-800 mb-1">Información Importante</h4>
                        <p className="text-sm text-yellow-700 leading-relaxed">
                            Esta configuración es <strong>no destructiva</strong>. Si es la primera vez que ejecuta el sistema,
                            le recomendamos comenzar con el <strong>Modo Demo</strong> para familiarizarse con las funcionalidades
                            antes de conectar una base de datos de producción.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end">
                <Button onClick={() => navigate('/setup/mode')} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                    Comenzar Configuración <ArrowRight size={20} className="ml-2" />
                </Button>
            </div>
        </div>
    );
};

export default Welcome;
