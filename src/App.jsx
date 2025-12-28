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
import OrgansManager from './pages/OrgansManager';
import EquipmentManager from './pages/EquipmentManager';
import SampleReception from './pages/SampleReception';
import DeliveryManager from './pages/DeliveryManager';
import MyDeliveries from './pages/MyDeliveries';
import DispatchModule from './pages/DispatchModule';
import AuditLog from './pages/AuditLog';
import { DataProvider, useData } from './services/DataContext';
import ErrorBoundary from './components/ErrorBoundary';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { currentUser } = useData();
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

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
                <ProtectedRoute>
                    <Layout>
                        <PatientManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/reception" element={
                <ProtectedRoute>
                    <Layout>
                        <SampleReception />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/logistics" element={
                <ProtectedRoute>
                    <Layout>
                        <DeliveryManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/my-deliveries" element={
                <ProtectedRoute>
                    <Layout>
                        <MyDeliveries />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/dispatch" element={
                <ProtectedRoute>
                    <Layout>
                        <DispatchModule />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/cases/new" element={
                <ProtectedRoute>
                    <Layout>
                        <CaseManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/cases/:id" element={
                <ProtectedRoute>
                    <Layout>
                        <ReportView />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/cases/:id/edit" element={
                <ProtectedRoute>
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

            <Route path="/settings" element={
                <ProtectedRoute>
                    <Layout>
                        <SettingsPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/users" element={
                <ProtectedRoute>
                    <Layout>
                        <UsersManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/roles" element={
                <ProtectedRoute>
                    <Layout>
                        <RolesManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/tariffs" element={
                <ProtectedRoute>
                    <Layout>
                        <TariffsManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/doctors" element={
                <ProtectedRoute>
                    <Layout>
                        <DoctorsManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/tumor-board" element={
                <ProtectedRoute>
                    <Layout>
                        <TumorBoardManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/tumor-board/:id" element={
                <ProtectedRoute>
                    <Layout>
                        <TumorBoardSession />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/analytics" element={
                <ProtectedRoute>
                    <Layout>
                        <EpidemiologyAnalytics />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/performance" element={
                <ProtectedRoute>
                    <Layout>
                        <LaboratoryPerformance />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/global-network" element={
                <ProtectedRoute>
                    <Layout>
                        <GlobalCaseNetwork />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/case-map" element={
                <ProtectedRoute>
                    <Layout>
                        <CaseMap />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/insurers" element={
                <ProtectedRoute>
                    <Layout>
                        <InsurersManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/organs" element={
                <ProtectedRoute>
                    <Layout>
                        <OrgansManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/equipment" element={
                <ProtectedRoute>
                    <Layout>
                        <EquipmentManager />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/audit-log" element={
                <ProtectedRoute>
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
            <DataProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </DataProvider>
        </ErrorBoundary>
    );
}

export default App;
