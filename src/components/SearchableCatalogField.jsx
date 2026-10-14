import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check } from 'lucide-react';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function SearchableCatalogField({ label, title, placeholder, items, value, onChange, fallbackLabel, required = false, compact = false, triggerText, disabled = false, emptyMessage = 'No se encontraron coincidencias.' }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [invalid, setInvalid] = useState(false);
    const trigger = useRef(null);
    const dialog = useRef(null);
    const search = useRef(null);
    const id = useId();
    const selected = items.find(item => String(item.value) === String(value));
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    const filtered = items.filter(item => terms.every(term => normalize(`${item.label} ${item.detail || ''} ${item.search || ''}`).includes(term)));

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        search.current?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            trigger.current?.focus();
        };
    }, [open]);

    const show = () => { setQuery(''); setOpen(true); };
    const handleKeys = event => {
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
        if (event.key === 'Enter' && event.target === search.current) {
            event.preventDefault();
            dialog.current?.querySelector('[data-catalog-result]')?.focus();
        }
        if (event.key === 'Tab') {
            const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input')];
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
    };

    return (
        <div className={compact ? 'inline-flex' : 'flex flex-col gap-1.5'}>
            <label htmlFor={id} className={compact ? 'sr-only' : 'text-sm font-medium text-text-main'}>{label}</label>
            <button ref={trigger} id={id} type="button" disabled={disabled} title={disabled ? 'Seleccione el examen y el órgano del caso' : undefined} aria-haspopup="dialog" aria-expanded={open} aria-invalid={invalid || undefined}
                className={`flex w-full items-center justify-between gap-3 rounded-md border bg-white px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary ${invalid ? 'border-danger' : 'border-border'}`}
                onClick={show}>
                <span className={value || triggerText ? 'text-text-main' : 'text-text-secondary'}>{triggerText || selected?.label || (value ? fallbackLabel || String(value) : placeholder)}</span>
                <Search size={16} className="shrink-0 text-text-secondary" aria-hidden="true" />
            </button>
            {/* Keep native form validation while the visible control opens a searchable dialog. */}
            <select aria-label={`${label} (validación)`} className="sr-only" tabIndex={-1} value={value || ''} required={required}
                onChange={event => onChange(event.target.value)} onInvalid={event => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); }}>
                <option value="" />
                {value && <option value={value}>{selected?.label || fallbackLabel || value}</option>}
            </select>
            {invalid && !value && <p className="text-xs text-danger">Seleccione una opción.</p>}
            {open && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
                    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onKeyDown={handleKeys}
                        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <h2 id={`${id}-title`} className="text-lg font-bold text-text-main">{title}</h2>
                            <button type="button" aria-label="Cerrar búsqueda" className="rounded p-2 hover:bg-gray-100" onClick={() => setOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="space-y-2 border-b border-border px-5 py-3">
                            <label htmlFor={`${id}-search`} className="text-sm text-text-secondary">Buscar por nombre o código</label>
                            <input ref={search} id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)}
                                className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Escriba para buscar…" />
                            <p role="status" className="text-xs text-text-secondary">{filtered.length} resultados</p>
                        </div>
                        <div className="min-h-0 overflow-y-auto p-2">
                            {filtered.length ? filtered.map(item => (
                                <button key={item.id} data-catalog-result type="button" onClick={() => { onChange(item.value); setInvalid(false); setOpen(false); }}
                                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                                    <span><span className="block text-sm font-medium text-text-main">{item.label}</span>{item.detail && <span className="block text-xs text-text-secondary">{item.detail}</span>}</span>
                                    {String(item.value) === String(value) && <Check size={18} className="shrink-0 text-primary" aria-label="Seleccionado" />}
                                </button>
                            )) : <p className="p-6 text-center text-sm text-text-secondary">{emptyMessage}</p>}
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
}
