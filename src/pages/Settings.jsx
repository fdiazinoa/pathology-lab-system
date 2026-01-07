import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, Building, Phone, MapPin, Stethoscope, Mic, MicOff, History, Settings as SettingsIcon, Printer, Plus, Trash2, Edit2, CheckCircle, AlertCircle, Database, ShieldAlert, AlertTriangle, Sparkles, Info, CheckSquare, Eye, Users, Globe, Map, Download, RefreshCw, FlaskConical, BookOpen } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { useData } from '../services/DataContext';
import { useAIConfig } from '../ai/AIConfigContext';

const HELP_SECTIONS = [
    {
        id: 'operation-manual',
        title: 'Manual de Operación del Sistema',
        icon: BookOpen,
        sections: [
            {
                title: '1. Introducción y Roles',
                content: 'El sistema es un asistente avanzado para el flujo de trabajo del laboratorio. El Patólogo es responsable del diagnóstico final; el Técnico gestiona la carga de datos y trazabilidad; el Administrador supervisa la seguridad y configuración. El sistema no reemplaza el criterio clínico.'
            },
            {
                title: '2. Flujo Operativo del Caso',
                content: 'El proceso sigue etapas claras: Recepción (ID único), Macroscopía (imágenes), Procesamiento (trazabilidad QR), Análisis (Microscopía e IA), Revisión de Calidad (Consistencia y Segundo Vistazo) y Validación Final del informe.'
            },
            {
                title: '3. Uso Responsable de la IA',
                content: 'La IA identifica regiones de interés, sugiere diagnósticos y realiza mediciones. No emite diagnósticos definitivos ni asume responsabilidad legal. Debe usarse como una "segunda opinión" para aumentar la confianza diagnóstica.'
            },
            {
                title: '4. Modos, Seguridad y Backups',
                content: 'Modo Demo: Para entrenamiento con datos simulados. Modo Producción: Para operación real con pacientes. La seguridad se basa en accesos por rol. Los backups automáticos protegen la información; la restauración es una acción crítica reservada al administrador.'
            },
            {
                title: '5. Buenas Prácticas y Limitaciones',
                content: 'Se recomienda verificar siempre los códigos QR, revisar todas las alertas de consistencia y usar el Tumor Board para casos complejos. El sistema requiere conexión estable para IA y no realiza el procesamiento físico de tejidos.'
            }
        ],
        footer: {
            type: 'info',
            title: 'Excelencia Operativa',
            content: 'Este manual resume la guía oficial de operación para asegurar un uso responsable, seguro y eficiente del sistema.'
        }
    },
    {
        id: 'ia-guide',
        title: 'Guía de Uso de Inteligencia Artificial',
        icon: Sparkles,
        sections: [
            {
                title: '1. ¿Qué es la IA en este sistema?',
                content: 'La Inteligencia Artificial (IA) en este sistema actúa como un asistente de apoyo diagnóstico. Su función es analizar imágenes y datos clínicos para identificar patrones y sugerir información relevante. Es importante entender que la IA no emite diagnósticos definitivos ni reemplaza el juicio clínico del patólogo; es una herramienta diseñada para hacer el trabajo más eficiente y preciso.'
            },
            {
                title: '2. ¿Cuándo se activa la IA?',
                content: 'El análisis se inicia de forma automática al solicitarlo en un caso, siempre que los módulos correspondientes estén habilitados en la configuración. El laboratorio tiene el control total para activar o desactivar estas funciones según sus protocolos operativos.'
            },
            {
                title: '3. Flujo de Trabajo (Paso a Paso)',
                content: '1. Revisión Técnica (QC): Verifica si la imagen tiene la nitidez y luz adecuadas. 2. Evaluación de Sospecha: Identifica hallazgos que sugieran malignidad. 3. Sugerencia de Diagnósticos: Propone diagnósticos diferenciales. 4. Cálculos Orientativos: Realiza estimaciones de métricas. 5. Borrador de Informe: Organiza los hallazgos detectados.'
            },
            {
                title: '4. ¿Qué significan los resultados?',
                content: '"Sugerencia asistida": Posibilidad detectada que debe ser confirmada. "Estimación orientativa": Valores numéricos aproximados. "Niveles de confianza": Indican claridad de la señal para el modelo.'
            },
            {
                title: '5. ¿Qué hace la IA cuando no está segura?',
                content: 'Si el sistema detecta ambigüedad o baja calidad, marcará el resultado con una advertencia de "Baja Confianza". Esto alerta al profesional para que realice una revisión especialmente minuciosa.'
            },
            {
                title: '6. ¿Qué pasa si la IA no está disponible?',
                content: 'El sistema es robusto. Si la IA no puede procesar un caso por problemas técnicos, podrá continuar con el análisis manual de forma normal. La IA es un complemento, no un requisito crítico.'
            }
        ],
        footer: {
            type: 'info',
            title: 'Responsabilidad Clínica',
            content: 'La interpretación final, la validación de los hallazgos y la emisión del diagnóstico definitivo corresponden exclusivamente al patólogo responsable.'
        }
    },
    {
        id: 'comparator',
        title: 'Comparador de Casos Previos',
        icon: History,
        sections: [
            {
                title: '¿Qué es el Comparador de Casos Previos?',
                content: 'Es una herramienta de consulta que permite acceder a casos históricos del propio laboratorio para servir como referencia visual y documental.'
            },
            {
                title: '¿Para qué sirve?',
                content: 'Consistencia: Revisar diagnósticos previos. Referencia Visual: Comparar imágenes lado a lado. Memoria Clínica: Apoyar decisiones basada en experiencia previa.'
            },
            {
                title: '¿Qué NO hace?',
                content: 'No emite diagnósticos automáticos ni sugiere conclusiones. Tampoco copia información al caso actual.'
            }
        ],
        footer: {
            type: 'warning',
            title: 'Nota de Seguridad',
            content: 'Los casos previos se muestran únicamente como referencia clínica. El diagnóstico actual debe evaluarse de forma independiente.'
        }
    },
    {
        id: 'consistency',
        title: 'Control de Consistencia del Informe',
        icon: CheckSquare,
        sections: [
            {
                title: '¿Qué es el Control de Consistencia?',
                content: 'Es un sistema de validación automática que revisa el informe en tiempo real para detectar posibles errores humanos o inconsistencias internas.'
            },
            {
                title: '¿Qué detecta este módulo?',
                content: 'Discrepancias de Órgano, Contradicciones Clínicas (ej. "benigno" y "maligno") e Incompatibilidad de Muestra.'
            },
            {
                title: '¿Cómo interpretar las alertas?',
                content: 'Las alertas son recordatorios visuales. No corrigen el texto automáticamente ni bloquean el flujo de trabajo.'
            }
        ],
        footer: {
            type: 'info',
            title: 'Aviso de Uso',
            content: 'Las alertas de consistencia son orientativas y no sustituyen la revisión clínica exhaustiva del patólogo responsable.'
        }
    },
    {
        id: 'second-look',
        title: 'Modo Segundo Vistazo',
        icon: Eye,
        sections: [
            {
                title: '¿Qué es el Modo Segundo Vistazo?',
                content: 'Es una funcionalidad que permite marcar un caso para revisarlo nuevamente con más calma o en un segundo momento, antes o después de avanzar con el informe. Es una herramienta puramente organizativa diseñada para el apoyo al trabajo diario.'
            },
            {
                title: '¿Para qué sirve?',
                content: '• Facilitar una segunda revisión de casos complejos o dudosos.\n• Reducir errores por cansancio o presión de tiempo.\n• Ayudar a organizar mejor la carga de trabajo del patólogo.'
            },
            {
                title: '¿Cuándo usarlo?',
                content: '• En casos que generan duda diagnóstica.\n• Cuando se desea revisar el caso en otro momento.\n• Cuando se requiere una evaluación adicional más detallada.'
            },
            {
                title: '¿Qué NO hace?',
                content: '• No realiza diagnósticos ni emite alertas clínicas.\n• No impide continuar o finalizar el informe.\n• No sustituye en ningún momento el criterio del patólogo.'
            },
            {
                title: '¿Cómo se utiliza?',
                content: 'El patólogo puede marcar y desmarcar el caso manualmente mediante el botón "Segundo Vistazo" en la cabecera. El sistema mostrará un indicador visible tanto en el listado general como dentro del caso mientras la marca esté activa.'
            },
            {
                title: 'Comportamiento del sistema',
                content: '• El caso marcado se identifica claramente en el listado de casos con una etiqueta.\n• Aparece un aviso discreto al abrir el caso: "Este caso está marcado para Segundo Vistazo. La revisión adicional queda a criterio del patólogo."\n• El marcado se mantiene de forma persistente hasta que el usuario decida retirarlo.'
            }
        ],
        footer: {
            type: 'info',
            title: 'Herramienta Organizativa',
            content: 'El Modo Segundo Vistazo es un apoyo para la organización y seguridad diagnóstica, manteniendo siempre el control total en manos del patólogo.'
        }
    },
    {
        id: 'collaboration',
        title: 'Red y Colaboración',
        icon: Users,
        sections: [
            {
                title: 'Introducción',
                content: 'Los módulos de Red y Colaboración permiten compartir, analizar y discutir casos de forma organizada, ya sea dentro del propio laboratorio o con redes externas, siempre manteniendo el control del caso y la confidencialidad de la información.'
            },
            {
                title: 'Tumor Board: ¿Qué es y para qué sirve?',
                content: 'Es una herramienta que facilita la discusión multidisciplinaria de casos complejos entre patólogos y otros especialistas. Sirve para presentar casos de interés especial, compartir imágenes y documentar conclusiones colegiadas. No reemplaza el informe patológico ni emite decisiones automáticas.'
            },
            {
                title: 'Red Global de Casos: ¿Qué es y para qué sirve?',
                content: 'Permite compartir casos seleccionados con una red más amplia de profesionales para consulta, referencia o aprendizaje. Favorece la mejora continua y el intercambio de experiencias. No publica casos automáticamente ni comparte información sin autorización expresa.'
            },
            {
                title: 'Mapa de Casos: ¿Qué es y para qué sirve?',
                content: 'Es una visualización geográfica de la distribución de casos por ubicación o centro. Útil para analizar patrones epidemiológicos y realizar seguimiento analítico. La información se presenta de forma agregada, protegiendo siempre los datos personales de los pacientes.'
            },
            {
                title: 'Uso Responsable y Mensajes del Sistema',
                content: '• Tumor Board: "El Tumor Board es una herramienta de apoyo a la discusión clínica. La responsabilidad diagnóstica final corresponde al patólogo."\n• Red Global: "La Red Global de Casos es una herramienta de colaboración. El control del caso y su interpretación permanecen en el laboratorio de origen."\n• Mapa de Casos: "El Mapa de Casos muestra información agregada con fines analíticos y de seguimiento, sin exponer datos sensibles."'
            }
        ],
        footer: {
            type: 'info',
            title: 'Control y Responsabilidad',
            content: 'Todas las herramientas de colaboración están diseñadas para potenciar el trabajo del patólogo, quien mantiene siempre el control absoluto sobre el caso y su diagnóstico.'
        }
    },
    {
        id: 'backup-restore',
        title: 'Restauración de Backups del Sistema',
        icon: Database,
        sections: [
            {
                title: '¿Qué es la restauración de un backup?',
                content: 'La restauración permite recuperar información del sistema a partir de una copia de seguridad previamente creada, en caso de errores, fallos técnicos o pérdida de datos.'
            },
            {
                title: '¿Cuándo se recomienda restaurar un backup?',
                content: '• Errores accidentales en datos importantes.\n• Fallos técnicos del sistema.\n• Corrupción de información.\n• Recuperación tras una incidencia mayor.'
            },
            {
                title: '¿Cuándo NO se recomienda restaurar un backup?',
                content: '• Para corregir errores menores que pueden editarse manualmente.\n• Sin revisar previamente la fecha y contenido del backup.\n• Sin autorización del administrador responsable.'
            },
            {
                title: '¿Cómo funciona el proceso de restauración?',
                content: '1. El administrador selecciona un backup disponible.\n2. El sistema muestra la fecha y hora del respaldo.\n3. Se solicita confirmación explícita antes de restaurar.\n4. Al confirmar, el sistema reemplaza los datos actuales por los del backup seleccionado.'
            },
            {
                title: 'Buenas prácticas recomendadas',
                content: '• Verificar siempre la fecha del backup antes de restaurar.\n• Informar al equipo antes de ejecutar una restauración.\n• Evitar restauraciones durante horarios de trabajo activo.\n• Mantener al menos una copia de respaldo adicional antes de restaurar.'
            },
            {
                title: 'Visibilidad y control',
                content: '• El sistema muestra el estado del último backup realizado.\n• Los eventos de restauración quedan registrados.\n• El contenido clínico no se muestra ni se expone durante el proceso.'
            },
            {
                title: 'Limitaciones del proceso',
                content: '• La restauración no corrige errores clínicos.\n• No reemplaza la revisión humana.\n• No modifica imágenes almacenadas externamente (solo referencias).'
            }
        ],
        footer: {
            type: 'warning',
            title: 'Advertencia Importante',
            content: 'La restauración sobrescribe los datos actuales del sistema. Esta acción no puede deshacerse.'
        }
    }
];

