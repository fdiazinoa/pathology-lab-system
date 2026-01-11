import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientManager from './pages/PatientManager';
import CaseManager from './pages/CaseManager';
import ReportView from './pages/ReportView';
import MicroscopyModule from './pages/MicroscopyModule';
import MacroscopyModule from './pages/MacroscopyModule';
import IHCModule from './pages/IHCModule';
import ImagesModule from './pages/ImagesModule';
import SettingsPage from './pages/Settings';
import UsersManager from './pages/UsersManager';
import RolesManager from './pages/RolesManager';
import TariffsManager from './pages/TariffsManager';
import DoctorsManager from './pages/DoctorsManager';
import TumorBoardManager from './pages/TumorBoardManager';
import TumorBoardSession from './pages/TumorBoardSession';
import EpidemiologyAnalytics from './pages/EpidemiologyAnalytics';
import LaboratoryPerformance from './pages/LaboratoryPerformance';
import GlobalCaseNetwork from './pages/GlobalCaseNetwork';
import CaseMap from './pages/CaseMap';
import InsurersManager from './pages/InsurersManager';
import CentersManager from './pages/CentersManager';
import OrgansManager from './pages/OrgansManager';
import EquipmentManager from './pages/EquipmentManager';
import SampleReception from './pages/SampleReception';
import DeliveryManager from './pages/DeliveryManager';
import MyDeliveries from './pages/MyDeliveries';
import DispatchModule from './pages/DispatchModule';
import AuditLog from './pages/AuditLog';
import UsageDashboard from './pages/UsageDashboard';
import Help from './pages/Help';
import { DataProvider, useData } from './services/DataContext';
import { AIConfigProvider } from './ai/AIConfigContext';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionWizard from './pages/ConnectionWizard';
import { SetupProvider } from './context/SetupContext';
import SetupLayout from './pages/setup/SetupLayout';
import Welcome from './pages/setup/steps/Welcome';
import ModeSelection from './pages/setup/steps/ModeSelection';
import DatabaseConfig from './pages/setup/steps/DatabaseConfig';
import AIConfig from './pages/setup/steps/AIConfig';
import BackupConfig from './pages/setup/steps/BackupConfig';
import Summary from './pages/setup/steps/Summary';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { currentUser } = useData();
    const isSetupCompleted = localStorage.getItem('setupCompleted') === 'true';

    if (!isSetupCompleted) {
        return <Navigate to="/setup/welcome" replace />;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Check role permission
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.roleId)) {
        // Redirect to dashboard if authorized, or login if not
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Setup Wizard Routes */}
            <Route path="/setup" element={
                <SetupProvider>
                    <SetupLayout />
                </SetupProvider>
            }>
                <Route index element={<Navigate to="welcome" replace />} />
                <Route path="welcome" element={<Welcome />} />
                <Route path="mode" element={<ModeSelection />} />
                <Route path="database" element={<DatabaseConfig />} />
                <Route path="ai" element={<AIConfig />} />
                <Route path="backups" element={<BackupConfig />} />
                <Route path="summary" element={<Summary />} />
            </Route>

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/patients" element={
                <ProtectedRoute allowedRoles={['1', '2', '3']}>
                    <Layout>
                        <PatientManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/reception" element={
                <ProtectedRoute allowedRoles={['1', '3']}>
                    <Layout>
                        <SampleReception />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/logistics" element={
                <ProtectedRoute allowedRoles={['1', '4']}>
                    <Layout>
                        <DeliveryManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/my-deliveries" element={
                <ProtectedRoute allowedRoles={['1', '4']}>
                    <Layout>
                        <MyDeliveries />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/dispatch" element={
                <ProtectedRoute allowedRoles={['1', '4']}>
                    <Layout>
                        <DispatchModule />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/cases/new" element={
                <ProtectedRoute allowedRoles={['1', '2', '3']}>
                    <Layout>
                        <CaseManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/cases/:id" element={
                <ProtectedRoute allowedRoles={['1', '2', '3']}>
                    <Layout>
                        <ReportView />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/cases/:id/edit" element={
                <ProtectedRoute allowedRoles={['1', '2', '3']}>
                    <Layout>
                        <CaseManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/cases/:id/microscopy" element={
                <ProtectedRoute>
                    <MicroscopyModule />
                </ProtectedRoute>
            } />
            <Route path="/cases/:id/macroscopy" element={
                <ProtectedRoute>
                    <MacroscopyModule />
                </ProtectedRoute>
            } />
            <Route path="/cases/:id/immunohistochemistry" element={
                <ProtectedRoute>
                    <IHCModule />
                </ProtectedRoute>
            } />
            <Route path="/cases/:id/images" element={
                <ProtectedRoute>
                    <ImagesModule />
                </ProtectedRoute>
            } />


            <Route path="/usage-dashboard" element={
                <ProtectedRoute allowedRoles={['1']}>
                    <Layout>
                        <UsageDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/help" element={
                <ProtectedRoute>
                    <Layout>
                        <Help />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <SettingsPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/settings/connection-wizard" element={
                <ProtectedRoute allowedRoles={['1']}>
                    <Layout>
                        <ConnectionWizard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/users" element={
                <ProtectedRoute allowedRoles={['1']}>
                    <Layout>
                        <UsersManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/roles" element={
                <ProtectedRoute allowedRoles={['1']}>
                    <Layout>
                        <RolesManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/tariffs" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <TariffsManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/doctors" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <DoctorsManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/tumor-board" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <TumorBoardManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/tumor-board/:id" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <TumorBoardSession />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={['1']}>
                    <Layout>
                        <EpidemiologyAnalytics />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/performance" element={
                <ProtectedRoute allowedRoles={['1']}>
                    <Layout>
                        <LaboratoryPerformance />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/global-network" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <GlobalCaseNetwork />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/case-map" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <CaseMap />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/insurers" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <InsurersManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/centers" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <CentersManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/organs" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <OrgansManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/equipment" element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                    <Layout>
                        <EquipmentManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/audit-log" element={
                <ProtectedRoute allowedRoles={['1']}>
                    <Layout>
                        <AuditLog />
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
};

function App() {
    return (
        <ErrorBoundary>
            <AIConfigProvider>
                <DataProvider>
                    <Router>
                        <AppRoutes />
                    </Router>
                </DataProvider>
            </AIConfigProvider>
        </ErrorBoundary>
    );
}

export default App;
