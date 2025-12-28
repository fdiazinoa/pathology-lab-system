import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_PATIENTS, MOCK_CASES, MOCK_GLOBAL_CASES } from './mockData';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [patients, setPatients] = useState(MOCK_PATIENTS);

    // Initialize cases from localStorage or default to MOCK_CASES
    const [cases, setCases] = useState(() => {
        try {
            const saved = localStorage.getItem('app_cases');
            return saved ? JSON.parse(saved) : MOCK_CASES;
        } catch (e) {
            console.error("Error reading cases", e);
            return MOCK_CASES;
        }
    });

    const [globalAuditLog, setGlobalAuditLog] = useState(() => {
        try {
            const saved = localStorage.getItem('app_global_audit_log');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error reading global audit log", e);
            return [];
        }
    });

    const [globalCases, setGlobalCases] = useState(() => {
        try {
            const saved = localStorage.getItem('app_global_cases');
            return saved ? JSON.parse(saved) : MOCK_GLOBAL_CASES;
        } catch (e) {
            console.error("Error reading global cases", e);
            return MOCK_GLOBAL_CASES;
        }
    });

    // Persist cases to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('app_cases', JSON.stringify(cases));
        } catch (e) {
            console.error("Error saving cases", e);
        }
    }, [cases]);

    useEffect(() => {
        try {
            localStorage.setItem('app_global_audit_log', JSON.stringify(globalAuditLog));
        } catch (e) {
            console.error("Error saving global audit log", e);
        }
    }, [globalAuditLog]);

    useEffect(() => {
        try {
            localStorage.setItem('app_global_cases', JSON.stringify(globalCases));
        } catch (e) {
            console.error("Error saving global cases", e);
        }
    }, [globalCases]);

    const [deliveries, setDeliveries] = useState(() => {
        try {
            const saved = localStorage.getItem('app_deliveries');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error reading deliveries", e);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('app_deliveries', JSON.stringify(deliveries));
        } catch (e) {
            console.error("Error saving deliveries", e);
        }
    }, [deliveries]);

    // Initialize settings from localStorage or default
    // Initialize settings from localStorage or default
    // Initialize settings from localStorage or default
    const [settings, setSettings] = useState(() => {
        const defaultSettings = {
            labName: 'Laboratorio Patología Digital',
            address: 'Av. Principal 123, Ciudad Médica',
            phone: '(555) 123-4567',
            email: 'contacto@labpatologia.com',
            logo: null,
            openaiApiKey: '',
            aiEnabled: true,
            enableLabWorkflow: true,
            enableMicrophone: false,
            requireInternalQRScan: false,
            printImagesInReport: true,
            paperSize: 'A4',
            printerConfig: {
                printers: [
                    { id: '1', name: 'Zebra ZD420 (Default)', type: 'Label', connection: 'USB', driver: 'ZPL', status: 'Online' },
                    { id: '2', name: 'HP LaserJet (Default)', type: 'Report', connection: 'System', driver: 'PDF', status: 'Online' }
                ],
                autoPrintLabels: false
            }
        };

        try {
            const saved = localStorage.getItem('app_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (e) {
            console.error("Error reading settings from localStorage", e);
            return defaultSettings;
        }
    });

    const [configHistory, setConfigHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('app_config_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error reading config history", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('app_config_history', JSON.stringify(configHistory));
    }, [configHistory]);

    const [insurers, setInsurers] = useState([
        { id: '1', name: 'ARS Humano', tariff: '80%' },
        { id: '2', name: 'ARS Palic', tariff: '100%' },
        { id: '3', name: 'ARS Universal', tariff: 'Fixed $1500' }
    ]);
    const [organs, setOrgans] = useState([
        { id: '1', name: 'Piel' },
        { id: '2', name: 'Mama' },
        { id: '3', name: 'Estómago' },
        { id: '4', name: 'Colon' },
        { id: '5', name: 'Próstata' },
        { id: '6', name: 'Tiroides' },
        { id: '6', name: 'Tiroides' },
        { id: '7', name: 'Ganglio Linfático' }
    ]);

    const [originCenters, setOriginCenters] = useState([
        { id: '1', name: 'Hospital General Plaza de la Salud' },
        { id: '2', name: 'Clínica Abreu' },
        { id: '3', name: 'Centro de Diagnóstico Especializado' },
        { id: '4', name: 'Consultorio Privado Dr. Pérez' }
    ]);

    const [doctors, setDoctors] = useState([
        {
            id: '1',
            name: 'Dr. Alejandro Pérez',
            license: 'MP 12345',
            email: 'alejandro.perez@lab.com',
            signatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Signature_sample.svg/1200px-Signature_sample.svg.png'
        }
    ]);

    const [equipment, setEquipment] = useState([
        { id: '1', name: 'Microtomo Leica RM2235', type: 'Microtomo', status: 'Online', serialNumber: 'SN-MIC-001', lastMaintenance: '2023-10-15' },
        { id: '2', name: 'Procesador de Tejidos Leica ASP300', type: 'Procesador', status: 'Processing', serialNumber: 'SN-PRO-002', lastMaintenance: '2023-11-01' },
        { id: '3', name: 'Escáner Aperio GT 450', type: 'Escáner WSI', status: 'Online', serialNumber: 'SN-SCN-003', lastMaintenance: '2023-09-20' },
        { id: '4', name: 'Teñidor Automático Sakura', type: 'Teñidor', status: 'Maintenance', serialNumber: 'SN-STN-004', lastMaintenance: '2023-08-10' }
    ]);

    const [lisConnection, setLisConnection] = useState({ status: 'Disconnected', lastSync: null, logs: [] });

    // --- SECURITY MODULE ---
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('app_user');
        return saved ? JSON.parse(saved) : null;
    });


    const [roles, setRoles] = useState([
        {
            id: '1',
            name: 'Administrador',
            description: 'Acceso total al sistema',
            permissions: {
                dashboard: { read: true, write: true, delete: true },
                patients: { read: true, write: true, delete: true },
                cases: { read: true, write: true, delete: true },
                reports: { read: true, write: true, delete: true },
                settings: { read: true, write: true, delete: true },
                security: { read: true, write: true, delete: true },
                financials: { read: true, write: true, delete: true }
            }
        },
        {
            id: '2',
            name: 'Patólogo',
            description: 'Diagnóstico y firma de casos',
            permissions: {
                dashboard: { read: true, write: false, delete: false },
                patients: { read: true, write: false, delete: false },
                cases: { read: true, write: true, delete: false },
                reports: { read: true, write: true, delete: false },
                settings: { read: true, write: false, delete: false },
                security: { read: false, write: false, delete: false },
                financials: { read: false, write: false, delete: false }
            }
        },
        {
            id: '3',
            name: 'Técnico',
            description: 'Procesamiento y carga de imágenes',
            permissions: {
                dashboard: { read: true, write: false, delete: false },
                patients: { read: true, write: true, delete: false },
                cases: { read: true, write: true, delete: false },
                reports: { read: false, write: false, delete: false },
                settings: { read: false, write: false, delete: false },
                security: { read: false, write: false, delete: false },
                financials: { read: false, write: false, delete: false }
            }
        },
        {
            id: '4',
            name: 'Repartidor',
            description: 'Entrega de resultados y logística',
            permissions: {
                dashboard: { read: true, write: false, delete: false },
                patients: { read: false, write: false, delete: false },
                cases: { read: false, write: false, delete: false },
                reports: { read: false, write: false, delete: false },
                settings: { read: false, write: false, delete: false },
                security: { read: false, write: false, delete: false },
                financials: { read: false, write: false, delete: false },
                logistics: { read: true, write: true, delete: false }
            }
        }
    ]);

    const [users, setUsers] = useState([
        { id: '1', name: 'Admin User', email: 'admin@lab.com', roleId: '1', status: 'Active', lastLogin: '2023-12-01 08:00' },
        { id: '2', name: 'Dra. Ana Pérez', email: 'ana.perez@lab.com', roleId: '2', status: 'Active', lastLogin: '2023-12-01 09:30' },
        { id: '3', name: 'Téc. Juan Soto', email: 'juan.soto@lab.com', roleId: '3', status: 'Active', lastLogin: '2023-12-01 07:45' },
        { id: '4', name: 'Carlos Mensajero', email: 'carlos.mensajero@lab.com', roleId: '4', status: 'Active', lastLogin: '2023-12-01 10:00' }
    ]);

    const login = useCallback(async (email, password) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock validation - In real app this goes to backend
        // For demo purposes, we'll accept any password if email matches a user
        // Or specific hardcoded credentials
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            // Check password (mock)
            if (password === 'admin123' || password === '123456') {
                setCurrentUser(user);
                localStorage.setItem('app_user', JSON.stringify(user));
                return { success: true };
            } else {
                return { success: false, message: 'Contraseña incorrecta' };
            }
        } else {
            // Allow a default admin login if users list is empty or messed up
            if (email === 'admin@lab.com' && password === 'admin123') {
                const adminUser = { id: '1', name: 'Admin User', email: 'admin@lab.com', roleId: '1' };
                setCurrentUser(adminUser);
                localStorage.setItem('app_user', JSON.stringify(adminUser));
                return { success: true };
            }
            return { success: false, message: 'Usuario no encontrado' };
        }
    }, [users]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem('app_user');
    }, []);



    const [exams, setExams] = useState([
        { id: '1', code: '88305', name: 'Biopsia Nivel IV', description: 'Tejido simple, biopsia única', pricePrivate: 2500, priceInsurance: 1500 },
        { id: '2', code: '88307', name: 'Biopsia Nivel V', description: 'Tejido complejo, resección', pricePrivate: 4500, priceInsurance: 3200 },
        { id: '3', code: '88112', name: 'Citología Líquida', description: 'Papanicolaou en base líquida', pricePrivate: 1200, priceInsurance: 800 },
        { id: '4', code: '88342', name: 'Inmunohistoquímica', description: 'Por anticuerpo', pricePrivate: 3000, priceInsurance: 2200 }
    ]);

    // Persist settings to localStorage whenever they change
    useEffect(() => {
        console.log("Saving settings to localStorage:", settings);
        localStorage.setItem('app_settings', JSON.stringify(settings));
    }, [settings]);

    const addPatient = useCallback((patient) => {
        setPatients(prev => [patient, ...prev]);
    }, []);

    const updatePatient = useCallback((updatedPatient) => {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    }, []);

    const addCase = useCallback((newCase) => {
        setCases(prev => [newCase, ...prev]);
        // Log reception
        const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
        const logEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            role: userRole,
            device: 'Terminal-Recepcion-01',
            action: 'Recepción de Muestra',
            details: `Caso ${newCase.id} creado para el paciente ${newCase.patientName}.`
        };
        setGlobalAuditLog(prev => [logEntry, ...prev]);
    }, [currentUser, roles]);

    const updateCase = useCallback((updatedCase) => {
        setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    }, []);

    const updateCaseStage = useCallback((id, newStage) => {
        setCases(prev => prev.map(c => {
            if (c.id === id) {
                const oldStage = c.stage;
                const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
                const logEntry = {
                    date: new Date().toISOString(),
                    user: currentUser ? currentUser.name : 'Sistema',
                    role: userRole,
                    device: 'Terminal-Lab-01',
                    action: 'Cambio de Etapa',
                    details: `Etapa cambiada de "${oldStage}" a "${newStage}".`
                };
                return {
                    ...c,
                    stage: newStage,
                    auditLogs: [...(c.auditLogs || []), logEntry]
                };
            }
            return c;
        }));
    }, [currentUser, roles]);

    const updateCaseInterconsultation = useCallback((id, interconsultationData) => {
        setCases(prev => prev.map(c => c.id === id ? { ...c, interconsultation: interconsultationData } : c));
    }, []);

    const updateCaseTumorBoard = useCallback((id, tumorBoardData) => {
        setCases(prev => prev.map(c => c.id === id ? { ...c, tumorBoard: tumorBoardData } : c));
    }, []);

    const deleteCase = useCallback((id) => {
        setCases(prev => prev.filter(c => c.id !== id));
        // Log global deletion
        const logEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            action: 'Eliminación de Caso',
            details: `Caso ${id} eliminado permanentemente.`
        };
        setGlobalAuditLog(prev => [logEntry, ...prev]);
    }, [currentUser]);

    const addAuditLog = useCallback((caseId, action, details) => {
        const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
        const logEntry = {
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            role: userRole,
            device: 'Terminal-Lab-01', // Simulated
            action,
            details
        };

        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                return {
                    ...c,
                    auditLogs: [...(c.auditLogs || []), logEntry]
                };
            }
            return c;
        }));
    }, [currentUser, roles]);

    const publishToGlobal = useCallback((caseId, description) => {
        const localCase = cases.find(c => c.id === caseId);
        if (!localCase) return { success: false, message: 'Caso no encontrado' };

        const globalEntry = {
            id: `GL-${Date.now().toString().substr(-4)}`,
            diagnosis: localCase.diagnosis || 'Diagnóstico no especificado',
            organ: localCase.organ,
            institution: settings.labName,
            country: 'República Dominicana', // Default for this lab
            description: description || localCase.clinicalData || 'Sin descripción adicional.',
            imageUrl: localCase.images?.[0]?.url || 'https://via.placeholder.com/640x480?text=Sin+Imagen',
            likes: 0,
            comments: 0,
            date: new Date().toISOString().split('T')[0],
            originalCaseId: localCase.id // For internal reference
        };

        setGlobalCases(prev => [globalEntry, ...prev]);

        // Add audit log to local case
        addAuditLog(caseId, 'Publicación Global', `Caso compartido en la Red Global de Casos Raros.`);

        return { success: true, globalId: globalEntry.id };
    }, [cases, settings.labName, addAuditLog]);

    const dispatchCase = useCallback((caseId, deliveryId) => {
        const localCase = cases.find(c => c.id === caseId);
        const delivery = deliveries.find(d => d.id === deliveryId);

        if (!localCase) {
            const errorMsg = `Intento de despacho fallido: Caso ${caseId} no encontrado.`;
            setGlobalAuditLog(prev => [{
                id: Date.now().toString(),
                date: new Date().toISOString(),
                user: currentUser?.name || 'Sistema',
                action: 'Error de Despacho',
                details: errorMsg
            }, ...prev]);
            return { success: false, message: 'Caso no encontrado.' };
        }

        if (!delivery) {
            const errorMsg = `Intento de despacho fallido: Entrega ${deliveryId} no encontrada.`;
            setGlobalAuditLog(prev => [{
                id: Date.now().toString(),
                date: new Date().toISOString(),
                user: currentUser?.name || 'Sistema',
                action: 'Error de Despacho',
                details: errorMsg
            }, ...prev]);
            return { success: false, message: 'Orden de entrega no encontrada.' };
        }

        // Validate case is part of this delivery
        if (!delivery.caseIds.includes(caseId)) {
            const errorMsg = `Intento de despacho fallido: El caso ${caseId} no pertenece a la entrega ${deliveryId}.`;
            setGlobalAuditLog(prev => [{
                id: Date.now().toString(),
                date: new Date().toISOString(),
                user: currentUser?.name || 'Sistema',
                action: 'Error de Despacho',
                details: errorMsg
            }, ...prev]);
            return { success: false, message: 'El caso no pertenece a esta orden de entrega.' };
        }

        // Validate status
        if (localCase.status !== 'En Reparto') {
            const errorMsg = `Intento de despacho fallido: El caso ${caseId} tiene estado "${localCase.status}" (debe ser "En Reparto").`;
            setGlobalAuditLog(prev => [{
                id: Date.now().toString(),
                date: new Date().toISOString(),
                user: currentUser?.name || 'Sistema',
                action: 'Error de Despacho',
                details: errorMsg
            }, ...prev]);
            return { success: false, message: `Estado inválido para despacho: ${localCase.status}` };
        }

        // Success: Update case status
        const updatedCase = {
            ...localCase,
            status: 'Despachado',
            dispatchedAt: new Date().toISOString(),
            dispatchedBy: currentUser?.id,
            dispatchDevice: 'Terminal-Lab-01' // Simulated
        };

        updateCase(updatedCase);

        // Add to case audit log
        addAuditLog(caseId, 'Despacho Controlado', `Caso despachado exitosamente por ${currentUser?.name}.`);

        // Add to global audit log
        setGlobalAuditLog(prev => [{
            id: Date.now().toString(),
            date: new Date().toISOString(),
            user: currentUser?.name || 'Sistema',
            action: 'Despacho Exitoso',
            details: `Caso ${caseId} despachado con entrega ${deliveryId}.`
        }, ...prev]);

        return { success: true };
    }, [cases, deliveries, currentUser, updateCase, addAuditLog]);



    const updateSettings = useCallback((newSettings) => {
        console.log("Updating settings with:", newSettings);

        // Calculate changes for history
        const changes = [];
        Object.keys(newSettings).forEach(key => {
            // Simple comparison, might need deep compare for objects but settings are mostly primitives
            if (JSON.stringify(settings[key]) !== JSON.stringify(newSettings[key])) {
                changes.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    date: new Date().toISOString(),
                    user: currentUser ? currentUser.name : 'Sistema',
                    key: key,
                    oldValue: settings[key],
                    newValue: newSettings[key]
                });
            }
        });

        if (changes.length > 0) {
            setConfigHistory(prev => [...changes, ...prev]);
        }

        setSettings(prev => ({ ...prev, ...newSettings }));
    }, [settings, currentUser]);
    const testPrinter = useCallback((printerId) => {
        const printer = settings.printerConfig.printers.find(p => p.id === printerId);
        if (!printer) return { success: false, message: 'Impresora no encontrada' };

        console.log(`Testing printer: ${printer.name} (${printer.connection})`);

        // Simulate real communication based on driver
        return new Promise((resolve) => {
            setTimeout(() => {
                if (printer.connection === 'Network' && !printer.address) {
                    resolve({ success: false, message: 'Error: Dirección IP no configurada' });
                } else {
                    let driverMsg = '';
                    switch (printer.driver) {
                        case 'ZPL': driverMsg = 'Comandos ZPL enviados (^XA^FO50,50^A0N,50,50^FDTEST^FS^XZ)'; break;
                        case 'ESC/POS': driverMsg = 'Secuencia ESC/POS enviada (Thermal Test)'; break;
                        case 'PDF': driverMsg = 'Documento PDF generado y enviado'; break;
                        default: driverMsg = 'Texto genérico enviado';
                    }

                    if (printer.connection === 'System') {
                        window.print();
                    }
                    resolve({ success: true, message: `Prueba (${printer.driver}) enviada a ${printer.name}: ${driverMsg}` });
                }
            }, 1500);
        });
    }, [settings.printerConfig.printers]);
    const addInsurer = useCallback((insurer) => {
        setInsurers(prev => [...prev, { ...insurer, id: Date.now().toString() }]);
    }, []);

    const updateInsurer = useCallback((updatedInsurer) => {
        setInsurers(prev => prev.map(i => i.id === updatedInsurer.id ? updatedInsurer : i));
    }, []);

    const deleteInsurer = useCallback((id) => {
        setInsurers(prev => prev.filter(i => i.id !== id));
    }, []);

    const addOrgan = useCallback((organ) => {
        setOrgans(prev => [...prev, { ...organ, id: Date.now().toString() }]);
    }, []);

    const updateOrgan = useCallback((updatedOrgan) => {
        setOrgans(prev => prev.map(o => o.id === updatedOrgan.id ? updatedOrgan : o));
    }, []);

    const deleteOrgan = useCallback((id) => {
        setOrgans(prev => prev.filter(o => o.id !== id));
    }, []);

    const addDoctor = useCallback((doctor) => {
        setDoctors(prev => [...prev, { ...doctor, id: Date.now().toString() }]);
    }, []);

    const updateDoctor = useCallback((updatedDoctor) => {
        setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));
    }, []);

    const deleteDoctor = useCallback((id) => {
        setDoctors(prev => prev.filter(d => d.id !== id));
    }, []);

    const addEquipment = useCallback((item) => {
        setEquipment(prev => [...prev, { ...item, id: Date.now().toString() }]);
    }, []);

    const updateEquipment = useCallback((updatedItem) => {
        setEquipment(prev => prev.map(e => e.id === updatedItem.id ? updatedItem : e));
    }, []);

    const deleteEquipment = useCallback((id) => {
        setEquipment(prev => prev.filter(e => e.id !== id));
    }, []);

    const toggleLisConnection = useCallback(() => {
        if (lisConnection.status === 'Connected') {
            setLisConnection(prev => ({ ...prev, status: 'Disconnected', logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] Desconectado del LIS.`] }));
        } else {
            setLisConnection(prev => ({ ...prev, status: 'Connecting...' }));
            setTimeout(() => {
                setLisConnection(prev => ({
                    status: 'Connected',
                    lastSync: new Date().toISOString(),
                    logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] Conexión establecida con LIS Hospitalario (HL7 v2.5).`]
                }));
            }, 1500);
        }
    }, [lisConnection.status]);

    const simulateLisDataTransfer = useCallback(() => {
        if (lisConnection.status !== 'Connected') return;
        const msgType = Math.random() > 0.5 ? 'ORU^R01 (Resultados)' : 'ORM^O01 (Orden)';
        setLisConnection(prev => ({
            ...prev,
            lastSync: new Date().toISOString(),
            logs: [`[${new Date().toLocaleTimeString()}] Recibido mensaje ${msgType}`, ...prev.logs].slice(0, 20)
        }));
    }, [lisConnection.status]);

    // Security CRUD
    const addRole = useCallback((role) => {
        setRoles(prev => [...prev, { ...role, id: Date.now().toString() }]);
    }, []);

    const updateRole = useCallback((updatedRole) => {
        setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
    }, []);

    const deleteRole = useCallback((id) => {
        setRoles(prev => prev.filter(r => r.id !== id));
    }, []);

    const addUser = useCallback((user) => {
        setUsers(prev => [...prev, { ...user, id: Date.now().toString() }]);
    }, []);

    const updateUser = useCallback((updatedUser) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, []);

    const deleteUser = useCallback((id) => {
        setUsers(prev => prev.filter(u => u.id !== id));
    }, []);

    // Exams/Tariffs CRUD
    const addExam = useCallback((exam) => {
        setExams(prev => [...prev, { ...exam, id: Date.now().toString() }]);
    }, []);

    const updateExam = useCallback((updatedExam) => {
        setExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));
    }, []);

    const deleteExam = useCallback((id) => {
        setExams(prev => prev.filter(e => e.id !== id));
    }, []);

    // --- IMAGE MANAGEMENT ---
    const addImage = useCallback((caseId, imageData) => {
        const newImage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            uploadedBy: currentUser?.id || 'unknown',
            uploadedAt: new Date().toISOString(),
            annotations: [],
            usedInReport: false,
            reportSection: null,
            tags: [],
            ...imageData
        };

        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = c.images || [];
                return { ...c, images: [...images, newImage] };
            }
            return c;
        }));

        return newImage;
    }, [currentUser]);

    const updateImage = useCallback((caseId, imageId, updates) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = (c.images || []).map(img =>
                    img.id === imageId ? { ...img, ...updates } : img
                );
                return { ...c, images };
            }
            return c;
        }));
    }, []);

    const deleteImage = useCallback((caseId, imageId) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = (c.images || []).filter(img => img.id !== imageId);
                return { ...c, images };
            }
            return c;
        }));
    }, []);

    const addAnnotation = useCallback((caseId, imageId, annotationData) => {
        const newAnnotation = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdBy: currentUser?.id || 'unknown',
            createdAt: new Date().toISOString(),
            ...annotationData
        };

        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = (c.images || []).map(img => {
                    if (img.id === imageId) {
                        const annotations = img.annotations || [];
                        return { ...img, annotations: [...annotations, newAnnotation] };
                    }
                    return img;
                });
                return { ...c, images };
            }
            return c;
        }));

        return newAnnotation;
    }, [currentUser]);

    const updateAnnotation = useCallback((caseId, imageId, annotationId, updates) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = (c.images || []).map(img => {
                    if (img.id === imageId) {
                        const annotations = (img.annotations || []).map(ann =>
                            ann.id === annotationId ? { ...ann, ...updates } : ann
                        );
                        return { ...img, annotations };
                    }
                    return img;
                });
                return { ...c, images };
            }
            return c;
        }));
    }, []);

    const deleteAnnotation = useCallback((caseId, imageId, annotationId) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = (c.images || []).map(img => {
                    if (img.id === imageId) {
                        const annotations = (img.annotations || []).filter(ann => ann.id !== annotationId);
                        return { ...img, annotations };
                    }
                    return img;
                });
                return { ...c, images };
            }
            return c;
        }));
    }, []);

    const toggleImageInReport = useCallback((caseId, imageId, section) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = (c.images || []).map(img => {
                    if (img.id === imageId) {
                        const usedInReport = !img.usedInReport;
                        return { ...img, usedInReport, reportSection: usedInReport ? section : null };
                    }
                    return img;
                });
                return { ...c, images };
            }
            return c;
        }));
    }, []);

    const bulkUpdateImages = useCallback((caseId, imageIds, updates) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = (c.images || []).map(img =>
                    imageIds.includes(img.id) ? { ...img, ...updates } : img
                );
                return { ...c, images };
            }
            return c;
        }));
    }, []);

    const bulkDeleteImages = useCallback((caseId, imageIds) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                const images = (c.images || []).filter(img => !imageIds.includes(img.id));
                return { ...c, images };
            }
            return c;
        }));
    }, []);

    const getCase = useCallback((id) => {
        const localCase = cases.find(c => c.id === id);
        if (localCase) return localCase;

        const globalCase = globalCases.find(c => c.id === id);
        if (globalCase) {
            // Adapt global case to match local case structure for ReportView
            return {
                ...globalCase,
                patientName: 'Paciente Anonimizado (Global)',
                patientId: 'N/A',
                age: 'N/A',
                sex: 'N/A',
                type: 'Consulta Global',
                status: 'Publicado',
                createdAt: globalCase.date,
                clinicalData: globalCase.description,
                macroscopy: 'No disponible',
                microscopy: 'Ver descripción del caso',
                images: [{ url: globalCase.imageUrl, name: 'Imagen Principal' }]
            };
        }
        return null;
    }, [cases, globalCases]);

    const addDelivery = (delivery) => {
        setDeliveries(prev => [delivery, ...prev]);
        // Log assignment
        const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
        const logEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            role: userRole,
            device: 'Terminal-Logistica-01',
            action: 'Asignación de Reparto',
            details: `Entrega ${delivery.id} asignada a ${delivery.courierName} con ${delivery.caseIds.length} casos.`
        };
        setGlobalAuditLog(prev => [logEntry, ...prev]);
    };

    const value = React.useMemo(() => ({
        patients, cases, setCases, settings, configHistory, insurers, organs, doctors, originCenters, users, roles, deliveries,
        globalAuditLog, globalCases,
        addPatient, updatePatient, addCase, updateCase, deleteCase, updateSettings, getCase, updateCaseStage, updateCaseInterconsultation, updateCaseTumorBoard,
        addAuditLog, publishToGlobal, dispatchCase,
        testPrinter,
        addInsurer, updateInsurer, deleteInsurer,
        addOrgan, updateOrgan, deleteOrgan,
        login, logout, currentUser,
        addDelivery,
        addDoctor, updateDoctor, deleteDoctor,
        equipment, addEquipment, updateEquipment, deleteEquipment,
        lisConnection, toggleLisConnection, simulateLisDataTransfer,
        roles, users, addRole, updateRole, deleteRole, addUser, updateUser, deleteUser,
        exams, addExam, updateExam, deleteExam,
        currentUser, setCurrentUser, login, logout,
        // Image management
        addImage, updateImage, deleteImage,
        addAnnotation, updateAnnotation, deleteAnnotation,
        toggleImageInReport, bulkUpdateImages, bulkDeleteImages
    }), [
        patients, cases, setCases, settings, insurers, organs, doctors, deliveries, globalAuditLog, globalCases,
        addPatient, updatePatient, addCase, updateCase, deleteCase, updateSettings, getCase, updateCaseStage, updateCaseInterconsultation, updateCaseTumorBoard,
        addAuditLog, publishToGlobal, dispatchCase,
        testPrinter,
        addInsurer, updateInsurer, deleteInsurer,
        addOrgan, updateOrgan, deleteOrgan,
        addDoctor, updateDoctor, deleteDoctor,
        equipment, addEquipment, updateEquipment, deleteEquipment,
        lisConnection, toggleLisConnection, simulateLisDataTransfer,
        roles, users, addRole, updateRole, deleteRole, addUser, updateUser, deleteUser,
        exams, addExam, updateExam, deleteExam,
        currentUser, login, logout, addDelivery,
        addImage, updateImage, deleteImage,
        addAnnotation, updateAnnotation, deleteAnnotation,
        toggleImageInReport, bulkUpdateImages, bulkDeleteImages
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
