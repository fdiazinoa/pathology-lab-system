import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import {
    Database, HardDrive, Search, CheckCircle, ArrowRight, ArrowLeft, Save,
    Server, Shield, AlertTriangle, Info, Activity, Layers, Box
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const ConnectionWizard = () => {
    const navigate = useNavigate();
    const { saveConnectionConfig, connectionConfig } = useData();
    const [currentStep, setCurrentStep] = useState(1);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Initial Config State
    const [config, setConfig] = useState(connectionConfig || {
        operationalMode: 'STANDARD', // SIMPLE, STANDARD, ADVANCED
        database: {
            type: 'postgresql',
            host: 'localhost',
            port: '5432',
            user: 'postgres',
            password: '',
            database: 'pathology_lab'
        },
        storage: {
            type: 'minio', // minio, s3, local
            endpoint: 'http://localhost:9000',
            accessKey: '',
            secretKey: '',
            bucket: 'pathology-images',
            localPath: '' // for local filesystem
        },
        search: {
            type: 'opensearch',
            node: 'http://localhost:9200',
            index: 'cases'
        }
    });

    const steps = [
        { id: 1, title: 'Inicio', icon: Info },
        { id: 2, title: 'Modo', icon: Layers },
        { id: 3, title: 'Base de Datos', icon: Database },
        { id: 4, title: 'Almacenamiento', icon: HardDrive },
        { id: 5, title: 'Búsqueda', icon: Search, condition: (c) => c.operationalMode === 'ADVANCED' },
        { id: 6, title: 'Resumen', icon: CheckCircle }
    ].filter(step => !step.condition || step.condition(config));

    const handleChange = (section, field, value) => {
        if (section === 'root') {
            setConfig(prev => ({ ...prev, [field]: value }));
        } else {
            setConfig(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        }
    };

    const nextStep = () => {
        if (currentStep < 6) {
            // Skip Search step if not Advanced
            if (currentStep === 4 && config.operationalMode !== 'ADVANCED') {
                setCurrentStep(6);
            } else {
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            // Skip Search step if not Advanced
            if (currentStep === 6 && config.operationalMode !== 'ADVANCED') {
                setCurrentStep(4);
            } else {
                setCurrentStep(prev => prev - 1);
            }
        }
    };

    const handleSave = () => {
        saveConnectionConfig(config);
        navigate('/settings');
    };

    const testDBConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);

        try {
            const response = await fetch('http://localhost:3001/api/test-db-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config.database)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setTestResult({ success: true, message: data.message });
            } else {
                setTestResult({
                    success: false,
                    message: data.message || 'Error desconocido al conectar.'
                });
            }
        } catch (error) {
            console.error("Error testing DB connection:", error);
            setTestResult({
                success: false,
                message: 'Error: No se pudo contactar con el servidor de pruebas. Asegúrese de ejecutar "npm run server".'
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Intro
                return (
                    <div className="space-y-6 text-center py-8">
                        <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                            <Activity size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Estado del Sistema: MODO DEMO</h2>
                        <p className="text-gray-600 max-w-lg mx-auto">
                            Actualmente el sistema está operando con <strong>Mock Data</strong> y persistencia local en su navegador.
                            Este asistente le permitirá configurar la conexión a una infraestructura real (Base de Datos, Object Storage, etc.).
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg mx-auto text-left flex gap-3">
                            <AlertTriangle className="text-yellow-600 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                                <strong>Importante:</strong> Completar este asistente <strong>NO</strong> activará el modo producción inmediatamente.
                                Solo guardará la configuración para cuando decida hacer el cambio (Switchover).
                            </div>
                        </div>
                    </div>
                );

            case 2: // Mode Selection
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-medium text-gray-900">Seleccione el Modo Operativo</h3>
                        <p className="text-gray-500">Defina la complejidad de su infraestructura.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    id: 'SIMPLE',
                                    label: 'Simple',
                                    desc: 'Solo Base de Datos Relacional. Las imágenes se guardan como BLOBs (no recomendado para alto volumen).',
                                    icon: Database
                                },
                                {
                                    id: 'STANDARD',
                                    label: 'Estándar',
                                    desc: 'Base de Datos + Object Storage (MinIO/S3). Ideal para la mayoría de laboratorios.',
                                    icon: Server
                                },
                                {
                                    id: 'ADVANCED',
                                    label: 'Avanzado',
                                    desc: 'BD + Storage + Motor de Búsqueda (OpenSearch). Para grandes volúmenes y búsquedas complejas.',
                                    icon: Layers
                                }
                            ].map(mode => (
                                <div
                                    key={mode.id}
                                    onClick={() => handleChange('root', 'operationalMode', mode.id)}
                                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:shadow-md ${config.operationalMode === mode.id
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${config.operationalMode === mode.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        <mode.icon size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-900">{mode.label}</h4>
                                    <p className="text-xs text-gray-500 mt-2">{mode.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 3: // Database
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-medium text-gray-900">Configuración de Base de Datos</h3>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">PostgreSQL</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Host" value={config.database.host} onChange={(e) => handleChange('database', 'host', e.target.value)} placeholder="localhost" />
                            <Input label="Puerto" value={config.database.port} onChange={(e) => handleChange('database', 'port', e.target.value)} placeholder="5432" />
                            <Input label="Usuario" value={config.database.user} onChange={(e) => handleChange('database', 'user', e.target.value)} placeholder="postgres" />
                            <Input label="Contraseña" type="password" value={config.database.password} onChange={(e) => handleChange('database', 'password', e.target.value)} />
                            <div className="col-span-2">
                                <Input label="Nombre de Base de Datos" value={config.database.database} onChange={(e) => handleChange('database', 'database', e.target.value)} placeholder="pathology_lab" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                {testResult && (
                                    <span className={`flex items-center gap-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                        {testResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                        {testResult.message}
                                    </span>
                                )}
                            </div>
                            <Button variant="secondary" onClick={testDBConnection} isLoading={testingConnection}>
                                Probar Conexión
                            </Button>
                        </div>
                    </div>
                );

            case 4: // Storage
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-medium text-gray-900">Almacenamiento de Imágenes</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Almacenamiento</label>
                            <div className="flex gap-4">
                                {['minio', 's3', 'local'].map(type => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="storageType"
                                            checked={config.storage.type === type}
                                            onChange={() => handleChange('storage', 'type', type)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="capitalize">{type === 'local' ? 'File System (Local)' : type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {config.storage.type === 'local' ? (
                            <Input
                                label="Ruta del Directorio Local"
                                value={config.storage.localPath}
                                onChange={(e) => handleChange('storage', 'localPath', e.target.value)}
                                placeholder="/var/lib/pathology/images"
                                helperText="Asegúrese de que el usuario del sistema tenga permisos de escritura."
                            />
                        ) : (
                            <div className="space-y-4">
                                <Input label="Endpoint URL" value={config.storage.endpoint} onChange={(e) => handleChange('storage', 'endpoint', e.target.value)} placeholder="http://localhost:9000" />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Access Key" value={config.storage.accessKey} onChange={(e) => handleChange('storage', 'accessKey', e.target.value)} />
                                    <Input label="Secret Key" type="password" value={config.storage.secretKey} onChange={(e) => handleChange('storage', 'secretKey', e.target.value)} />
                                </div>
                                <Input label="Bucket Name" value={config.storage.bucket} onChange={(e) => handleChange('storage', 'bucket', e.target.value)} />
                            </div>
                        )}
                    </div>
                );

            case 5: // Search (Advanced only)
                return (
                    <div className="space-y-6">
                        <h3 className="text-xl font-medium text-gray-900">Motor de Búsqueda</h3>
                        <p className="text-sm text-gray-500">Configuración de OpenSearch o Elasticsearch para indexación.</p>

                        <div className="space-y-4">
                            <Input label="Node URL" value={config.search.node} onChange={(e) => handleChange('search', 'node', e.target.value)} placeholder="http://localhost:9200" />
                            <Input label="Index Name" value={config.search.index} onChange={(e) => handleChange('search', 'index', e.target.value)} placeholder="cases_index" />
                        </div>
                    </div>
                );

            case 6: // Summary
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                                <Shield size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Configuración Lista</h2>
                            <p className="text-gray-600">
                                Ha definido correctamente los parámetros de conexión.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-sm space-y-4">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Modo Operativo</span>
                                <span className="font-medium text-gray-900">{config.operationalMode}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Base de Datos</span>
                                <span className="font-medium text-gray-900">{config.database.host} ({config.database.database})</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Almacenamiento</span>
                                <span className="font-medium text-gray-900">{config.storage.type.toUpperCase()}</span>
                            </div>
                            {config.operationalMode === 'ADVANCED' && (
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Búsqueda</span>
                                    <span className="font-medium text-gray-900">{config.search.node}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-md flex gap-3">
                            <Info className="text-blue-600 flex-shrink-0" size={20} />
                            <p className="text-sm text-blue-800">
                                Al hacer clic en "Guardar", esta configuración se almacenará de forma segura.
                                El sistema <strong>continuará en Modo Demo</strong> hasta que un administrador active explícitamente el cambio de entorno.
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Asistente de Conexión</h1>
                        <p className="mt-1 text-gray-600">Configuración de Infraestructura Productiva</p>
                    </div>
                    <div className="px-3 py-1 bg-gray-200 rounded-full text-xs font-mono text-gray-700">
                        v1.0.0-wizard
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                        {steps.map((step, index) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            const stepNumber = index + 1;

                            return (
                                <div key={step.id} className="flex flex-col items-center bg-gray-50 px-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-blue-600 bg-blue-600 text-white' :
                                        isCompleted ? 'border-green-500 bg-green-500 text-white' :
                                            'border-gray-300 bg-white text-gray-400'
                                        }`}>
                                        {isCompleted ? <CheckCircle size={20} /> : <step.icon size={20} />}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="p-8 min-h-[400px]">
                        {renderStepContent()}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-between items-center">
                        <Button
                            variant="secondary"
                            onClick={currentStep === 1 ? () => navigate('/settings') : prevStep}
                            className="text-gray-600"
                        >
                            {currentStep === 1 ? 'Cancelar' : 'Atrás'}
                        </Button>

                        {currentStep < 6 ? (
                            <Button onClick={nextStep}>
                                Siguiente <ArrowRight size={18} className="ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSave} variant="success">
                                <Save size={18} className="mr-2" />
                                Guardar Configuración
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectionWizard;
