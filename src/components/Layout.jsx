
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
        <div className="flex lg:grid lg:grid-cols-[260px_1fr] h-[100dvh] lg:h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 relative">

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static top-0 h-[100dvh] lg:h-screen left-0 z-50 w-[260px] bg-white border-r border-slate-200 shadow-xl lg:shadow-sm transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col
            `}>
                <div className="p-6 flex items-center justify-between shrink-0 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-600 rounded-xl shadow-sm flex items-center justify-center text-white">
                            <Microscope size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">PathAI</h1>
                            <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">Enterprise Lab</p>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <nav className="px-3 py-4 space-y-8">
                        {navCategories.map((group) => {
                            console.log('Processing group:', group.category);
                            const visibleItems = group.items.filter(item => {
                                const isAllowed = !item.allowedRoles || (currentUser?.roleId && item.allowedRoles.includes(currentUser.roleId));
                                console.log(`  - ${item.label}: roleId=${currentUser?.roleId}, allowed=${item.allowedRoles}, visible=${isAllowed}`);
                                return isAllowed;
                            });

                            if (visibleItems.length === 0) return null;

                            return (
                                <div key={group.category} className="space-y-1">
                                    <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        {group.category}
                                    </h3>
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setIsSidebarOpen(false)} // Close on navigate
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${isActive
                                                        ? 'bg-teal-50 text-teal-700 font-medium shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    } `
                                                }
                                            >
                                                <Icon size={18} strokeWidth={1.75} className={`transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                                <span className="text-sm">{item.label}</span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Logout button inside scroll area */}
                    <div className="px-3 pb-32 pt-4">
                        <div className="border-t border-slate-200 pt-4">
                            <button
                                onClick={logout}
                                className="flex items-center gap-3 px-3 py-2 w-full text-slate-500 hover:text-red-600 transition-all rounded-lg hover:bg-red-50 group"
                            >
                                <LogOut size={18} strokeWidth={1.5} className="group-hover:stroke-red-600" />
                                <span className="text-sm font-medium">Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-col flex-1 h-full min-w-0 bg-slate-50 overflow-y-auto relative z-0 w-full transition-all duration-300">
                {isProductionMode ? (
                    <div className="bg-red-600 text-white px-4 py-1.5 text-center font-bold text-[10px] shadow-sm sticky top-0 z-50 flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Dna size={12} />
                        🧬 MODO PRODUCCIÓN – Operación Crítica
                    </div>
                ) : (
                    <div className="bg-indigo-50 text-indigo-700 border-b border-indigo-100 px-4 py-1.5 text-center font-bold text-[10px] sticky top-0 z-50 flex items-center justify-center gap-2 uppercase tracking-widest backdrop-blur-sm">
                        <FlaskConical size={12} />
                        🧪 MODO DEMO – Simulador
                    </div>
                )}

                <header className="px-4 lg:px-8 py-4 flex justify-between items-center shrink-0 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            <Menu size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-none">
                            {allNavItems.find(i => i.path === location.pathname)?.label || 'Pathology System'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
                            <span className="text-xs font-medium text-slate-500">Sistema Operativo</span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900 leading-tight">{currentUser?.name || 'Usuario'}</p>
                                <p className="text-xs text-slate-500 font-medium">{userRoleName}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-white shadow-sm flex items-center justify-center text-teal-700 font-bold">
                                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'US'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};


export default Layout;
