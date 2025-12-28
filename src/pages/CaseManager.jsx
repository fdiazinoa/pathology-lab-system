import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Search, Plus, FileText, Settings, Users, Activity,
    ChevronRight, Calendar, Clock, AlertCircle, CheckCircle,
    Printer, Download, Upload, X, Edit, Trash2, Save,
    Microscope, Beaker, FileCheck, AlertTriangle, Menu,
    Mic, MicOff, Wand2, Package, ArrowLeft,
    DollarSign, Shield, FileKey, Share2, MessageSquare, CheckSquare
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUploader from '../components/ImageUploader';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import Modal from '../components/Modal';
import LabWorkflow from '../components/LabWorkflow';
import { useData } from '../services/DataContext';
import { analyzeCase, trainModel, validateDiagnosis, preClassifyCase, analyzeQuantitativeMetrics, generateStructuredReport, analyzeQualityControl, analyzeMacroscopy } from '../services/aiService';

const CaseManager = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { patients, addCase, updateCase, getCase, cases, insurers, organs, doctors, settings, updateCaseInterconsultation, exams, currentUser, roles } = useData();

    console.log("CaseManager settings:", settings);

    // Permission Check
    const userRole = roles.find(r => r.id === currentUser?.roleId);
    const canViewFinancials = userRole?.permissions?.financials?.read;

    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiResults, setAiResults] = useState(null);
    const [isConversationalMode, setIsConversationalMode] = useState(false);
    const [conversationalText, setConversationalText] = useState('');

    // Dictation State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const toggleDictation = () => {
        if (!settings.enableMicrophone) {
            alert("Por favor habilite el micrófono en la sección de Configuración para usar esta función.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (!('webkitSpeechRecognition' in window)) {
                alert("Su navegador no soporta reconocimiento de voz. Por favor use Chrome o Edge.");
                return;
            }

            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'es-ES';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Append to existing text if it's a new session, but here we just update the current view
                // Ideally we want to append, but for simplicity in this React state model:
                // We'll just update the state. Note: This simple logic might overwrite if not careful with previous text.
                // Better approach:
                // We can't easily append "live" to existing text without complex cursor management.
                // So we'll just append the FINAL results to the state.

                if (finalTranscript) {
                    setConversationalText(prev => prev + (prev ? ' ' : '') + finalTranscript);
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        type: '',
        examId: '',
        price: 0,
        organ: '',
        clinicalData: '',
        macroscopy: '',
        microscopy: '',
        ihc: '',
        diagnosis: '',
        paymentType: 'Privado',
        arsName: '',
        images: [],
        contributeToAi: true,
        aiClassification: null,
        quantitativeResults: {},
        qualityControl: null,
        interconsultation: null,
        tracking: null,
        microscopyStructured: {}
    });

    const [validationModal, setValidationModal] = useState({
        isOpen: false,
        title: '',
        message: ''
    });

    const hasLoggedView = useRef(false);

    // Effect to load case data - depends on cases directly, not getCase function
    useEffect(() => {
        if (id && cases.length > 0) {
            const existingCase = cases.find(c => c.id === id);
            if (existingCase) {
                setFormData({
                    patientId: existingCase.patientId,
                    doctorId: existingCase.doctorId || '',
                    type: existingCase.type,
                    examId: existingCase.examId || '',
                    price: existingCase.price || 0,
                    organ: existingCase.organ,
                    clinicalData: existingCase.clinicalData,
                    macroscopy: existingCase.macroscopy,
                    microscopy: existingCase.microscopy,
                    diagnosis: existingCase.diagnosis,
                    paymentType: existingCase.paymentType || 'Privado',
                    arsName: existingCase.arsName || '',
                    images: existingCase.images || [],
                    contributeToAi: existingCase.contributeToAi !== undefined ? existingCase.contributeToAi : true,
                    aiClassification: existingCase.aiClassification || null,
                    quantitativeResults: existingCase.quantitativeResults || {},
                    qualityControl: existingCase.qualityControl || null,
                    interconsultation: existingCase.interconsultation || null,
                    tracking: existingCase.tracking || null,
                    microscopyStructured: existingCase.microscopyStructured || {},
                    ihc: existingCase.ihc || ''
                });
            }
        }
    }, [id, cases]);

    const getPrice = (examId, pType) => {
        const exam = exams?.find(e => e.id === examId);
        if (!exam) return 0;
        return pType === 'Privado' ? exam.pricePrivate : exam.priceInsurance;
    };

    const handleExamChange = (e) => {
        const selectedExamId = e.target.value;
        const selectedExam = exams.find(ex => ex.id === selectedExamId);
        const newPrice = getPrice(selectedExamId, formData.paymentType);

        setFormData(prev => ({
            ...prev,
            examId: selectedExamId,
            type: selectedExam ? selectedExam.name : '',
            price: newPrice
        }));
    };

    const handlePaymentTypeChange = (e) => {
        const newPaymentType = e.target.value;
        const newPrice = getPrice(formData.examId, newPaymentType);

        setFormData(prev => ({
            ...prev,
            paymentType: newPaymentType,
            price: newPrice,
            arsName: newPaymentType === 'Privado' ? '' : prev.arsName
        }));
    };

    // ... (rest of functions) ...

    // (Inside render, replace the "Tipo de Estudio" and "Payment Type" sections)
    // I will target the specific block in the next tool call or use a larger chunk here if safe.
    // Since I can't easily target just the render block without context, I'll stick to the logic updates first.
    // Wait, I need to replace the whole component or at least the state/logic part and then the render part.
    // The tool allows replacing a block. I'll replace the top part of the component first.

    // Actually, I'll do it in one go if possible, but the file is large.
    // I'll replace the state initialization and useEffect first.


    const handleAnalyze = async () => {
        if (formData.images.length === 0 && !formData.microscopy) {
            alert("Por favor sube imágenes o escribe una descripción microscópica para analizar.");
            return;
        }

        setAnalyzing(true);
        try {
            const results = await analyzeCase(formData.microscopy, formData.images, formData.organ, settings.openaiApiKey, formData.aiClassification);
            setAiResults(results);
        } catch (error) {
            console.error("Error analyzing:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handlePreClassify = async () => {
        if (formData.images.length === 0) {
            alert("Sube al menos una imagen para pre-clasificar.");
            return;
        }
        setAnalyzing(true);
        try {
            const classification = await preClassifyCase(formData.images, settings.openaiApiKey);
            setFormData(prev => ({ ...prev, aiClassification: classification }));
        } catch (error) {
            console.error("Pre-classification error:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleQuantitativeAnalysis = async (type) => {
        if (formData.images.length === 0) {
            alert("Sube al menos una imagen para analizar.");
            return;
        }
        setAnalyzing(true);
        try {
            const result = await analyzeQuantitativeMetrics(formData.images, type, settings.openaiApiKey);
            setFormData(prev => ({
                ...prev,
                quantitativeResults: {
                    ...prev.quantitativeResults,
                    [type]: result
                }
            }));
        } catch (error) {
            console.error("Quantitative analysis error:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConversationalGenerate = async () => {
        if (!conversationalText.trim()) {
            alert("Por favor escribe o dicta el reporte primero.");
            return;
        }
        setAnalyzing(true);
        try {
            const report = await generateStructuredReport(conversationalText, settings.openaiApiKey);
            if (report) {
                setFormData(prev => ({
                    ...prev,
                    organ: report.organ || prev.organ,
                    type: report.type || prev.type,
                    macroscopy: report.macroscopy || prev.macroscopy,
                    microscopy: report.microscopy || prev.microscopy,
                    diagnosis: report.diagnosis || prev.diagnosis,
                    clinicalData: report.clinicalData || prev.clinicalData
                }));
                setIsConversationalMode(false); // Close mode after success
            }
        } catch (error) {
            console.error("Conversational generation error:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleQualityControl = async () => {
        if (formData.images.length === 0) {
            alert("Sube al menos una imagen para verificar calidad.");
            return;
        }
        setAnalyzing(true);
        try {
            const result = await analyzeQualityControl(formData.images, settings.openaiApiKey);
            setFormData(prev => ({ ...prev, qualityControl: result }));
        } catch (error) {
            console.error("Quality control error:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleRequestInterconsultation = () => {
        const newInterconsultation = {
            status: 'Pending',
            consultantId: '',
            requestDate: new Date().toISOString(),
            notes: '',
            comments: [],
            feeSplit: { lab: 70, consultant: 30 },
            jointSignature: false
        };
        setFormData(prev => ({ ...prev, interconsultation: newInterconsultation }));
    };

    const handleAddComment = (text) => {
        if (!text.trim()) return;
        const comment = {
            author: 'Yo (Patólogo Principal)',
            text: text,
            date: new Date().toISOString()
        };
        setFormData(prev => ({
            ...prev,
            interconsultation: {
                ...prev.interconsultation,
                comments: [...(prev.interconsultation.comments || []), comment]
            }
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. AI Validation (Skip if disabled)
        if (!settings?.aiEnabled) {
            proceedWithSave(false);
            return;
        }

        // 1. Validate Diagnosis with AI
        try {
            setLoading(true);
            const validation = await validateDiagnosis(
                formData.diagnosis,
                formData.organ,
                formData.macroscopy,
                formData.microscopy,
                formData.images,
                settings.openaiApiKey
            );

            if (!validation.valid) {
                setValidationModal({
                    isOpen: true,
                    title: 'Alerta de Validación AI',
                    message: validation.warning
                });
                setLoading(false);
                return;
            }

            // If valid, check if it was certified by AI
            if (validation.aiCertified) {
                proceedWithSave(true);
                return;
            }

        } catch (error) {
            console.error("Validation error:", error);
            alert("No se pudo validar el diagnóstico con la IA: " + error.message + "\n\nEl caso se guardará SIN certificación.");
        }

        // 2. If valid (but not necessarily certified or simulation), proceed
        proceedWithSave(false);
    };

    const proceedWithSave = (isCertified = false) => {
        setLoading(true);
        setValidationModal({ ...validationModal, isOpen: false });

        const selectedPatient = patients.find(p => p.id === formData.patientId);

        // If editing, keep ID, else create new
        // If editing, keep ID, else create new
        const caseId = id || `C-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, '0')}`;

        const caseData = {
            id: caseId,
            patientName: selectedPatient ? selectedPatient.name : 'Desconocido',
            age: selectedPatient ? selectedPatient.age : '?',
            sex: selectedPatient ? selectedPatient.sex : '?',
            status: 'Finalizado',
            createdAt: id ? (getCase(id)?.createdAt) : new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
            aiCertified: isCertified,
            ...formData
        };

        // Simulate save delay
        setTimeout(async () => {
            const logAction = id ? 'Edición de Datos Generales' : 'Creación de Caso';
            const logDetails = id ? 'Se modificaron los datos básicos del caso.' : 'Caso registrado en el sistema.';

            const caseWithLog = {
                ...caseData,
                auditLogs: [...(caseData.auditLogs || []), {
                    date: new Date().toISOString(),
                    user: currentUser ? currentUser.name : 'Sistema',
                    action: logAction,
                    details: logDetails
                }]
            };

            if (id) {
                updateCase(caseWithLog);
            } else {
                addCase(caseWithLog);
                navigate('/dashboard');
            }

            if (formData.contributeToAi) {
                try {
                    await trainModel(caseWithLog);
                    // In a real app, we might show a toast here, for now we will alert
                    alert(isCertified ? "Caso guardado y CERTIFICADO por IA." : "Caso guardado exitosamente.");
                } catch (err) {
                    console.error("Training error", err);
                }
            }

            setLoading(false);
            navigate(`/cases/${caseId}`);
        }, 1000);
    };

    const handleModuleAccess = (moduleName, path) => {
        if (!id) return alert("Debe guardar el caso primero.");

        if (settings.requireInternalQRScan) {
            const scan = window.prompt(`[SEGURIDAD] Escanee el código QR de la muestra para acceder a ${moduleName}:`);
            // For simulation, we check if the input matches the Case ID
            if (scan !== id) {
                alert("Código QR incorrecto o no escaneado. Acceso denegado.");
                return;
            }
        }

        // Audit Log
        const logEntry = {
            date: new Date().toISOString(),
            user: currentUser?.name || 'Sistema',
            action: `Acceso a ${moduleName}`,
            qrVerified: settings.requireInternalQRScan
        };

        const currentCase = cases.find(c => c.id === id);
        if (currentCase) {
            const updatedCase = {
                ...currentCase,
                auditLogs: [...(currentCase.auditLogs || []), logEntry]
            };
            updateCase(updatedCase);
        }

        navigate(path);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">{id ? 'Editar Caso' : 'Nuevo Caso de Anatomía Patológica'}</h1>
                        <p className="text-text-secondary">Complete los datos del estudio y utilice la IA para apoyo diagnóstico.</p>
                    </div>
                </div>
                <Button
                    variant={isConversationalMode ? "primary" : "secondary"}
                    onClick={() => setIsConversationalMode(!isConversationalMode)}
                >
                    {isConversationalMode ? 'Cerrar Asistente' : 'Modo Conversacional / Dictado'}
                </Button>
            </div>

            {/* AI Conversational Assistant Toggle */}
            {settings?.aiEnabled && (
                <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                        <Wand2 size={18} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Asistente Conversacional IA</span>
                        <div className="flex items-center ml-2">
                            <input
                                type="checkbox"
                                id="ai-assistant-toggle"
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                checked={isConversationalMode}
                                onChange={e => setIsConversationalMode(e.target.checked)}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-text-secondary italic">
                        Activa para dictar o escribir hallazgos en lenguaje natural y generar el informe.
                    </p>
                </div>
            )}

            {isConversationalMode && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <Wand2 size={20} />
                                Asistente de Reporte Conversacional
                            </h3>
                            <p className="text-sm text-blue-700">
                                Escribe o dicta el caso en lenguaje natural (ej: "Biopsia de próstata con adenocarcinoma Gleason 7...").
                                La IA estructurará el informe automáticamente.
                            </p>
                        </div>
                        <Button
                            onClick={toggleDictation}
                            variant={isListening ? "danger" : "secondary"}
                            className={`transition-all ${isListening ? 'animate-pulse' : ''}`}
                            title={!settings.enableMicrophone ? "Habilite el micrófono en Configuración" : ""}
                        >
                            {isListening ? <MicOff size={18} className="mr-2" /> : <Mic size={18} className="mr-2" />}
                            {isListening ? 'Detener Dictado' : 'Iniciar Dictado'}
                        </Button>
                    </div>

                    <textarea
                        className="w-full h-32 p-4 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white shadow-inner text-lg"
                        placeholder="Escribe aquí los hallazgos o presiona 'Iniciar Dictado'..."
                        value={conversationalText}
                        onChange={(e) => setConversationalText(e.target.value)}
                    />
                    <div className="mt-4 flex justify-end">
                        <Button
                            onClick={handleConversationalGenerate}
                            isLoading={analyzing}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Generar Informe Estructurado
                        </Button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Patient & Study Data */}
                <Card title="Datos del Caso">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Paciente</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.patientId}
                                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Paciente...</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Tipo de Estudio / Examen</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.examId}
                                onChange={handleExamChange}
                                required
                            >
                                <option value="">Seleccionar Examen...</option>
                                {exams && exams.map(ex => (
                                    <option key={ex.id} value={ex.id}>{ex.code} - {ex.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Órgano / Localización</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.organ}
                                onChange={e => setFormData({ ...formData, organ: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Órgano...</option>
                                {organs && organs.map(org => (
                                    <option key={org.id} value={org.name}>{org.name}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Datos Clínicos Relevantes"
                            placeholder="Ej. Nódulo palpable, antecedentes de..."
                            value={formData.clinicalData}
                            onChange={e => setFormData({ ...formData, clinicalData: e.target.value })}
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Tipo de Pago / Cobertura</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.paymentType || 'Privado'}
                                onChange={handlePaymentTypeChange}
                            >
                                <option value="Privado">Privado</option>
                                <option value="Asegurado">Asegurado</option>
                            </select>
                        </div>

                        {formData.paymentType === 'Asegurado' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text-main">Seleccionar ARS / Seguro</label>
                                <select
                                    className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.arsName || ''}
                                    onChange={e => setFormData({ ...formData, arsName: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {insurers && insurers.map(ins => (
                                        <option key={ins.id} value={ins.name}>
                                            {ins.name} ({ins.tariff})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text-main">Doctor Asignado</label>
                            <select
                                className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={formData.doctorId}
                                onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Doctor...</option>
                                {doctors && doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                                ))}
                            </select>
                        </div>

                        {canViewFinancials && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-text-main">Costo Estimado</label>
                                <div className="flex items-center px-3 py-2 bg-gray-50 border border-border rounded-md text-sm font-bold text-gray-700">
                                    <DollarSign size={16} className="mr-2 text-green-600" />
                                    {new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(formData.price || 0)}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Lab Workflow & Traceability (Configurable) */}
                {settings.enableLabWorkflow && (
                    <LabWorkflow
                        trackingData={formData.tracking}
                        onUpdateTracking={(step, data) => setFormData(prev => ({
                            ...prev,
                            tracking: {
                                ...prev.tracking,
                                [step]: data
                            }
                        }))}
                        settings={settings}
                        currentUser={currentUser}
                        caseId={id}
                    />
                )}

                {/* Macroscopy & Microscopy */}
                <Card title="Descripción">
                    <div className="space-y-4">
                        <div className="flex justify-end mb-2 gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleModuleAccess('Módulo Macroscopía', `/cases/${id}/macroscopy`)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                                <Package size={16} className="mr-2" />
                                Módulo Macroscopía
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleModuleAccess('Módulo Microscopía', `/cases/${id}/microscopy`)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                <Wand2 size={16} className="mr-2" />
                                Módulo Microscopía
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleModuleAccess('Módulo IHQ', `/cases/${id}/immunohistochemistry`)}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                                <Microscope size={16} className="mr-2" />
                                Módulo IHQ
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                label="Macroscopía"
                                textarea
                                placeholder="Descripción de la muestra recibida..."
                                value={formData.macroscopy}
                                onChange={e => setFormData({ ...formData, macroscopy: e.target.value })}
                                className="flex-1"
                            />
                            {settings?.aiEnabled && (
                                <div className="mt-8">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={async () => {
                                            if (formData.images.length === 0) return alert("Sube imágenes primero");
                                            setAnalyzing(true);
                                            const res = await analyzeMacroscopy(formData.images, settings.openaiApiKey);
                                            if (res) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    macroscopy: prev.macroscopy + `\n\n[IA MACRO]: ${res.findings}.Dimensiones: ${res.dimensions}.Márgenes: ${res.margins}.`
                                                }));
                                            }
                                            setAnalyzing(false);
                                        }}
                                        disabled={analyzing}
                                        title="Analizar Macroscopía con IA"
                                    >
                                        <Wand2 size={18} />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <Input
                            label="Microscopía"
                            textarea
                            placeholder="Descripción de los hallazgos microscópicos..."
                            value={formData.microscopy}
                            onChange={e => setFormData({ ...formData, microscopy: e.target.value })}
                            className="h-32"
                        />

                        {/* IHC Section */}
                        <div className="flex gap-2 items-start">
                            <Input
                                label="Inmunohistoquímica"
                                textarea
                                placeholder="Resultados de marcadores IHQ..."
                                value={formData.ihc}
                                onChange={e => setFormData({ ...formData, ihc: e.target.value })}
                                className="h-24 flex-1"
                            />
                            <div className="mt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const existingCase = cases.find(c => c.id === id);
                                        if (existingCase && existingCase.ihc_results && existingCase.ihc_results.length > 0) {
                                            const summary = existingCase.ihc_results.map(m =>
                                                `${m.name}: ${m.result} ${m.result === 'Positivo' ? `(${m.percentage}%, ${m.intensity})` : ''}`
                                            ).join('\n');

                                            setFormData(prev => ({
                                                ...prev,
                                                ihc: summary
                                            }));
                                            alert("Resultados importados del Módulo IHQ.");
                                        } else {
                                            alert("No hay resultados guardados en el Módulo IHQ para importar.");
                                        }
                                    }}
                                    title="Importar desde Módulo IHQ"
                                >
                                    <FileText size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Images */}
                <Card title="Imágenes de la Muestra">
                    <ImageUploader
                        images={formData.images}
                        onImagesChange={imgs => setFormData({ ...formData, images: imgs })}
                    />
                    <div className="mt-4 flex justify-end">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleQualityControl}
                                isLoading={analyzing}
                                disabled={analyzing || formData.images.length === 0}
                                className="border border-gray-300 text-gray-700"
                            >
                                <Activity size={18} className="mr-2" />
                                Control Calidad
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handlePreClassify}
                                isLoading={analyzing}
                                disabled={analyzing || formData.images.length === 0}
                            >
                                <Activity size={18} className="mr-2" />
                                Pre-Clasificar (Triage)
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAnalyze}
                                isLoading={analyzing}
                                disabled={analyzing}
                                className="bg-gradient-to-r from-primary to-blue-600 text-white border-none"
                            >
                                <Wand2 size={18} className="mr-2" />
                                {analyzing ? 'Analizando...' : 'Analizar con IA'}
                            </Button>
                        </div>
                    </div>

                    {formData.qualityControl && (
                        <div className={`mt - 4 p - 3 rounded - lg border ${formData.qualityControl.score >= 7 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} `}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className={`font - bold ${formData.qualityControl.score >= 7 ? 'text-green-800' : 'text-red-800'} `}>
                                        Calidad Técnica: {formData.qualityControl.score}/10 ({formData.qualityControl.recommendation})
                                    </h4>
                                    {formData.qualityControl.issues.length > 0 && (
                                        <ul className="list-disc list-inside text-sm mt-1 text-gray-700">
                                            {formData.qualityControl.issues.map((issue, idx) => (
                                                <li key={idx}>{issue}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1 italic">
                                        "{formData.qualityControl.reasoning}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {settings?.aiEnabled && formData.aiClassification && (
                        <div className={`mt - 4 p - 3 rounded - lg border ${formData.aiClassification.nature === 'Maligno' ? 'bg-red-50 border-red-200' :
                            formData.aiClassification.nature === 'Sospechoso' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-green-50 border-green-200'
                            } `}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className={`font - bold ${formData.aiClassification.nature === 'Maligno' ? 'text-red-700' :
                                        formData.aiClassification.nature === 'Sospechoso' ? 'text-yellow-700' :
                                            'text-green-700'
                                        } `}>
                                        {formData.aiClassification.nature.toUpperCase()}
                                        {formData.aiClassification.grade && ` - ${formData.aiClassification.grade} `}
                                    </h4>
                                    <p className="text-sm text-text-secondary mt-1">
                                        {formData.aiClassification.category} • Probabilidad Malignidad: {formData.aiClassification.probability}%
                                    </p>
                                    <p className="text-xs text-text-secondary mt-1 italic">
                                        "{formData.aiClassification.reasoning}"
                                    </p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 bg-white rounded border border-gray-200">
                                    Pre-Clasificación IA
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Quantitative Analysis Section */}
                    {settings?.aiEnabled && (
                        <div className="mt-6 border-t border-border pt-4">
                            <h4 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
                                <Activity size={16} className="text-primary" />
                                Análisis Cuantitativo
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleQuantitativeAnalysis('mitosis')} disabled={analyzing} className="border border-border">
                                    Contaje Mitosis
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleQuantitativeAnalysis('ki67')} disabled={analyzing} className="border border-border">
                                    Ki-67 / Biomarcadores
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleQuantitativeAnalysis('necrosis')} disabled={analyzing} className="border border-border">
                                    Detección Necrosis
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {formData.quantitativeResults?.mitosis && (
                                    <div className="p-2 bg-blue-50 border border-blue-100 rounded text-sm">
                                        <span className="font-bold text-blue-800">Mitosis:</span> {formData.quantitativeResults.mitosis.count} / 10 HPF
                                        <p className="text-xs text-blue-600 mt-0.5">{formData.quantitativeResults.mitosis.reasoning}</p>
                                    </div>
                                )}
                                {formData.quantitativeResults?.ki67 && (
                                    <div className="p-2 bg-purple-50 border border-purple-100 rounded text-sm">
                                        <span className="font-bold text-purple-800">Ki-67:</span> {formData.quantitativeResults.ki67.percentage}% ({formData.quantitativeResults.ki67.score})
                                        <p className="text-xs text-purple-600 mt-0.5">{formData.quantitativeResults.ki67.reasoning}</p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2 text-xs text-purple-700 border border-purple-200 hover:bg-purple-100 w-full justify-center"
                                            onClick={() => {
                                                const text = `\n\nINMUNOHISTOQUÍMICA (IA):\nKi-67: ${formData.quantitativeResults.ki67.percentage}% (${formData.quantitativeResults.ki67.score}). ${formData.quantitativeResults.ki67.reasoning}`;

                                                // Update both text and structured data to ensure sync with Microscopy Module
                                                setFormData(prev => ({
                                                    ...prev,
                                                    microscopy: (prev.microscopy || '') + text,
                                                    microscopyStructured: {
                                                        ...(prev.microscopyStructured || {}),
                                                        ihq: (prev.microscopyStructured?.ihq || '') + `\nKi-67: ${formData.quantitativeResults.ki67.percentage}% (IA).`
                                                    }
                                                }));
                                                alert("Agregado a la descripción microscópica y sincronizado con el módulo.");
                                            }}
                                        >
                                            <FileText size={14} className="mr-1" /> Insertar en Microscopía
                                        </Button>
                                    </div>
                                )}
                                {formData.quantitativeResults?.necrosis && (
                                    <div className="p-2 bg-gray-100 border border-gray-200 rounded text-sm">
                                        <span className="font-bold text-gray-800">Necrosis:</span> {formData.quantitativeResults.necrosis.present ? `Presente(${formData.quantitativeResults.necrosis.percentage} %)` : 'Ausente'}
                                        <p className="text-xs text-gray-600 mt-0.5">{formData.quantitativeResults.necrosis.reasoning}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* AI Results */}
                {aiResults && (
                    <AIAnalysisPanel
                        results={aiResults}
                        onSelectDiagnosis={(diag) => setFormData({ ...formData, diagnosis: diag })}
                    />
                )}

                {/* Final Diagnosis */}
                <Card title="Diagnóstico Definitivo">
                    <Input
                        textarea
                        placeholder="Escriba el diagnóstico final..."
                        value={formData.diagnosis}
                        onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                        className="min-h-[120px] text-lg font-medium"
                        required
                    />
                </Card>

                <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <input
                        type="checkbox"
                        id="aiTraining"
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        checked={formData.contributeToAi}
                        onChange={e => setFormData({ ...formData, contributeToAi: e.target.checked })}
                    />
                    <label htmlFor="aiTraining" className="text-sm text-text-main">
                        <span className="font-medium">Contribuir al entrenamiento de la IA.</span>
                        <span className="text-text-secondary ml-1">
                            Al marcar esta opción, las imágenes y el diagnóstico final se utilizarán anónimamente para mejorar la precisión del modelo.
                        </span>
                    </label>
                </div>

                <div className="flex justify-end gap-4 sticky bottom-4 bg-white/80 backdrop-blur p-4 border border-border rounded-lg shadow-lg">
                    <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>Cancelar</Button>
                    <Button type="submit" isLoading={loading} size="lg">
                        <Save size={20} className="mr-2" />
                        Guardar Informe
                    </Button>
                </div>
            </form>

            <Modal
                isOpen={validationModal.isOpen}
                onClose={() => setValidationModal({ ...validationModal, isOpen: false })}
                onConfirm={() => proceedWithSave(false)}
                title={validationModal.title}
                type="warning"
                confirmText="Guardar de todos modos"
                cancelText="Revisar Diagnóstico"
            >
                <p>{validationModal.message}</p>
            </Modal>
        </div>
    );
};

export default CaseManager;
