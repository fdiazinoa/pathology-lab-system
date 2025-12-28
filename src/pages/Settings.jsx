import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Building, Phone, MapPin, Stethoscope, Mic, MicOff, History, Settings as SettingsIcon, Printer, Plus, Trash2, Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';

const Settings = () => {
    const { settings, updateSettings, configHistory, currentUser, testPrinter } = useData();
    const [formData, setFormData] = useState(settings);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'printers'

    // Printer Management State
    const [isAddingPrinter, setIsAddingPrinter] = useState(false);
    const [editingPrinterId, setEditingPrinterId] = useState(null);
    const [printerForm, setPrinterForm] = useState({
        name: '',
        type: 'Label',
        connection: 'USB',
        driver: 'ZPL',
        address: '',
        port: '9100'
    });
    const [testStatus, setTestStatus] = useState({}); // { printerId: { loading, success, message } }

    // Mic Test State
    const [isTestingMic, setIsTestingMic] = useState(false);
    const [micPermission, setMicPermission] = useState('prompt'); // prompt, granted, denied
    const [audioLevel, setAudioLevel] = useState(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Update local state if global settings change (e.g. initial load)
    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    useEffect(() => {
        return () => {
            stopMicTest();
        };
    }, []);

    const stopMicTest = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) audioContextRef.current.close();

        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
        setIsTestingMic(false);
        setAudioLevel(0);
    };

    const handleTestMic = async () => {
        if (isTestingMic) {
            stopMicTest();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicPermission('granted');
            setIsTestingMic(true);

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                // Normalize a bit for better visual
                setAudioLevel(Math.min(average / 50, 1));
                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setMicPermission('denied');
            setIsTestingMic(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddPrinter = () => {
        const newPrinter = {
            ...printerForm,
            id: Date.now().toString(),
            status: 'Online'
        };
        const updatedPrinters = [...(formData.printerConfig?.printers || []), newPrinter];
        const newFormData = {
            ...formData,
            printerConfig: { ...formData.printerConfig, printers: updatedPrinters }
        };
        setFormData(newFormData);
        setIsAddingPrinter(false);
        setPrinterForm({ name: '', type: 'Label', connection: 'USB', driver: 'ZPL', address: '', port: '9100' });
    };

    const handleDeletePrinter = (id) => {
        const updatedPrinters = formData.printerConfig.printers.filter(p => p.id !== id);
        setFormData({
            ...formData,
            printerConfig: { ...formData.printerConfig, printers: updatedPrinters }
        });
    };

    const handleTestPrinter = async (id) => {
        setTestStatus(prev => ({ ...prev, [id]: { loading: true } }));
        try {
            const result = await testPrinter(id);
            setTestStatus(prev => ({ ...prev, [id]: { loading: false, success: result.success, message: result.message } }));

            // Clear message after 3 seconds
            setTimeout(() => {
                setTestStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[id];
                    return newStatus;
                });
            }, 3000);
        } catch (err) {
            setTestStatus(prev => ({ ...prev, [id]: { loading: false, success: false, message: 'Error de comunicación' } }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulate save delay
        setTimeout(() => {
            updateSettings(formData);
            setLoading(false);
            alert('Configuración guardada correctamente');
        }, 800);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Configuración del Laboratorio</h1>
                <p className="text-text-secondary">Personalice la información que aparecerá en los informes.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'general' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    onClick={() => setActiveTab('general')}
                >
                    <SettingsIcon size={16} />
                    General
                </button>

                <button
                    className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'printers' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    onClick={() => setActiveTab('printers')}
                >
                    <Printer size={16} />
                    Impresoras
                </button>
            </div>

            {activeTab === 'general' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card title="Identidad Corporativa">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Logo Upload */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative group cursor-pointer hover:border-primary transition-colors">
                                    {formData.logo ? (
                                        <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <Upload size={24} className="mx-auto text-text-secondary mb-2" />
                                            <span className="text-xs text-text-secondary">Subir Logo</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-text-secondary text-center max-w-[150px]">
                                    Haga clic para cambiar el logo (PNG, JPG)
                                </p>
                            </div>

                            {/* Info Fields */}
                            <div className="flex-1 space-y-4 w-full">
                                <Input
                                    label="Nombre del Laboratorio"
                                    value={formData.labName}
                                    onChange={e => setFormData({ ...formData, labName: e.target.value })}
                                    icon={<Building size={18} />}
                                    required
                                />
                                <Input
                                    label="Dirección"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    icon={<MapPin size={18} />}
                                    required
                                />
                                <Input
                                    label="Teléfono de Contacto"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    icon={<Phone size={18} />}
                                    required
                                />
                            </div>
                        </div>
                    </Card>

                    <Card title="Flujo de Trabajo y Equipos">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-text-main">Habilitar Trazabilidad Interna y Equipos</h3>
                                    <p className="text-sm text-text-secondary">
                                        Active esta opción si su laboratorio cuenta con equipos conectados (Macroscopía, Procesadores, Escáneres).
                                        <br />
                                        Si se desactiva, se utilizará el flujo tradicional simplificado.
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="workflow-toggle"
                                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        checked={!!formData.enableLabWorkflow}
                                        onChange={e => setFormData({ ...formData, enableLabWorkflow: e.target.checked })}
                                    />
                                    <label htmlFor="workflow-toggle" className="ml-2 text-sm text-text-main cursor-pointer">
                                        {formData.enableLabWorkflow ? 'Activado' : 'Desactivado'}
                                    </label>
                                </div>
                            </div>

                            {currentUser?.roleId === '1' && (
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                    <div>
                                        <h3 className="font-medium text-text-main">Escaneo QR Obligatorio en Etapas Internas</h3>
                                        <p className="text-sm text-text-secondary">
                                            Si se activa, el personal deberá escanear el código QR de la muestra para avanzar en cada etapa (Macro, Micro, IHQ).
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="qr-toggle"
                                            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            checked={!!formData.requireInternalQRScan}
                                            onChange={e => setFormData({ ...formData, requireInternalQRScan: e.target.checked })}
                                        />
                                        <label htmlFor="qr-toggle" className="ml-2 text-sm text-text-main cursor-pointer">
                                            {formData.requireInternalQRScan ? 'Activado' : 'Desactivado'}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Configuración de Audio y Micrófono">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-medium text-text-main">Habilitar Micrófono</h3>
                                    <p className="text-sm text-text-secondary">
                                        Permite el uso de dictado por voz en el asistente conversacional.
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="mic-toggle"
                                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        checked={!!formData.enableMicrophone}
                                        onChange={e => {
                                            const newValue = e.target.checked;
                                            setFormData({ ...formData, enableMicrophone: newValue });
                                            updateSettings({ enableMicrophone: newValue });
                                        }}
                                    />
                                    <label htmlFor="mic-toggle" className="ml-2 text-sm text-text-main cursor-pointer">
                                        {formData.enableMicrophone ? 'Activado' : 'Desactivado'}
                                    </label>
                                </div>
                            </div>

                            {formData.enableMicrophone && (
                                <div className="flex items-center justify-between pl-4 border-l-2 border-blue-100">
                                    <div>
                                        <h3 className="font-medium text-text-main">Prueba de Dispositivo</h3>
                                        <p className="text-sm text-text-secondary">
                                            Verifique que su micrófono funciona correctamente.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant={isTestingMic ? "danger" : "secondary"}
                                        onClick={handleTestMic}
                                    >
                                        {isTestingMic ? <MicOff size={18} className="mr-2" /> : <Mic size={18} className="mr-2" />}
                                        {isTestingMic ? 'Detener Prueba' : 'Probar Micrófono'}
                                    </Button>
                                </div>
                            )}

                            {micPermission === 'denied' && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                                    <strong>Acceso denegado:</strong> Por favor permita el acceso al micrófono en la configuración de su navegador.
                                </div>
                            )}

                            {isTestingMic && (
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-75 ease-out"
                                            style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-center text-text-secondary">
                                        Hable para probar el nivel de entrada.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Configuración de Informes">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-text-main">Incluir Imágenes en el Informe Impreso</h3>
                                    <p className="text-sm text-text-secondary">
                                        Si se activa, las imágenes adjuntas al caso se mostrarán en la versión impresa del informe.
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="print-images-toggle"
                                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        checked={!!formData.printImagesInReport}
                                        onChange={e => setFormData({ ...formData, printImagesInReport: e.target.checked })}
                                    />
                                    <label htmlFor="print-images-toggle" className="ml-2 text-sm text-text-main cursor-pointer">
                                        {formData.printImagesInReport ? 'Activado' : 'Desactivado'}
                                    </label>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-text-main mb-1">Tamaño de Papel Predeterminado</label>
                                <select
                                    className="w-full p-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-primary bg-white"
                                    value={formData.paperSize}
                                    onChange={e => setFormData({ ...formData, paperSize: e.target.value })}
                                >
                                    <option value="A4">A4 (210 x 297 mm)</option>
                                    <option value="Letter">Carta / Letter (216 x 279 mm)</option>
                                </select>
                                <p className="text-xs text-text-secondary mt-1">
                                    Ajusta las dimensiones del informe para que coincidan con el papel de su impresora.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card title="Integración IA (Opcional)">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-medium text-text-main">Habilitar Inteligencia Artificial</h3>
                                    <p className="text-sm text-text-secondary">
                                        Activa o desactiva todas las funcionalidades basadas en IA en el sistema.
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="ai-toggle"
                                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        checked={!!formData.aiEnabled}
                                        onChange={e => setFormData({ ...formData, aiEnabled: e.target.checked })}
                                    />
                                    <label htmlFor="ai-toggle" className="ml-2 text-sm text-text-main cursor-pointer">
                                        {formData.aiEnabled ? 'Activado' : 'Desactivado'}
                                    </label>
                                </div>
                            </div>

                            {formData.aiEnabled && (
                                <>
                                    <Input
                                        label="OpenAI API Key"
                                        type="password"
                                        placeholder="sk-..."
                                        value={formData.openaiApiKey || ''}
                                        onChange={e => setFormData({ ...formData, openaiApiKey: e.target.value })}
                                    />
                                    <p className="text-xs text-text-secondary">
                                        Si proporcionas una API Key, el sistema utilizará GPT-4o para un análisis real de las imágenes.
                                        Si lo dejas vacío, se utilizará el modo de simulación gratuito.
                                        <br />
                                        <strong>Nota:</strong> La llave se guarda localmente en tu navegador.
                                    </p>
                                    {!formData.openaiApiKey && (
                                        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100 flex items-center gap-2">
                                            <Info size={14} />
                                            <span>Modo Simulación Activo: Se generarán diagnósticos de prueba basados en el contexto.</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" isLoading={loading}>
                            <Save size={20} className="mr-2" />
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            )}



            {activeTab === 'printers' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-text-main">Gestión de Impresoras</h2>
                            <p className="text-sm text-text-secondary">Configure y pruebe las impresoras del laboratorio.</p>
                        </div>
                        <Button onClick={() => setIsAddingPrinter(!isAddingPrinter)} variant={isAddingPrinter ? 'secondary' : 'primary'}>
                            {isAddingPrinter ? 'Cancelar' : <><Plus size={18} className="mr-2" /> Agregar Impresora</>}
                        </Button>
                    </div>

                    {isAddingPrinter && (
                        <Card title="Nueva Impresora">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre / Alias"
                                    placeholder="Ej: Zebra Recepción"
                                    value={printerForm.name}
                                    onChange={e => setPrinterForm({ ...printerForm, name: e.target.value })}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Tipo</label>
                                    <select
                                        className="w-full p-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
                                        value={printerForm.type}
                                        onChange={e => setPrinterForm({ ...printerForm, type: e.target.value })}
                                    >
                                        <option value="Label">Etiquetas (QR)</option>
                                        <option value="Report">Informes (A4/Carta)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Conexión</label>
                                    <select
                                        className="w-full p-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
                                        value={printerForm.connection}
                                        onChange={e => setPrinterForm({ ...printerForm, connection: e.target.value })}
                                    >
                                        <option value="USB">USB Directo</option>
                                        <option value="Network">Red (TCP/IP)</option>
                                        <option value="System">Predeterminada del Sistema</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Controlador / Lenguaje</label>
                                    <select
                                        className="w-full p-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
                                        value={printerForm.driver}
                                        onChange={e => setPrinterForm({ ...printerForm, driver: e.target.value })}
                                    >
                                        <option value="ZPL">ZPL (Zebra)</option>
                                        <option value="PDF">PDF (Estándar)</option>
                                        <option value="ESC/POS">ESC/POS (Térmica)</option>
                                        <option value="Generic">Texto Genérico</option>
                                    </select>
                                    <p className="text-[10px] text-text-secondary mt-1">
                                        {printerForm.driver === 'ZPL' && "Recomendado para etiquetas Zebra de alta precisión."}
                                        {printerForm.driver === 'PDF' && "Ideal para informes A4/Carta y documentos complejos."}
                                        {printerForm.driver === 'ESC/POS' && "Para impresoras de tickets y etiquetas térmicas simples."}
                                    </p>
                                </div>
                                {printerForm.connection === 'Network' && (
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                label="Dirección IP"
                                                placeholder="192.168.1.100"
                                                value={printerForm.address}
                                                onChange={e => setPrinterForm({ ...printerForm, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                label="Puerto"
                                                placeholder="9100"
                                                value={printerForm.port}
                                                onChange={e => setPrinterForm({ ...printerForm, port: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button onClick={handleAddPrinter} disabled={!printerForm.name}>
                                    Guardar Impresora
                                </Button>
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {(formData.printerConfig?.printers || []).map(printer => (
                            <Card key={printer.id}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${printer.type === 'Label' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <Printer size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-main">{printer.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <span className="px-1.5 py-0.5 bg-gray-100 rounded">{printer.type === 'Label' ? 'Etiquetas' : 'Informes'}</span>
                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">{printer.driver}</span>
                                                <span>•</span>
                                                <span>{printer.connection} {printer.address ? `(${printer.address})` : ''}</span>
                                                <span>•</span>
                                                <span className={printer.status === 'Online' ? 'text-green-600' : 'text-red-600'}>{printer.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {testStatus[printer.id] ? (
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${testStatus[printer.id].loading ? 'bg-gray-100 text-gray-600' :
                                                testStatus[printer.id].success ? 'bg-green-50 text-green-700 border border-green-200' :
                                                    'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                {testStatus[printer.id].loading ? 'Probando...' : (
                                                    <>
                                                        {testStatus[printer.id].success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                                        {testStatus[printer.id].message}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <Button variant="secondary" size="sm" onClick={() => handleTestPrinter(printer.id)}>
                                                Probar Test
                                            </Button>
                                        )}
                                        <button
                                            onClick={() => handleDeletePrinter(printer.id)}
                                            className="p-2 text-text-secondary hover:text-danger transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card title="Opciones Globales">
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    checked={formData.printerConfig?.autoPrintLabels || false}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        printerConfig: { ...formData.printerConfig, autoPrintLabels: e.target.checked }
                                    })}
                                />
                                <span className="text-sm text-text-main">Imprimir etiqueta automáticamente al recibir muestra</span>
                            </label>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <Button onClick={handleSubmit} isLoading={loading}>
                                    <Save size={20} className="mr-2" />
                                    Guardar Cambios Globales
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Settings;
