import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X, Bell, Search, Plus, Activity, TrendingUp, Globe, Map, Presentation, Shield, Server, Stethoscope, DollarSign, FilePlus, Inbox, Truck, Package, Microscope, History, ShieldCheck, ShieldAlert, FlaskConical, Dna, BarChart3, BookOpen, Building } from 'lucide-react';
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

    // Flatten items for header lookup
    const allNavItems = navCategories.flatMap(cat => cat.items);

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
            {/* 1. SIDEBAR: Ahora es una columna real, no flota */}
            <aside className={`
                fixed inset-y-0 left-0 z-[100] w-64 bg-white border-r border-slate-200 
                flex flex-col h-[100vh] max-h-[100vh] overflow-hidden
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* HEADER SIDEBAR (Fijo) */}
                <div className="flex-shrink-0 h-16 flex items-center px-6 border-b border-slate-100 justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                            <Microscope size={18} />
                        </div>
                        <h1 className="font-bold text-lg text-slate-900">PathAI</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2"><X size={20} /></button>
                </div>

                {/* CUERPO NAVEGACIÓN (SCROLL REAL) */}
                <nav className="flex-1 overflow-y-auto min-h-0 px-4 py-6 custom-scrollbar bg-white">
                    <div className="flex flex-col gap-8 pb-60">
                        {navCategories.map((group) => {
                            const visibleItems = group.items; // DEBUG: Quitar filter temporalmente
                            if (visibleItems.length === 0) return null;
                            return (
                                <div key={group.category}>
                                    <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{group.category}</h3>
                                    <ul className="list-none p-0 m-0 space-y-1 block" style={{ listStyleType: 'none !important' }}>
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.path} className="list-none before:hidden">
                                                    <NavLink to={item.path} onClick={() => setIsSidebarOpen(false)}
                                                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                        <Icon size={18} className="flex-shrink-0" />
                                                        <span className="text-sm">{item.label}</span>
                                                    </NavLink>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* FOOTER SIDEBAR (Fijo abajo) */}
                <div className="flex-shrink-0 p-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:text-red-600 rounded-lg">
                        <LogOut size={18} />
                        <span className="font-semibold text-sm">Cerrar Sesión</span>
                    </button>
                    <p className="mt-2 text-center text-[10px] text-slate-400">v2.5.0 • PathAI System</p>
                </div>
            </aside>

            {/* 2. CONTENIDO PRINCIPAL: Ocupa el resto del espacio */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Header del Main */}
                <header className="flex-shrink-0 h-16 border-b bg-white flex items-center px-4 lg:px-8 justify-between">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2"><Menu size={20} /></button>
                    <h2 className="text-xl font-bold">{allNavItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}</h2>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold">{currentUser?.name}</p>
                            <p className="text-xs text-slate-500">{userRoleName}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                            {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                    </div>
                </header>

                {/* AREA DE CONTENIDO (CON SU PROPIO SCROLL) */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
                    <div className="max-w-[1600px] mx-auto">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
