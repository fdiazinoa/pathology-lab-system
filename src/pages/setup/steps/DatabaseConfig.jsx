import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useSetup } from '../../../context/SetupContext';

const DatabaseConfig = () => {
    const navigate = useNavigate();
    const { config, updateConfig } = useSetup();
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const handleChange = (field, value) => {
        updateConfig('database', field, value);
    };

    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            // Simulate connection test (or call real endpoint if available)
            // In a real scenario, we would call an API endpoint here.
            // For now, we'll simulate a success if host is not empty.
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (config.database.host) {
                setTestResult({ success: true, message: 'Conexión exitosa a PostgreSQL.' });
            } else {
                setTestResult({ success: false, message: 'Error: Host no puede estar vacío.' });
            }
        } catch (error) {
            setTestResult({ success: false, message: 'Error de conexión.' });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Configuración de Base de Datos</h2>
                        <p className="text-gray-600 mt-1">Ingrese las credenciales de su servidor PostgreSQL.</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <Database size={24} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Host"
                        value={config.database.host}
                        onChange={(e) => handleChange('host', e.target.value)}
                        placeholder="localhost"
                    />
                    <Input
                        label="Puerto"
                        value={config.database.port}
                        onChange={(e) => handleChange('port', e.target.value)}
                        placeholder="5432"
                    />
                    <Input
                        label="Usuario"
                        value={config.database.user}
                        onChange={(e) => handleChange('user', e.target.value)}
                        placeholder="postgres"
                    />
                    <Input
                        label="Contraseña"
                        type="password"
                        value={config.database.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                    />
                    <div className="col-span-1 md:col-span-2">
                        <Input
                            label="Nombre de Base de Datos"
                            value={config.database.database}
                            onChange={(e) => handleChange('database', e.target.value)}
                            placeholder="pathology_lab"
                        />
                    </div>
                </div>

                {testResult && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                        {testResult.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span className="font-medium">{testResult.message}</span>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between items-center">
                <Button onClick={() => navigate('/setup/mode')} variant="secondary">
                    <ArrowLeft size={18} className="mr-2" /> Atrás
                </Button>

                <div className="flex gap-3">
                    <Button onClick={testConnection} variant="secondary" isLoading={testing}>
                        Probar Conexión
                    </Button>
                    {/* Allow skip if in Demo mode or if test passed */}
                    <Button onClick={() => navigate('/setup/ai')} disabled={config.mode === 'PROD' && !testResult?.success}>
                        Siguiente <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DatabaseConfig;
