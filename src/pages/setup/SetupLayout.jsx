import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CheckCircle, Info, Layers, Database, Cpu, HardDrive, Shield } from 'lucide-react';

const SetupLayout = () => {
    const location = useLocation();

    const steps = [
        { path: '/setup/welcome', title: 'Inicio', icon: Info },
        { path: '/setup/mode', title: 'Modo', icon: Layers },
        { path: '/setup/database', title: 'Base de Datos', icon: Database },
        { path: '/setup/ai', title: 'Inteligencia Artificial', icon: Cpu },
        { path: '/setup/backups', title: 'Respaldos', icon: HardDrive },
        { path: '/setup/summary', title: 'Resumen', icon: Shield }
    ];

    // Determine current step index based on path matching
    const currentStepIndex = steps.findIndex(s => location.pathname.startsWith(s.path));
    // If exact match fails (e.g. root /setup), default to -1 or 0
    const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Asistente de Instalación</h1>
                        <p className="mt-1 text-gray-600">Configuración Inicial del Sistema de Patología</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-mono font-bold shadow-sm">
                        v1.0
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-10">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-5 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>

                        {steps.map((step, index) => {
                            const isActive = index === activeIndex;
                            const isCompleted = index < activeIndex;

                            return (
                                <div key={step.path} className="flex flex-col items-center group cursor-default">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 shadow-sm ${isActive ? 'border-blue-600 bg-blue-600 text-white scale-110 shadow-blue-200' :
                                            isCompleted ? 'border-green-500 bg-green-500 text-white' :
                                                'border-gray-300 bg-white text-gray-400'
                                        }`}>
                                        {isCompleted ? <CheckCircle size={20} /> : <step.icon size={20} />}
                                    </div>
                                    <span className={`mt-3 text-xs font-medium hidden sm:block transition-colors duration-300 ${isActive ? 'text-blue-700 font-bold' :
                                            isCompleted ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 min-h-[500px] flex flex-col transition-all duration-500">
                    <Outlet />
                </div>

                <div className="mt-6 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Pathology Lab System. Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
};

export default SetupLayout;
