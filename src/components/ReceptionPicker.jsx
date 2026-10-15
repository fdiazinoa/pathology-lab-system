import React, { useState } from 'react';
import Modal from './Modal';
import { receptionDate, searchReceptions } from '../services/receptionCases';

export default function ReceptionPicker({ records, patients, doctors, onSelect, onClose }) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const filtered = searchReceptions(records, query, patients, doctors);
    const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
    const currentPage = Math.min(page, pageCount - 1);
    return <Modal isOpen title="Recepciones pendientes" onClose={onClose} showFooter={false} maxWidth="max-w-3xl">
        <div className="space-y-4" onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
            <p className="text-sm">Seleccione la muestra que va a trabajar. Para registrar otra muestra, use Recepción. Las recepciones más recientes aparecen primero.</p>
            <input autoFocus type="search" aria-label="Buscar recepción" placeholder="Buscar caso, fecha, paciente, cédula, muestra o médico…" value={query}
                onChange={event => { setQuery(event.target.value); setPage(0); }} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            <p role="status" className="text-xs">{filtered.length} recepciones pendientes</p>
            <div className="space-y-2">
                {filtered.slice(currentPage * 20, (currentPage + 1) * 20).map(record => {
                    const patient = patients.find(item => item.id === record.patientId);
                    const doctor = doctors.find(item => item.id === record.doctorId);
                    const date = receptionDate(record);
                    return <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold text-text-main">{record.case_number || record.sampleId || 'Recepción'} · {patient?.name || record.patientName || 'Paciente'}</p>
                            <p>{date ? new Date(date).toLocaleString('es-DO') : 'Sin fecha'} · {record.type}</p>
                            <p className="text-xs">{doctor?.name || record.doctorName || 'Sin médico asignado'} · {record.originCenter || 'Sin centro'}</p>
                        </div>
                        <button type="button" onClick={() => onSelect(record)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">Continuar caso</button>
                    </div>;
                })}
                {!filtered.length && <p className="py-4 text-center text-sm">No hay recepciones pendientes que coincidan.</p>}
            </div>
            <div className="flex items-center justify-between text-sm">
                <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Anterior</button>
                <span>Página {currentPage + 1} de {pageCount}</span>
                <button type="button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Siguiente</button>
            </div>
        </div>
    </Modal>;
}
