import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useData } from '../services/DataContext';

const ConsistencyAlerts = ({ results, onRecheck }) => {
    const { logUsageEvent } = useData();

    React.useEffect(() => {
        if (results) {
            logUsageEvent('Consistency', 'Viewed', {
                consistent: results.consistent,
                alertCount: results.alerts?.length || 0
            });
        }
    }, [results, logUsageEvent]);

    if (!results) return null;

    const { consistent, alerts } = results;

    return (
        <div className="mt-4 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    Control de Consistencia del Informe
                    {consistent ? (
                        <span className="text-green-600 flex items-center gap-1 normal-case font-medium">
                            <CheckCircle size={14} /> Consistente
                        </span>
                    ) : (
                        <span className="text-amber-600 flex items-center gap-1 normal-case font-medium">
                            <AlertTriangle size={14} /> Posibles inconsistencias ({alerts.length})
                        </span>
                    )}
                </h4>
                {onRecheck && (
                    <button
                        onClick={() => {
                            logUsageEvent('Consistency', 'Recheck');
                            onRecheck();
                        }}
                        className="text-[10px] text-primary hover:underline font-medium"
                    >
                        Volver a verificar
                    </button>
                )}
            </div>

            {!consistent && (
                <div className="space-y-2">
                    {alerts.map((alert, idx) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg border flex gap-3 ${alert.severity === 'high'
                                ? 'bg-red-50 border-red-100 text-red-800'
                                : 'bg-amber-50 border-amber-100 text-amber-800'
                                }`}
                        >
                            <AlertTriangle size={18} className={alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'} />
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/50">
                                        {alert.section}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase">
                                        Prioridad {alert.severity === 'high' ? 'Alta' : 'Media'}
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed">{alert.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-2">
                <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-blue-800 leading-tight">
                    <strong>Aviso:</strong> Estas alertas son orientativas basadas en reglas automáticas y no sustituyen la revisión clínica del patólogo.
                </p>
            </div>
        </div>
    );
};

export default ConsistencyAlerts;
