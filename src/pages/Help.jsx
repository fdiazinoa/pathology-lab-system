import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, ChevronRight, Filter, FilterX, AlertTriangle, ShieldAlert } from 'lucide-react';
import Card from '../components/Card';
import { useData } from '../services/DataContext';
import { getPrioritizedHelpSections } from '../config/helpContextRules';

// Import HELP_SECTIONS from Settings (we'll need to extract this to a shared file)
import { HELP_SECTIONS } from './Settings';

const Help = () => {
    const { currentUser, isProductionMode } = useData();
    const [helpSearchQuery, setHelpSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('');
    const [showAllHelp, setShowAllHelp] = useState(false);

    // Intersection Observer for Help ToC
    useEffect(() => {
        if (helpSearchQuery) return;

        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -70% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        HELP_SECTIONS.forEach(section => {
            const element = document.getElementById(section.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [helpSearchQuery]);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(id);
        }
    };

    // Get prioritized help sections based on context
    const prioritizedSectionIds = React.useMemo(() => {
        if (showAllHelp || helpSearchQuery) return [];

        return getPrioritizedHelpSections({
            roleId: currentUser?.roleId,
            isProductionMode,
            currentPath: window.location.pathname
        });
    }, [currentUser?.roleId, isProductionMode, showAllHelp, helpSearchQuery]);

    // Sort help sections with prioritized ones first
    const sortedHelpSections = React.useMemo(() => {
        if (prioritizedSectionIds.length === 0) return HELP_SECTIONS;

        const prioritized = [];
        const others = [];

        HELP_SECTIONS.forEach(section => {
            if (prioritizedSectionIds.includes(section.id)) {
                prioritized.push(section);
            } else {
                others.push(section);
            }
        });

        return [...prioritized, ...others];
    }, [prioritizedSectionIds]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-main mb-2">Centro de Ayuda</h1>
                <p className="text-text-secondary">Documentación y guías para el uso del sistema</p>
            </div>

            <div className="space-y-6">
                {/* Help Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar en la ayuda (ej. 'IA', 'casos previos', 'consistencia')..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                        value={helpSearchQuery}
                        onChange={(e) => setHelpSearchQuery(e.target.value)}
                    />
                    {helpSearchQuery && (
                        <button
                            onClick={() => setHelpSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {!helpSearchQuery && (
                    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
                                <BookOpen size={18} className="text-primary" />
                                Índice de Contenidos
                                {!showAllHelp && prioritizedSectionIds.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-primary-light text-primary text-xs rounded-full font-medium">
                                        Contextual
                                    </span>
                                )}
                            </h3>
                            {prioritizedSectionIds.length > 0 && (
                                <button
                                    onClick={() => setShowAllHelp(!showAllHelp)}
                                    className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
                                >
                                    {showAllHelp ? (
                                        <>
                                            <Filter size={14} />
                                            Mostrar relevante
                                        </>
                                    ) : (
                                        <>
                                            <FilterX size={14} />
                                            Mostrar todo
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sortedHelpSections.map((section) => {
                                const isPrioritized = prioritizedSectionIds.includes(section.id);
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`flex items-center gap-2 text-sm p-2 rounded-lg transition-all text-left ${activeSection === section.id
                                            ? 'bg-primary-light text-primary font-semibold'
                                            : isPrioritized && !showAllHelp
                                                ? 'text-text-main hover:bg-primary-light/30 font-medium border border-primary/20'
                                                : 'text-text-secondary hover:bg-gray-50 hover:text-text-main opacity-70'
                                            }`}
                                    >
                                        <ChevronRight
                                            size={14}
                                            className={activeSection === section.id ? 'text-primary' : isPrioritized && !showAllHelp ? 'text-primary' : 'text-gray-300'}
                                        />
                                        {section.title}
                                        {isPrioritized && !showAllHelp && activeSection !== section.id && (
                                            <span className="ml-auto text-xs text-primary">●</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {HELP_SECTIONS.filter(card =>
                    card.title.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                    card.sections.some(s =>
                        s.title.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                        s.content.toLowerCase().includes(helpSearchQuery.toLowerCase())
                    )
                ).map((card) => (
                    <div key={card.id} id={card.id} className="scroll-mt-24">
                        <Card title={card.title}>
                            <div className="space-y-6">
                                {card.sections.map((section, sIdx) => (
                                    <section key={sIdx} className={sIdx > 0 ? "pt-4 border-t border-gray-100" : ""}>
                                        <h3 className="font-bold text-text-main flex items-center gap-2">
                                            {sIdx === 0 && card.icon && <card.icon size={18} className="text-primary" />}
                                            {section.title}
                                        </h3>
                                        <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                                            {section.content}
                                        </p>
                                    </section>
                                ))}

                                {card.footer && (
                                    <div className={`p-4 rounded-lg border flex gap-3 ${card.footer.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
                                        }`}>
                                        {card.footer.type === 'warning' ? (
                                            <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
                                        ) : (
                                            <ShieldAlert className="text-blue-600 flex-shrink-0" size={24} />
                                        )}
                                        <div>
                                            <h4 className={`text-sm font-bold ${card.footer.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                                                }`}>{card.footer.title}</h4>
                                            <p className={`text-xs mt-1 leading-relaxed ${card.footer.type === 'warning' ? 'text-amber-800' : 'text-blue-800'
                                                }`}>
                                                {card.footer.content}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                ))}

                {HELP_SECTIONS.filter(card =>
                    card.title.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                    card.sections.some(s =>
                        s.title.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                        s.content.toLowerCase().includes(helpSearchQuery.toLowerCase())
                    )
                ).length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Search size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-text-main">No se encontraron resultados</h3>
                            <p className="text-text-secondary mt-1">Intente con palabras clave como "IA", "casos" o "informe".</p>
                            <button
                                onClick={() => setHelpSearchQuery('')}
                                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                Limpiar búsqueda
                            </button>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default Help;
