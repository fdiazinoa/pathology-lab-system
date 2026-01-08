import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import DemoDataProvider from './providers/DemoDataProvider';
import ProductionDataProvider from './providers/ProductionDataProvider';
import BackupService from './BackupService';
import TelemetryService from './TelemetryService';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    // --- Provider Initialization ---
    const [dataProvider, setDataProvider] = useState(null);
    const [backupService, setBackupService] = useState(null);
    const [telemetryService, setTelemetryService] = useState(null);
    const [isProductionMode, setIsProductionMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Determine mode (could be from env or local storage config)
        const savedMode = localStorage.getItem('app_system_mode') || 'DEMO';
        const mode = savedMode;

        let provider;
        console.log("Initializing DataProvider. Mode:", mode);
        if (mode === 'PROD') {
            provider = new ProductionDataProvider();
            setIsProductionMode(true);
        } else {
            provider = new DemoDataProvider();
            setIsProductionMode(false);
        }
        console.log("Provider instance created:", provider.constructor.name);
        setDataProvider(provider);
        const bService = new BackupService(provider);
        setBackupService(bService);
        const tService = new TelemetryService(provider);
        setTelemetryService(tService);

        // Trigger auto backup if needed
        bService.triggerAutoBackupIfNeeded().catch(err => console.error("Auto backup failed", err));
    }, []);

    // --- State Management (Cache/UI State) ---
    const [currentUser, setCurrentUser] = useState(null);
    const [patients, setPatients] = useState([]);
    const [cases, setCases] = useState([]);
    const [globalCases, setGlobalCases] = useState([]);
    const [globalAuditLog, setGlobalAuditLog] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [settings, setSettings] = useState({});
    const [configHistory, setConfigHistory] = useState([]);
    const [connectionConfig, setConnectionConfig] = useState(null);

    // Catalogs
    const [insurers, setInsurers] = useState([]);
    const [organs, setOrgans] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [exams, setExams] = useState([]);
    const [centers, setCenters] = useState([]);

    // Temporary/UI-only state
    const [lisConnection, setLisConnection] = useState({ status: 'Disconnected', lastSync: null, logs: [] });

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        if (!dataProvider) return;
        setLoading(true);
        try {
            const [
                loadedUser, loadedPatients, loadedCases, loadedGlobalCases, loadedAudit,
                loadedDeliveries, loadedSettings, loadedHistory, loadedConfig,
                loadedInsurers, loadedOrgans, loadedDoctors, loadedEquipment, loadedRoles, loadedUsers, loadedExams, loadedCenters
            ] = await Promise.all([
                dataProvider.getCurrentUser(),
                dataProvider.getPatients(),
                dataProvider.getCases(),
                dataProvider.getGlobalCases(),
                dataProvider.getGlobalAuditLog(),
                dataProvider.getDeliveries(),
                dataProvider.getSettings(),
                dataProvider.getConfigHistory(),
                dataProvider.getConnectionConfig(),
                dataProvider.getInsurers(),
                dataProvider.getOrgans(),
                dataProvider.getDoctors(),
                dataProvider.getEquipment(),
                dataProvider.getRoles(),
                dataProvider.getUsers(),
                dataProvider.getExams(),
                dataProvider.getCenters()
            ]);

            setCurrentUser(loadedUser);
            setPatients(loadedPatients);
            setCases(loadedCases);
            setGlobalCases(loadedGlobalCases);
            setGlobalAuditLog(loadedAudit);
            setDeliveries(loadedDeliveries);
            setSettings(loadedSettings);
            setConfigHistory(loadedHistory);
            setConnectionConfig(loadedConfig);
            setInsurers(loadedInsurers);
            setOrgans(loadedOrgans);
            setDoctors(loadedDoctors);
            setEquipment(loadedEquipment);
            setRoles(loadedRoles);
            setUsers(loadedUsers);
            setExams(loadedExams);
            setCenters(loadedCenters);

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const switchSystemMode = useCallback(async (newMode) => {
        if (!dataProvider) return;

        const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
        const logEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            role: userRole,
            device: 'Terminal-Admin',
            action: 'Cambio de Modo de Sistema',
            details: `Cambio solicitado de ${isProductionMode ? 'PROD' : 'DEMO'} a ${newMode}.`
        };

        try {
            await dataProvider.addAuditLog(logEntry);
        } catch (e) {
            console.warn("Could not log mode switch to current provider", e);
        }

        localStorage.setItem('app_system_mode', newMode);
        window.location.reload();
    }, [dataProvider, currentUser, roles, isProductionMode]);

    // --- Actions ---

    const login = useCallback(async (email, password) => {
        if (!dataProvider) return { success: false, message: 'Provider not ready' };
        const result = await dataProvider.login(email, password);
        if (result.success) setCurrentUser(result.user);
        return result;
    }, [dataProvider]);

    const loginWithGoogle = useCallback(async (credentialResponse) => {
        if (!dataProvider) return { success: false, message: 'Provider not ready' };
        const result = await dataProvider.loginWithGoogle(credentialResponse);
        if (result.success) setCurrentUser(result.user);
        return result;
    }, [dataProvider]);

    const loginWithGoogleProfile = useCallback(async (profile) => {
        console.warn("loginWithGoogleProfile not fully implemented in provider yet.");
        return { success: false, message: "Not implemented" };
    }, [dataProvider]);

    const runMigration = useCallback(async (options) => {
        if (!dataProvider || !isProductionMode) {
            return { success: false, message: 'La migración solo está disponible en Modo Producción.' };
        }

        const { default: MigrationService } = await import('./MigrationService');
        const migrationService = new MigrationService(dataProvider);

        try {
            const report = await migrationService.migrateData(options);

            const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
            await dataProvider.addAuditLog({
                id: Date.now().toString(),
                date: new Date().toISOString(),
                user: currentUser ? currentUser.name : 'Sistema',
                role: userRole,
                device: 'Terminal-Admin',
                action: 'Migración de Datos',
                details: `Migración ejecutada. Resultados: ${JSON.stringify(report.stats)}`
            });

            await loadData();
            return report;
        } catch (e) {
            console.error("Migration failed", e);
            return { success: false, message: e.message, errors: [e.message] };
        }
    }, [dataProvider, isProductionMode, currentUser, roles, loadData]);

    const logout = useCallback(async () => {
        if (!dataProvider) return;
        await dataProvider.logout();
        setCurrentUser(null);
    }, [dataProvider]);

    const addPatient = useCallback(async (patient) => {
        if (!dataProvider) return;
        const result = await dataProvider.addPatient(patient);
        setPatients(prev => [result, ...prev]);
    }, [dataProvider]);

    const updatePatient = useCallback(async (patient) => {
        if (!dataProvider) return;
        const result = await dataProvider.updatePatient(patient);
        setPatients(prev => prev.map(p => p.id === result.id ? result : p));
    }, [dataProvider]);

    const addCase = useCallback(async (newCase) => {
        if (!dataProvider) return;
        const result = await dataProvider.addCase(newCase);
        setCases(prev => [result, ...prev]);

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
        await addAuditLog(newCase.id, logEntry.action, logEntry.details);
    }, [dataProvider, currentUser, roles]);

    const updateCase = useCallback(async (updatedCase) => {
        if (!dataProvider) return;
        const result = await dataProvider.updateCase(updatedCase);
        setCases(prev => prev.map(c => c.id === result.id ? result : c));
    }, [dataProvider]);

    const deleteCase = useCallback(async (id) => {
        if (!dataProvider) return;
        await dataProvider.deleteCase(id);
        setCases(prev => prev.filter(c => c.id !== id));
        const logEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            action: 'Eliminación de Caso',
            details: `Caso ${id} eliminado permanentemente.`
        };
        await dataProvider.addAuditLog(logEntry);
        setGlobalAuditLog(prev => [logEntry, ...prev]);
    }, [dataProvider, currentUser]);

    const addAuditLog = useCallback(async (caseId, action, details) => {
        if (!dataProvider) return;
        const currentCase = cases.find(c => c.id === caseId);
        if (!currentCase) return;

        const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
        const logEntry = {
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            role: userRole,
            device: 'Terminal-Lab-01',
            action,
            details
        };

        const updatedCase = {
            ...currentCase,
            auditLogs: [...(currentCase.auditLogs || []), logEntry]
        };

        await updateCase(updatedCase);
    }, [cases, currentUser, roles, updateCase]);

    const updateCaseStage = useCallback(async (id, newStage) => {
        const currentCase = cases.find(c => c.id === id);
        if (!currentCase) return;
        const oldStage = currentCase.stage;
        const updatedCase = { ...currentCase, stage: newStage };
        await updateCase(updatedCase);
        await addAuditLog(id, 'Cambio de Etapa', `Etapa cambiada de "${oldStage}" a "${newStage}".`);
    }, [cases, updateCase, addAuditLog]);

    const updateCaseInterconsultation = useCallback(async (id, data) => {
        const currentCase = cases.find(c => c.id === id);
        if (!currentCase) return;
        await updateCase({ ...currentCase, interconsultation: data });
    }, [cases, updateCase]);

    const updateCaseTumorBoard = useCallback(async (id, data) => {
        const currentCase = cases.find(c => c.id === id);
        if (!currentCase) return;
        await updateCase({ ...currentCase, tumorBoard: data });
    }, [cases, updateCase]);

    const publishToGlobal = useCallback(async (caseId, description) => {
        if (!dataProvider) return { success: false };
        const result = await dataProvider.publishToGlobal(caseId, description);
        if (result.success) {
            const globals = await dataProvider.getGlobalCases();
            setGlobalCases(globals);
            await addAuditLog(caseId, 'Publicación Global', `Caso compartido en la Red Global.`);
        }
        return result;
    }, [dataProvider, addAuditLog]);

    const updateSettings = useCallback(async (newSettings) => {
        if (!dataProvider) return;

        const changes = [];
        Object.keys(newSettings).forEach(key => {
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

        const updated = await dataProvider.updateSettings(newSettings);
        setSettings(updated);

        if (changes.length > 0) {
            setConfigHistory(prev => [...changes, ...prev]);
        }
    }, [dataProvider, settings, currentUser]);

    const saveConnectionConfig = useCallback(async (config) => {
        if (!dataProvider) return;
        const saved = await dataProvider.saveConnectionConfig(config);
        setConnectionConfig(saved);
    }, [dataProvider]);

    const addDelivery = useCallback(async (d) => { if (dataProvider) { await dataProvider.addDelivery(d); setDeliveries(prev => [d, ...prev]); } }, [dataProvider]);

    const addInsurer = useCallback(async (i) => { if (dataProvider) { await dataProvider.addInsurer(i); setInsurers(prev => [...prev, i]); } }, [dataProvider]);
    const updateInsurer = useCallback(async (i) => { if (dataProvider) { await dataProvider.updateInsurer(i); setInsurers(prev => prev.map(x => x.id === i.id ? i : x)); } }, [dataProvider]);
    const deleteInsurer = useCallback(async (id) => { if (dataProvider) { await dataProvider.deleteInsurer(id); setInsurers(prev => prev.filter(x => x.id !== id)); } }, [dataProvider]);

    const addOrgan = useCallback(async (o) => { if (dataProvider) { await dataProvider.addOrgan(o); setOrgans(prev => [...prev, o]); } }, [dataProvider]);
    const updateOrgan = useCallback(async (o) => { if (dataProvider) { await dataProvider.updateOrgan(o); setOrgans(prev => prev.map(x => x.id === o.id ? o : x)); } }, [dataProvider]);
    const deleteOrgan = useCallback(async (id) => { if (dataProvider) { await dataProvider.deleteOrgan(id); setOrgans(prev => prev.filter(x => x.id !== id)); } }, [dataProvider]);

    const addDoctor = useCallback(async (d) => { if (dataProvider) { await dataProvider.addDoctor(d); setDoctors(prev => [...prev, d]); } }, [dataProvider]);
    const updateDoctor = useCallback(async (d) => { if (dataProvider) { await dataProvider.updateDoctor(d); setDoctors(prev => prev.map(x => x.id === d.id ? d : x)); } }, [dataProvider]);
    const deleteDoctor = useCallback(async (id) => { if (dataProvider) { await dataProvider.deleteDoctor(id); setDoctors(prev => prev.filter(x => x.id !== id)); } }, [dataProvider]);

    const addEquipment = useCallback(async (e) => { if (dataProvider) { await dataProvider.addEquipment(e); setEquipment(prev => [...prev, e]); } }, [dataProvider]);
    const updateEquipment = useCallback(async (e) => { if (dataProvider) { await dataProvider.updateEquipment(e); setEquipment(prev => prev.map(x => x.id === e.id ? e : x)); } }, [dataProvider]);
    const deleteEquipment = useCallback(async (id) => { if (dataProvider) { await dataProvider.deleteEquipment(id); setEquipment(prev => prev.filter(x => x.id !== id)); } }, [dataProvider]);

    const addExam = useCallback(async (e) => { if (dataProvider) { await dataProvider.addExam(e); setExams(prev => [...prev, e]); } }, [dataProvider]);
    const updateExam = useCallback(async (e) => { if (dataProvider) { await dataProvider.updateExam(e); setExams(prev => prev.map(x => x.id === e.id ? e : x)); } }, [dataProvider]);
    const deleteExam = useCallback(async (id) => { if (dataProvider) { await dataProvider.deleteExam(id); setExams(prev => prev.filter(x => x.id !== id)); } }, [dataProvider]);

    // --- Centers Actions ---
    const addCenter = useCallback(async (center) => {
        console.log("DataContext: addCenter called", center);
        if (!dataProvider) {
            console.error("DataContext: dataProvider is null");
            return;
        }
        console.log("DataContext: using provider", dataProvider.constructor.name);
        if (typeof dataProvider.addCenter !== 'function') {
            console.error("DataContext: provider does not have addCenter method", dataProvider);
            throw new Error("Provider missing addCenter method");
        }
        const newCenter = await dataProvider.addCenter(center);
        setCenters(prev => [...prev, newCenter]);
        return newCenter;
    }, [dataProvider]);

    const updateCenter = useCallback(async (id, updates) => {
        if (!dataProvider) return;
        const updated = await dataProvider.updateCenter(id, updates);
        if (updated) {
            setCenters(prev => prev.map(c => c.id === id ? updated : c));
        }
    }, [dataProvider]);

    const deleteCenter = useCallback(async (id) => {
        if (!dataProvider) return;
        await dataProvider.deleteCenter(id);
        setCenters(prev => prev.filter(c => c.id !== id));
    }, [dataProvider]);

    const addRole = useCallback(async (r) => { if (dataProvider) { await dataProvider.addRole(r); setRoles(prev => [...prev, r]); } }, [dataProvider]);
    const updateRole = useCallback(async (r) => { if (dataProvider) { await dataProvider.updateRole(r); setRoles(prev => prev.map(x => x.id === r.id ? r : x)); } }, [dataProvider]);
    const deleteRole = useCallback(async (id) => { if (dataProvider) { await dataProvider.deleteRole(id); setRoles(prev => prev.filter(x => x.id !== id)); } }, [dataProvider]);

    const addUser = useCallback(async (u) => { if (dataProvider) { await dataProvider.addUser(u); setUsers(prev => [...prev, u]); } }, [dataProvider]);
    const updateUser = useCallback(async (u) => { if (dataProvider) { await dataProvider.updateUser(u); setUsers(prev => prev.map(x => x.id === u.id ? u : x)); } }, [dataProvider]);
    const deleteUser = useCallback(async (id) => { if (dataProvider) { await dataProvider.deleteUser(id); setUsers(prev => prev.filter(x => x.id !== id)); } }, [dataProvider]);

    const addImage = useCallback(async (caseId, imageData) => {
        const currentCase = cases.find(c => c.id === caseId);
        if (!currentCase) return;
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
        const updatedCase = { ...currentCase, images: [...(currentCase.images || []), newImage] };
        await updateCase(updatedCase);
        return newImage;
    }, [cases, currentUser, updateCase]);

    const updateImage = useCallback(async (caseId, imageId, updates) => {
        const currentCase = cases.find(c => c.id === caseId);
        if (!currentCase) return;
        const images = (currentCase.images || []).map(img => img.id === imageId ? { ...img, ...updates } : img);
        await updateCase({ ...currentCase, images });
    }, [cases, updateCase]);

    const deleteImage = useCallback(async (caseId, imageId) => {
        const currentCase = cases.find(c => c.id === caseId);
        if (!currentCase) return;
        const images = (currentCase.images || []).filter(img => img.id !== imageId);
        await updateCase({ ...currentCase, images });
    }, [cases, updateCase]);

    const testPrinter = useCallback(async (printerId) => {
        return { success: true, message: 'Simulated Print' };
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

    const dispatchCase = useCallback(async (caseId, deliveryId) => {
        const currentCase = cases.find(c => c.id === caseId);
        if (!currentCase) return { success: false, message: 'Case not found' };

        const updatedCase = {
            ...currentCase,
            status: 'Despachado',
            dispatchedAt: new Date().toISOString(),
            dispatchedBy: currentUser?.id,
            dispatchDevice: 'Terminal-Lab-01'
        };
        await updateCase(updatedCase);
        await addAuditLog(caseId, 'Despacho Controlado', `Caso despachado exitosamente.`);
        return { success: true };
    }, [cases, currentUser, updateCase, addAuditLog]);

    const resetDemoData = useCallback(() => {
        if (isProductionMode) return;
        const mode = localStorage.getItem('app_system_mode');
        localStorage.clear();
        if (mode) localStorage.setItem('app_system_mode', mode);
        window.location.reload();
    }, [isProductionMode]);

    // --- Backup Actions ---
    const createBackup = useCallback(async (type) => {
        if (!backupService) return;
        const result = await backupService.createBackup(type);

        const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
        await dataProvider.addAuditLog({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            user: currentUser ? currentUser.name : 'Sistema',
            role: userRole,
            device: 'Terminal-Admin',
            action: 'Respaldo de Sistema',
            details: `Backup ${type} realizado exitosamente.`
        });

        return result;
    }, [backupService, dataProvider, currentUser, roles]);

    const restoreBackup = useCallback(async (backupData) => {
        if (!backupService) return;
        const result = await backupService.restoreBackup(backupData);
        if (result) {
            const userRole = roles.find(r => r.id === currentUser?.roleId)?.name || 'Sistema';
            await dataProvider.addAuditLog({
                id: Date.now().toString(),
                date: new Date().toISOString(),
                user: currentUser ? currentUser.name : 'Sistema',
                role: userRole,
                device: 'Terminal-Admin',
                action: 'Restauración de Sistema',
                details: `Sistema restaurado desde backup del ${backupData.timestamp}.`
            });
            await loadData();
        }
        return result;
    }, [backupService, dataProvider, currentUser, roles, loadData]);

    const getBackupHistory = useCallback(() => {
        return backupService ? backupService.getHistory() : [];
    }, [backupService]);

    const downloadBackup = useCallback((data) => {
        if (backupService) backupService.downloadBackup(data);
    }, [backupService]);

    // --- Telemetry Actions ---
    const logUsageEvent = useCallback((module, action, metadata) => {
        if (telemetryService) telemetryService.logEvent(module, action, metadata);
    }, [telemetryService]);

    const getUsageStats = useCallback((days) => {
        return telemetryService ? telemetryService.getStats(days) : { totalEvents: 0, byModule: {}, byAction: {}, trends: {} };
    }, [telemetryService]);

    const value = useMemo(() => ({
        loading,
        isProductionMode,
        switchSystemMode,
        resetDemoData,
        runMigration,
        currentUser, setCurrentUser, login, loginWithGoogle, loginWithGoogleProfile, logout,
        patients, addPatient, updatePatient,
        cases, setCases, getCase: (id) => cases.find(c => c.id === id), addCase, updateCase, deleteCase,
        updateCaseStage, updateCaseInterconsultation, updateCaseTumorBoard,
        globalCases, publishToGlobal,
        globalAuditLog, addAuditLog,
        settings, updateSettings, configHistory,
        connectionConfig, saveConnectionConfig,
        deliveries, addDelivery, dispatchCase,
        insurers, addInsurer, updateInsurer, deleteInsurer,
        organs, addOrgan, updateOrgan, deleteOrgan,
        doctors, addDoctor, updateDoctor, deleteDoctor,
        equipment, addEquipment, updateEquipment, deleteEquipment,
        exams, addExam, updateExam, deleteExam,
        centers, addCenter, updateCenter, deleteCenter,
        roles, addRole, updateRole, deleteRole,
        users, addUser, updateUser, deleteUser,
        lisConnection, toggleLisConnection, simulateLisDataTransfer,
        testPrinter,
        addImage, updateImage, deleteImage,
        createBackup, restoreBackup, getBackupHistory, downloadBackup,
        logUsageEvent, getUsageStats
    }), [
        loading, isProductionMode, switchSystemMode, resetDemoData, runMigration, currentUser, login, loginWithGoogle, loginWithGoogleProfile, logout,
        patients, addPatient, updatePatient,
        cases, addCase, updateCase, deleteCase, updateCaseStage, updateCaseInterconsultation, updateCaseTumorBoard,
        globalCases, publishToGlobal,
        globalAuditLog, addAuditLog,
        settings, updateSettings, configHistory,
        connectionConfig, saveConnectionConfig,
        deliveries, addDelivery, dispatchCase,
        insurers, addInsurer, updateInsurer, deleteInsurer,
        organs, addOrgan, updateOrgan, deleteOrgan,
        doctors, addDoctor, updateDoctor, deleteDoctor,
        equipment, addEquipment, updateEquipment, deleteEquipment,
        exams, addExam, updateExam, deleteExam,
        centers, addCenter, updateCenter, deleteCenter,
        roles, addRole, updateRole, deleteRole,
        users, addUser, updateUser, deleteUser,
        lisConnection, toggleLisConnection, simulateLisDataTransfer,
        testPrinter,
        addImage, updateImage, deleteImage,
        createBackup, restoreBackup, getBackupHistory, downloadBackup,
        logUsageEvent, getUsageStats
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
