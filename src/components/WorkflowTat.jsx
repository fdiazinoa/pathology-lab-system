import React, { useEffect, useState } from 'react';
import { formatDuration, workflowTat } from '../services/workflowTat';

const STATES = { pending: 'Pendiente', waiting: 'En espera', working: 'En trabajo', complete: 'Completada', historic: 'Histórica sin desglose', invalid: 'Revisar fechas' };

export default function WorkflowTat({ record, events }) {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, []);
    const tat = workflowTat(record, events, Math.max(now, Date.now()));
    return <section aria-label="TAT del caso" className="border rounded-lg p-4 space-y-3">
        <h4 className="font-semibold">TAT total y por etapa</h4>
        <p className="text-sm text-text-secondary">Tiempo calendario continuo, incluidos noches y fines de semana. Recepción → validación del informe. Actualización del reloj cada 30 segundos; use Actualizar registro para consultar movimientos de otras terminales.</p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[['TAT total', tat.totalMs], ['Espera registrada', tat.waitMs], ['Trabajo registrado', tat.workMs], ['Tiempo sin clasificar', tat.unclassifiedMs]].map(([label, value]) =>
                <div key={label}><dt className="font-medium">{label}</dt><dd>{formatDuration(value)}</dd></div>)}
        </dl>
        <p className="text-sm">{tat.state === 'validated' ? 'Cerrado por validación del informe.' : tat.state === 'closed' ? 'Caso cerrado sin fecha de validación utilizable; no se prolonga su reloj.' : 'En curso hasta la validación del informe.'}</p>
        {tat.totalMs === null && <p className="text-sm">Falta una fecha y hora fiable de recepción o cierre, o las fechas son inconsistentes. La fecha de creación del caso no sustituye la recepción.</p>}
        {tat.totalMs !== null && tat.unclassifiedMs === null && <p className="text-sm">No se puede conciliar el desglose: revise fechas fuera del período o etapas superpuestas.</p>}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <caption className="text-left text-text-secondary mb-2">Espera: entrada → inicio. Trabajo: inicio → finalización. Los intervalos abiertos avanzan con el reloj; las etapas históricas no inventan tiempos.</caption>
                <thead><tr>{['Etapa', 'Estado', 'Espera', 'Trabajo', 'TAT de etapa'].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
                <tbody>{tat.stages.map(stage => <tr key={stage.id} className="border-t">
                    <th scope="row" className="p-2 font-medium">{stage.label}</th><td className="p-2">{STATES[stage.state]}</td>
                    {[stage.waitMs, stage.workMs, stage.totalMs].map((value, index) => <td key={index} className="p-2 whitespace-nowrap">{formatDuration(value)}</td>)}
                </tr>)}</tbody>
            </table>
        </div>
        <p className="text-xs text-text-secondary">Tiempo sin clasificar incluye transferencias entre etapas e intervalos sin eventos. Trabajo registrado mide tiempo transcurrido, no actividad continua del operador. Reabrir el informe reinicia el cierre del TAT, conservando la recepción y los eventos existentes.</p>
    </section>;
}
