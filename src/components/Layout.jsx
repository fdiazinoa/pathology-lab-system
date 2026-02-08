import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X, Bell,
    Search, Plus, Activity, TrendingUp, Globe, Map, Presentation,
    Shield, Server, Stethoscope, DollarSign, FilePlus, Inbox, Truck,
    Package, Microscope, History, ShieldCheck, ShieldAlert, FlaskConical,
    Dna, BarChart3, BookOpen, Building
} from 'lucide-react';
import { useData } from '../services/DataContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { logout, currentUser, roles, isProductionMode } = useData();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Get user role name
    const userRoleName = roles.find(r => r.id === currentUser?.roleId)?.name || 'Usuario';

    const navCategories = [
        {
            category: 'Dashboard',
            items: [
                { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['1', '2', '3', '4'] },
                { path: '/analytics', label: 'Inteligencia de Negocio', icon: Activity, allowedRoles: ['1'] },
                { path: '/performance', label: 'Rendimiento y Costos', icon: TrendingUp, allowedRoles: ['1'] },
            ]
        },
        {
            category: 'Gestión de Casos',
            items: [
                { path: '/cases/new', label: 'Nuevo Caso', icon: FilePlus, allowedRoles: ['1', '2', '3'] },
                { path: '/reception', label: 'Recepción', icon: Inbox, allowedRoles: ['1', '3'] },
                { path: '/patients', label: 'Pacientes', icon: Users, allowedRoles: ['1', '2', '3'] },
            ]
        },
        {
            category: 'Logística',
            items: [
                { path: '/logistics', label: 'Logística', icon: Truck, allowedRoles: ['1', '4'] },
                { path: '/dispatch', label: 'Despacho de Resultados', icon: ShieldCheck, allowedRoles: ['1', '4'] },
                { path: '/my-deliveries', label: 'Mis Entregas', icon: Package, allowedRoles: ['1', '4'] },
            ]
        },
        {
            category: 'Red y Colaboración',
            items: [
                { path: '/tumor-board', label: 'Tumor Board', icon: Presentation, allowedRoles: ['1', '2'] },
                { path: '/global-network', label: 'Red Global de Casos', icon: Globe, allowedRoles: ['1', '2'] },
                { path: '/case-map', label: 'Mapa de Casos', icon: Map, allowedRoles: ['1', '2'] },
            ]
        },
        {
            category: 'Catálogos',
            items: [
                { path: '/centers', label: 'Centros', icon: Building, allowedRoles: ['1', '2'] },
                { path: '/insurers', label: 'Aseguradoras', icon: Shield, allowedRoles: ['1', '2'] },
                { path: '/organs', label: 'Órganos', icon: Activity, allowedRoles: ['1', '2'] },
                { path: '/equipment', label: 'Equipos', icon: Server, allowedRoles: ['1', '2'] },
                { path: '/doctors', label: 'Doctores', icon: Stethoscope, allowedRoles: ['1', '2'] },
                { path: '/tariffs', label: 'Tarifas', icon: DollarSign, allowedRoles: ['1', '2'] },
            ]
        },
        {
            category: 'Configuración',
            items: [
                { path: '/users', label: 'Usuarios', icon: Users, allowedRoles: ['1'] },
                { path: '/roles', label: 'Roles y Permisos', icon: Shield, allowedRoles: ['1'] },
                { path: '/audit-log', label: 'Registro de Auditoría', icon: History, allowedRoles: ['1'] },
                ...(userRoleName === 'Administrador' ? [{ path: '/usage-dashboard', label: 'Dashboard de Uso', icon: BarChart3, allowedRoles: ['1'] }] : []),
                { path: '/settings', label: 'Configuración', icon: Settings, allowedRoles: ['1', '2'] },
                { path: '/help', label: 'Ayuda', icon: BookOpen, allowedRoles: ['1', '2', '3', '4'] },
            ]
        }
    ];

    const allNavItems = navCategories.flatMap(cat => cat.items);

    // Renderizado del Sidebar Interno (Reutilizable para Desktop y Mobile)
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white text-slate-900">
            {/* A. HEADER (Fijo) */}
            <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-slate-100 gap-3">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                    <Microscope size={20} />
                </div>
                <h1 className="font-bold text-xl tracking-tight">PathAI</h1>
            </div>

            {/* B. SCROLL AREA (Flexible) */}
            <nav className="flex-1 overflow-y-auto min-h-0 p-4 custom-scrollbar">
                <div className="flex flex-col gap-6">
                    {navCategories.map((group) => {
                        const visibleItems = group.items.filter(item =>
                            !item.allowedRoles || (currentUser?.roleId && item.allowedRoles.includes(currentUser.roleId))
                        );
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.category}>
                                <h3 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    {group.category}
                                </h3>
                                <ul className="flex flex-col gap-1 list-none p-0 m-0">
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <li key={item.path}>
                                                <NavLink to={item.path} onClick={() => setIsSidebarOpen(false)}
                                                    className={({ isActive }) => `
                                                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                                        ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                                    `}>
                                                    <Icon size={18} />
                                                    {item.label}
                                                </NavLink>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                    {/* Espaciador final de seguridad */}
                    <div className="h-24 flex-shrink-0" />
                </div>
            </nav>

            {/* C. FOOTER (Fijo) */}
            <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-slate-50">
                <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                </button>
                <div className="mt-3 text-center">
                    <span className="text-[10px] text-slate-400 font-mono italic">v2.5.0 • PathAI System</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[264px_1fr] h-screen w-full bg-slate-50 overflow-hidden font-sans">

            {/* 1. SIDEBAR DESKTOP (Columna Izquierda Real) */}
            <aside className="hidden lg:flex flex-col h-full border-r border-slate-200 overflow-hidden">
                <SidebarContent />
            </aside>

            {/* 2. SIDEBAR MOBILE (Overlay Flotante) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-64 h-full shadow-2xl animate-in slide-in-from-left duration-300">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* 3. CONTENIDO PRINCIPAL (Columna Derecha) */}
            <main className="flex flex-col h-full min-w-0 overflow-hidden relative">

                {/* Environment Banner */}
                {isProductionMode ? (
                    <div className="bg-red-600 text-white px-4 py-1.5 text-center font-bold text-[10px] shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Dna size={12} />
                        🧬 MODO PRODUCCIÓN – Operación Crítica
                    </div>
                ) : (
                    <div className="bg-indigo-50 text-indigo-700 border-b border-indigo-100 px-4 py-1.5 text-center font-bold text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest backdrop-blur-sm">
                        <FlaskConical size={12} />
                        🧪 MODO DEMO – Simulador
                    </div>
                )}

                {/* Header del Main */}
                <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 transition-colors">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md">
                            <Menu size={20} />
                        </button>
                        <h2 className="font-bold text-slate-800 text-lg truncate">
                            {allNavItems.find(i => i.path === location.pathname)?.label || 'PathAI Enterprise'}
                        </h2>
                    </div>
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-slate-900">{currentUser?.name || 'Usuario'}</div>
                            <div className="text-xs text-slate-500">{userRoleName}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold border border-teal-200">
                            {currentUser?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                    </div>
                </header>

                {/* AREA DE CONTENIDO (Scroll Independiente) */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-slate-50/50">
                    <div className="max-w-[1600px] mx-auto pb-10">
                        {children || <Outlet />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
