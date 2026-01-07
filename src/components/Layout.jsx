
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X, Bell, Search, Plus, Activity, TrendingUp, Globe, Map, Presentation, Shield, Server, Stethoscope, DollarSign, FilePlus, Inbox, Truck, Package, Microscope, History, ShieldCheck, ShieldAlert, FlaskConical, Dna, BarChart3, BookOpen, Building } from 'lucide-react';
import { useData } from '../services/DataContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { logout, currentUser, roles, isProductionMode } = useData();

    // Get user role name
    const userRoleName = roles.find(r => r.id === currentUser?.roleId)?.name || 'Usuario';

    const navCategories = [
        {
            category: 'Dashboard',
            items: [
                { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/analytics', label: 'Inteligencia de Negocio', icon: Activity },
                { path: '/performance', label: 'Rendimiento y Costos', icon: TrendingUp },
            ]
        },
        {
            category: 'Gestión de Casos',
            items: [
                { path: '/cases/new', label: 'Nuevo Caso', icon: FilePlus },
                { path: '/reception', label: 'Recepción', icon: Inbox },
                { path: '/patients', label: 'Pacientes', icon: Users },
            ]
        },
        {
            category: 'Logística',
            items: [
                { path: '/logistics', label: 'Logística', icon: Truck },
                { path: '/dispatch', label: 'Despacho de Resultados', icon: ShieldCheck },
                { path: '/my-deliveries', label: 'Mis Entregas', icon: Package },
            ]
        },
        {
            category: 'Red y Colaboración',
            items: [
                { path: '/tumor-board', label: 'Tumor Board', icon: Presentation },
                { path: '/global-network', label: 'Red Global de Casos', icon: Globe },
                { path: '/case-map', label: 'Mapa de Casos', icon: Map },
            ]
        },
        {
            category: 'Catálogos',
            items: [
                { path: '/centers', label: 'Centros', icon: Building },
                { path: '/insurers', label: 'Aseguradoras', icon: Shield },
                { path: '/organs', label: 'Órganos', icon: Activity },
                { path: '/equipment', label: 'Equipos', icon: Server },
                { path: '/doctors', label: 'Doctores', icon: Stethoscope },
                { path: '/tariffs', label: 'Tarifas', icon: DollarSign },
            ]
        },
        {
            category: 'Configuración',
            items: [
                { path: '/users', label: 'Usuarios', icon: Users },
                { path: '/roles', label: 'Roles y Permisos', icon: Shield },
                { path: '/audit-log', label: 'Registro de Auditoría', icon: History },
                ...(userRoleName === 'Administrador' ? [{ path: '/usage-dashboard', label: 'Dashboard de Uso', icon: BarChart3 }] : []),
                { path: '/settings', label: 'Configuración', icon: Settings },
                { path: '/help', label: 'Ayuda', icon: BookOpen },
            ]
        }
    ];

    // Flatten items for header lookup
    const allNavItems = navCategories.flatMap(cat => cat.items);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', height: '100vh', overflow: 'hidden' }} className="bg-app">
            {/* Sidebar */}
            <aside className="bg-white border-r border-border shadow-sm z-20 flex flex-col" style={{ overflowY: 'auto' }}>
                <div className="p-6 flex items-center gap-3 border-b border-border shrink-0 sticky top-0 bg-white z-10">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white">
                        <Microscope size={20} />
                    </div>
                    <h1 className="font-bold text-lg text-primary">PathAI Lab</h1>
                </div>

                <nav className="flex-1 p-4 space-y-6">
                    {navCategories.map((group) => (
                        <div key={group.category} className="space-y-1">
                            <h3 className="px-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                                {group.category}
                            </h3>
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${isActive
                                                ? 'bg-primary-light text-primary font-medium'
                                                : 'text-text-secondary hover:bg-gray-50 hover:text-text-main'
                                            } `
                                        }
                                    >
                                        <Icon size={18} />
                                        <span className="text-sm">{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-border shrink-0 sticky bottom-0 bg-white z-10">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-text-secondary hover:text-danger transition-colors rounded-md hover:bg-red-50"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-col min-w-0" style={{ overflowY: 'auto' }}>
                {isProductionMode ? (
                    <div className="bg-red-600 text-white px-4 py-2 text-center font-bold text-xs shadow-md sticky top-0 z-30 flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Dna size={14} />
                        🧬 MODO PRODUCCIÓN – Datos Reales y Operación Crítica
                    </div>
                ) : (
                    <div className="bg-blue-600 text-white px-4 py-2 text-center font-bold text-xs shadow-md sticky top-0 z-30 flex items-center justify-center gap-2 uppercase tracking-widest">
                        <FlaskConical size={14} />
                        🧪 MODO DEMO – Entorno de Pruebas y Datos Simulados
                    </div>
                )}
                <header className="bg-white border-b border-border px-8 py-4 flex justify-between items-center shrink-0 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-text-main">
                        {allNavItems.find(i => i.path === location.pathname)?.label || 'Pathology System'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium">{currentUser?.name || 'Usuario'}</p>
                            <p className="text-xs text-text-secondary">{userRoleName}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-text-secondary font-bold">
                            {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};


export default Layout;
