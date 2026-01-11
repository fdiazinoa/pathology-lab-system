import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HardDrive, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import Button from '../../../components/Button';
import { useSetup } from '../../../context/SetupContext';

const BackupConfig = () => {
    const navigate = useNavigate();
    const { config, updateConfig } = useSetup();

    const handleChange = (field, value) => {
        updateConfig('backups', field, value);
    };

    const toggleBackups = () => {
        updateConfig('backups', 'enabled', !config.backups.enabled);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Estrategia de Respaldos</h2>
                        <p className="text-gray-600 mt-1">Configure la frecuencia y retención de las copias de seguridad.</p>
                    </div>
                    <div className={`p-2 rounded-full ${config.backups.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        <HardDrive size={24} />
                    </div>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-gray-900">Habilitar Respaldos Automáticos</h4>
                        <p className="text-sm text-gray-500">Genera copias de seguridad periódicas de la base de datos.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={config.backups.enabled} onChange={toggleBackups} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                {config.backups.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        <div className="bg-white p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer" onClick={() => handleChange('frequency', 'daily')}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${config.backups.frequency === 'daily' ? 'border-blue-600' : 'border-gray-300'}`}>
                                    {config.backups.frequency === 'daily' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                                </div>
                                <span className="font-medium text-gray-900">Diario</span>
                            </div>
                            <p className="text-sm text-gray-500 ml-7">Respaldo cada 24 horas a las 00:00.</p>
                        </div>

                        <div className="bg-white p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer" onClick={() => handleChange('frequency', 'weekly')}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${config.backups.frequency === 'weekly' ? 'border-blue-600' : 'border-gray-300'}`}>
                                    {config.backups.frequency === 'weekly' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                                </div>
                                <span className="font-medium text-gray-900">Semanal</span>
                            </div>
                            <p className="text-sm text-gray-500 ml-7">Respaldo cada Domingo a las 00:00.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Retención (días)</label>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-gray-400" />
                                <input
                                    type="number"
                                    value={config.backups.retention}
                                    onChange={(e) => handleChange('retention', parseInt(e.target.value))}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                                    min="1"
                                    max="365"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Los respaldos más antiguos se eliminarán automáticamente.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between items-center">
                <Button onClick={() => navigate('/setup/ai')} variant="secondary">
                    <ArrowLeft size={18} className="mr-2" /> Atrás
                </Button>

                <Button onClick={() => navigate('/setup/summary')}>
                    Siguiente <ArrowRight size={18} className="ml-2" />
                </Button>
            </div>
        </div>
    );
};

export default BackupConfig;