export { HELP_SECTIONS };

const Settings = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, configHistory, currentUser, testPrinter, isProductionMode, switchSystemMode, resetDemoData, runMigration, createBackup, restoreBackup, getBackupHistory, downloadBackup } = useData();
    const { config: aiConfig, updateConfig: updateAIConfig } = useAIConfig();
    const [formData, setFormData] = useState(settings);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'printers' | 'ai' | 'backups'

    // Mode Switch State
    const [showModeModal, setShowModeModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    // Migration State
    const [migrationOptions, setMigrationOptions] = useState({
        patients: true,
        cases: true,
        deliveries: false,
        users: false
    });
    const [migrationReport, setMigrationReport] = useState(null);
    const [backupHistory, setBackupHistory] = useState([]);
    const [isBackingUp, setIsBackingUp] = useState(false);

    useEffect(() => {
        if (activeTab === 'backups') {
            setBackupHistory(getBackupHistory());
        }
    }, [activeTab, getBackupHistory]);

    const handleManualBackup = async () => {
        setIsBackingUp(true);
        try {
            await createBackup('manual');
            setBackupHistory(getBackupHistory());
            alert('Respaldo completado con éxito.');
        } catch (err) {
            alert('Error al realizar el respaldo: ' + err.message);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestore = async (backup) => {
        if (!window.confirm(`¿Está seguro de restaurar el sistema al estado del ${new Date(backup.timestamp).toLocaleString()}? Esta acción sobrescribirá los datos actuales.`)) {
            return;
        }

        setLoading(true);
        try {
            await restoreBackup(backup.data);
            alert('Sistema restaurado correctamente.');
            window.location.reload();
        } catch (err) {
            alert('Error en la restauración: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetDemo = () => {
        if (window.confirm('¿Está seguro de reiniciar los datos de prueba? Esta acción eliminará todos los cambios realizados en el modo Demo y restaurará el estado inicial.')) {
            resetDemoData();
        }
    };

    const handleMigration = async () => {
        if (!window.confirm('¿Está seguro de iniciar la migración? Esto copiará datos de Demo a Producción.')) return;

        setLoading(true);
        const report = await runMigration(migrationOptions);
        setMigrationReport(report);
        setLoading(false);
    };

    const handleModeSwitch = () => {
        const targetMode = isProductionMode ? 'DEMO' : 'PROD';
        switchSystemMode(targetMode);
        setShowModeModal(false);
    };

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



                {isProductionMode && currentUser?.roleId === '1' && (
                    <button
                        className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'migration' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                        onClick={() => setActiveTab('migration')}
                    >
                        <Database size={16} />
                        Migración
                    </button>
                )}

                <button
                    className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'ai' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    onClick={() => setActiveTab('ai')}
                >
                    <Sparkles size={16} />
                    IA
                </button>

                <button
                    className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'backups' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    onClick={() => setActiveTab('backups')}
                >
                    <Database size={16} />
                    Respaldos
                </button>
            </div>

            {!isProductionMode && activeTab === 'general' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FlaskConical className="text-blue-600" size={20} />
                        <div>
                            <p className="text-sm font-bold text-blue-900">Entorno de Pruebas Activo</p>
                            <p className="text-xs text-blue-700">Está trabajando con datos simulados. Puede reiniciar el entorno para limpiar sus pruebas.</p>
                        </div>
                    </div>
                    <Button variant="secondary" onClick={handleResetDemo} className="text-xs py-1.5">
                        Reiniciar Datos de Prueba
                    </Button>
                </div>
            )}



            {/* --- SYSTEM MODE CONTROL (ADMIN ONLY) --- */}
            {
                currentUser?.roleId === '1' && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
                            <ShieldAlert size={20} className="text-red-600" />
                            Zona de Peligro: Control de Modo del Sistema
                        </h3>

                        <div className={`p-6 rounded-lg border ${isProductionMode ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className={`text-lg font-bold mb-2 ${isProductionMode ? 'text-red-800' : 'text-green-800'}`}>
                                        Modo Actual: {isProductionMode ? 'PRODUCCIÓN' : 'DEMOSTRACIÓN'}
                                    </h4>
                                    <p className="text-sm text-gray-700 max-w-2xl">
                                        {isProductionMode
                                            ? 'El sistema está operando con datos reales. Cualquier cambio afectará la base de datos de producción.'
                                            : 'El sistema está en modo seguro de demostración. Los datos son simulados y se guardan localmente en su navegador.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowModeModal(true)}
                                    className={`px-4 py-2 rounded-md font-medium text-white shadow-sm transition-colors ${isProductionMode
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {isProductionMode ? 'Cambiar a Modo Demo' : 'Activar Modo Producción'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- MODE SWITCH CONFIRMATION MODAL --- */}
            {
                showModeModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center gap-3 mb-4 text-red-600">
                                <AlertTriangle size={32} />
                                <h3 className="text-xl font-bold">¿Cambiar Modo del Sistema?</h3>
                            </div>

                            <div className="space-y-4 mb-6">
                                <p className="text-gray-700">
                                    Está a punto de cambiar el sistema a modo <strong>{isProductionMode ? 'DEMOSTRACIÓN' : 'PRODUCCIÓN'}</strong>.
                                </p>

                                {!isProductionMode && (
                                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
                                        <strong>Advertencia:</strong> El modo Producción conectará con servicios reales. Asegúrese de haber completado la configuración en el Wizard.
                                    </div>
                                )}

                                {isProductionMode && (
                                    <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm text-blue-800">
                                        Volver a modo Demo desconectará los servicios reales y restaurará los datos de prueba locales.
                                    </div>
                                )}

                                {!isProductionMode && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Escriba "CONFIRMAR" para continuar:
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="CONFIRMAR"
                                            value={confirmText}
                                            onChange={(e) => setConfirmText(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setShowModeModal(false); setConfirmText(''); }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleModeSwitch}
                                    disabled={!isProductionMode && confirmText !== 'CONFIRMAR'}
                                    className={`px-4 py-2 rounded-md font-medium text-white shadow-sm ${(!isProductionMode && confirmText !== 'CONFIRMAR')
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    Confirmar Cambio
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'general' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isProductionMode && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-2 mb-4">
                                <ShieldAlert size={20} />
                                <div>
                                    <strong>Configuración Bloqueada:</strong> La configuración de infraestructura no se puede modificar mientras el sistema está en Modo Producción.
                                </div>
                            </div>
                        )}
                        <Card title="Identidad Corporativa">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Logo Upload */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative group ${!isProductionMode ? 'cursor-pointer hover:border-primary' : 'cursor-not-allowed opacity-60'} transition-colors`}>
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
                                            disabled={isProductionMode}
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
                                        disabled={isProductionMode}
                                    />
                                    <Input
                                        label="Dirección"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        icon={<MapPin size={18} />}
                                        required
                                        disabled={isProductionMode}
                                    />
                                    <Input
                                        label="Teléfono de Contacto"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        icon={<Phone size={18} />}
                                        required
                                        disabled={isProductionMode}
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

                        <Card title="Infraestructura del Sistema">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-text-main">Conexión a Base de Datos y Almacenamiento</h3>
                                    <p className="text-sm text-text-secondary">
                                        Configure la conexión a PostgreSQL, MinIO y OpenSearch para el entorno de producción.
                                    </p>
                                </div>
                                <Button onClick={() => navigate('/settings/connection-wizard')} variant="secondary">
                                    <Database size={18} className="mr-2" />
                                    Wizard Conexión a Base de Datos
                                </Button>
                            </div>
                        </Card>



                        <div className="flex justify-end">
                            <Button type="submit" isLoading={loading}>
                                <Save size={20} className="mr-2" />
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                )
            }



            {
                activeTab === 'printers' && (
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
                )
            }

            {
                activeTab === 'backups' && (
                    <div className="space-y-6">
                        <Card title="Gestión de Respaldos (Backups)">
                            <div className="space-y-6">
                                <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="flex gap-3">
                                        <Database className="text-blue-600 flex-shrink-0" size={24} />
                                        <div>
                                            <h3 className="text-sm font-bold text-blue-900">Respaldo Manual de Datos</h3>
                                            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                                                Genere un archivo de respaldo completo que incluye pacientes, casos, configuraciones y registros de auditoría.
                                                <br />
                                                <span className="font-medium">Nota:</span> Los archivos de imagen grandes no se incluyen en el respaldo para optimizar el espacio.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleManualBackup}
                                        disabled={isBackingUp}
                                        className="flex items-center gap-2"
                                    >
                                        {isBackingUp ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
                                        {isBackingUp ? 'Procesando...' : 'Crear Respaldo Ahora'}
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Historial de Respaldos</h3>

                                    {backupHistory.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            <Database size={32} className="mx-auto text-gray-300 mb-2" />
                                            <p className="text-sm text-text-secondary">No hay respaldos registrados aún.</p>
                                        </div>
                                    ) : (
                                        <div className="border border-border rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 border-b border-border">
                                                    <tr>
                                                        <th className="px-4 py-2 font-semibold text-text-main">Fecha y Hora</th>
                                                        <th className="px-4 py-2 font-semibold text-text-main">Tipo</th>
                                                        <th className="px-4 py-2 font-semibold text-text-main">Versión</th>
                                                        <th className="px-4 py-2 font-semibold text-text-main text-right">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {backupHistory.map((backup, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-text-main">
                                                                {new Date(backup.timestamp).toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${backup.type === 'auto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                                    }`}>
                                                                    {backup.type === 'auto' ? 'Automático' : 'Manual'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                                                                v{backup.version}
                                                            </td>
                                                            <td className="px-4 py-3 text-right space-x-2">
                                                                <button
                                                                    onClick={() => downloadBackup(backup.data)}
                                                                    className="p-1.5 text-text-secondary hover:text-primary transition-colors"
                                                                    title="Descargar archivo JSON"
                                                                >
                                                                    <Download size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRestore(backup)}
                                                                    className="p-1.5 text-text-secondary hover:text-red-600 transition-colors"
                                                                    title="Restaurar este respaldo"
                                                                >
                                                                    <RefreshCw size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                                    <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-900">Política de Retención</h4>
                                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                            El sistema mantiene automáticamente los últimos 7 respaldos diarios y los últimos 4 semanales.
                                            Los respaldos manuales no se eliminan automáticamente.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Seguridad y Recuperación">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert className="text-primary mt-1" size={18} />
                                    <div>
                                        <h4 className="text-sm font-bold text-text-main">Integridad de Datos</h4>
                                        <p className="text-xs text-text-secondary mt-1">
                                            Cada respaldo incluye una firma de integridad para asegurar que los datos no hayan sido alterados.
                                            Al restaurar, el sistema valida automáticamente la estructura de los datos.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Info className="text-primary mt-1" size={18} />
                                    <div>
                                        <h4 className="text-sm font-bold text-text-main">Proceso de Restauración</h4>
                                        <p className="text-xs text-text-secondary mt-1">
                                            La restauración es un proceso crítico que reemplazará toda la información actual del sistema.
                                            Se recomienda realizar un respaldo manual antes de proceder con cualquier restauración.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }
            {
                activeTab === 'ai' && (
                    <div className="space-y-6">
                        <Card title="Configuración de Inteligencia Artificial">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium text-text-main">Habilitar Módulo de IA</h3>
                                        <p className="text-sm text-text-secondary">
                                            Activa las funciones de asistencia diagnóstica, triaje y métricas.
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="ai-toggle-tab"
                                            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            checked={!!formData.aiEnabled}
                                            onChange={e => setFormData({ ...formData, aiEnabled: e.target.checked })}
                                        />
                                        <label htmlFor="ai-toggle-tab" className="ml-2 text-sm text-text-main cursor-pointer">
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
                                            El sistema utiliza GPT-4o para análisis avanzado. La llave se almacena de forma segura en su navegador.
                                        </p>
                                        {!formData.openaiApiKey && (
                                            <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100 flex items-center gap-2">
                                                <Info size={14} />
                                                <span>Modo Simulación: Se utilizarán respuestas de prueba predefinidas.</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </Card>

                        <Card title="Configuración Avanzada de IA">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-text-main mb-3 uppercase tracking-wider">Módulos Activos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            {
                                                id: 'qc_enabled',
                                                label: 'Control de Calidad (QC)',
                                                desc: 'Verifica nitidez e iluminación.',
                                                tooltip: 'Analiza la calidad técnica de las imágenes (enfoque, iluminación, artefactos) antes de procesarlas, evitando diagnósticos erróneos por mala calidad visual.'
                                            },
                                            {
                                                id: 'triage_enabled',
                                                label: 'Triaje / Pre-clasificación',
                                                desc: 'Identifica sospecha neoplásica.',
                                                tooltip: 'Realiza una evaluación rápida inicial para categorizar el caso por nivel de urgencia y sospecha de malignidad, priorizando la carga de trabajo del patólogo.'
                                            },
                                            {
                                                id: 'differentials_enabled',
                                                label: 'Asistencia Diagnóstica',
                                                desc: 'Sugiere diagnósticos diferenciales.',
                                                tooltip: 'Sugiere una lista de posibles diagnósticos basados en patrones visuales y datos clínicos, proporcionando referencias bibliográficas y casos similares de apoyo.'
                                            },
                                            {
                                                id: 'metrics_enabled',
                                                label: 'Métricas Cuantitativas',
                                                desc: 'Conteo de mitosis y otros índices.',
                                                tooltip: 'Calcula automáticamente índices de proliferación (Ki-67), conteo de mitosis o áreas de invasión, proporcionando datos objetivos para la gradación del tumor.'
                                            },
                                            {
                                                id: 'report_structure_enabled',
                                                label: 'Estructuración de Informe',
                                                desc: 'Genera borradores estructurados.',
                                                tooltip: 'Organiza los hallazgos en un formato estandarizado (ej. CAP checklists), facilitando la redacción del informe final y asegurando que no se omitan datos críticos.'
                                            }
                                        ].map(mod => (
                                            <div
                                                key={mod.id}
                                                className="flex items-start gap-3 p-3 border border-border rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors group relative"
                                                title={mod.tooltip}
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={mod.id}
                                                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    checked={aiConfig.modules[mod.id]}
                                                    onChange={e => updateAIConfig({ modules: { ...aiConfig.modules, [mod.id]: e.target.checked } })}
                                                />
                                                <label htmlFor={mod.id} className="cursor-pointer">
                                                    <span className="block text-sm font-medium text-text-main group-hover:text-blue-700">{mod.label}</span>
                                                    <span className="block text-xs text-text-secondary">{mod.desc}</span>
                                                </label>

                                                {/* Tooltip Icon */}
                                                <div className="absolute top-2 right-2 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Info size={14} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h3 className="text-sm font-bold text-text-main mb-3 uppercase tracking-wider">Reglas de Flujo y Comportamiento</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-text-main">Continuar si la calidad es baja (QC)</p>
                                                <p className="text-xs text-text-secondary">Si se desactiva, el análisis se detendrá si el QC es "Bajo".</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                checked={aiConfig.rules.continue_if_low_qc}
                                                onChange={e => updateAIConfig({ rules: { ...aiConfig.rules, continue_if_low_qc: e.target.checked } })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-text-main">Ejecutar métricas solo si hay alta sospecha</p>
                                                <p className="text-xs text-text-secondary">Optimiza el uso de tokens ejecutando conteos solo en casos relevantes.</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                checked={aiConfig.rules.run_metrics_only_if_high_suspicion}
                                                onChange={e => updateAIConfig({ rules: { ...aiConfig.rules, run_metrics_only_if_high_suspicion: e.target.checked } })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-text-main">Máximo de reintentos por módulo</p>
                                                <p className="text-xs text-text-secondary">Número de veces que la IA intentará corregir un JSON inválido.</p>
                                            </div>
                                            <select
                                                className="rounded-md border border-border bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
                                                value={aiConfig.global.max_retries}
                                                onChange={e => updateAIConfig({ global: { ...aiConfig.global, max_retries: parseInt(e.target.value) } })}
                                            >
                                                <option value={0}>Sin reintentos</option>
                                                <option value={1}>1 reintento</option>
                                                <option value={2}>2 reintentos (Recomendado)</option>
                                                <option value={3}>3 reintentos</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Telemetría y Métricas de Uso">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-text-main">Habilitar Registro de Métricas</h3>
                                        <p className="text-sm text-text-secondary">
                                            Permite recopilar datos técnicos anónimos (tiempos de respuesta, tasa de éxito) para mejorar los modelos.
                                            <br />
                                            <span className="text-[10px] text-orange-600 font-medium">No se registran datos de pacientes ni imágenes.</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="telemetry-toggle"
                                            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                            checked={!!formData.aiTelemetryEnabled}
                                            onChange={e => setFormData({ ...formData, aiTelemetryEnabled: e.target.checked })}
                                        />
                                        <label htmlFor="telemetry-toggle" className="ml-2 text-sm text-text-main cursor-pointer">
                                            {formData.aiTelemetryEnabled ? 'Activado' : 'Desactivado'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Reglas de Formateo y Lenguaje Clínico">
                            <div className="space-y-4">
                                <p className="text-sm text-text-secondary">
                                    Para garantizar la seguridad del paciente, todos los resultados generados por la IA se formatean siguiendo principios de prudencia médica:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                        <h4 className="text-xs font-bold text-text-main uppercase mb-2">Lenguaje No Afirmativo</h4>
                                        <ul className="text-xs text-text-secondary space-y-1">
                                            <li>• "Sugerencia" en lugar de "Diagnóstico"</li>
                                            <li>• "Estimación" en lugar de "Valor"</li>
                                            <li>• "Orientativo" en lugar de "Definitivo"</li>
                                        </ul>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                        <h4 className="text-xs font-bold text-text-main uppercase mb-2">Notas de Seguridad</h4>
                                        <p className="text-xs text-text-secondary">
                                            Cada sección incluye automáticamente la advertencia: <br />
                                            <span className="italic font-medium">"Requiere validación del patólogo"</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Vista Previa de Resultado Formateado">
                            <div className="border border-blue-100 rounded-lg overflow-hidden">
                                <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                                    <span className="text-sm font-bold text-blue-800">Métricas Cuantitativas (Estimadas)</span>
                                    <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded uppercase font-bold">IA</span>
                                </div>
                                <div className="p-4 bg-white space-y-3">
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-sm text-text-secondary">Conteo de Mitosis</span>
                                        <span className="text-sm font-mono font-bold text-text-main">~12 / 10 HPF</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-text-secondary">Índice Ki-67</span>
                                        <span className="text-sm font-mono font-bold text-text-main">~40%</span>
                                    </div>
                                    <div className="mt-4 p-2 bg-yellow-50 border border-yellow-100 rounded text-[11px] text-yellow-800 italic">
                                        Estimación asistida por IA. Confirmación manual requerida.
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="flex justify-end">
                            <Button onClick={handleSubmit} isLoading={loading}>
                                <Save size={20} className="mr-2" />
                                Guardar Configuración IA
                            </Button>
                        </div>
                    </div>
                )
            }

            <div className="flex justify-end">
            </div>
        </div >
    );
};

export default Settings;
