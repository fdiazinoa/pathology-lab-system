import React from 'react';
import { useData } from '../services/DataContext';
import ResultTemplateCatalogSettings from '../components/ResultTemplateCatalogSettings';
export default function ResultTemplatesManager() {
    const { settings, exams, updateSettings } = useData();
    return <div className="space-y-5"><h1 className="text-2xl font-bold">Plantillas de resultados</h1><ResultTemplateCatalogSettings settings={settings} exams={exams} onSave={updateSettings} /></div>;
}
