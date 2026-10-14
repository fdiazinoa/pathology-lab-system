export const RESULT_TEMPLATE_GROUPS = {
    B: 'Biopsias',
    C: 'Citología · sección C',
    L: 'Citología · sección L',
    CT: 'Citología no ginecológica · CT',
    HPV: 'Pruebas de HPV'
};

export const normalizeSearch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// No inferred C/L mapping: the laboratory explicitly associates each exam with a section.
export function templatesForExam(catalog, groupsByExam, examId, query = '') {
    const group = groupsByExam[String(examId)];
    if (!examId || !Object.hasOwn(RESULT_TEMPLATE_GROUPS, group)) return [];
    const search = normalizeSearch(query).trim();
    return catalog.filter(item => item.group === group &&
        normalizeSearch(`${item.code} ${item.result} ${item.description}`).includes(search));
}

export function appendTemplate(current, text) {
    return current ? `${current}\n\n${text}` : text;
}

// RFC 4180 quoting, including embedded commas, quotes and line breaks.
export function parseResultTemplatesCSV(source) {
    const text = source.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], field = '', quoted = false, closedQuote = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (ch === '"') { quoted = false; closedQuote = true; }
            else field += ch;
        } else if (ch === '"') {
            if (field || closedQuote) throw new Error('CSV inválido: comillas fuera de lugar.');
            quoted = true;
        } else if (ch === ',' || ch === '\n' || ch === '\r') {
            row.push(field); field = ''; closedQuote = false;
            if (ch !== ',') {
                if (row.some(value => value.trim())) rows.push(row);
                row = [];
                if (ch === '\r' && text[i + 1] === '\n') i++;
            }
        } else {
            if (closedQuote) throw new Error('CSV inválido: texto después de una comilla de cierre.');
            field += ch;
        }
    }
    if (quoted) throw new Error('CSV inválido: hay comillas sin cerrar.');
    row.push(field);
    if (row.some(value => value.trim())) rows.push(row);
    const headers = rows.shift()?.map(value => value.trim()) || [];
    const required = ['IDseccion', 'IDresultado', 'Resultado', 'Descripcion'];
    if (!required.every(name => headers.includes(name)) || new Set(headers).size !== headers.length) {
        throw new Error('El CSV debe incluir IDseccion, IDresultado, Resultado y Descripcion.');
    }
    if (!rows.length) throw new Error('El CSV no contiene plantillas.');
    return rows.map((values, index) => {
        if (values.length !== headers.length) throw new Error(`Registro ${index + 1}: número de columnas incorrecto.`);
        const record = Object.fromEntries(headers.map((name, i) => [name, values[i]]));
        const group = record.IDseccion.trim();
        if (!Object.hasOwn(RESULT_TEMPLATE_GROUPS, group) || !record.IDresultado.trim() || !record.Resultado.trim()) {
            throw new Error(`Registro ${index + 1}: sección, código o resultado inválido.`);
        }
        return {
            id: `${group}:${index + 1}`, group, code: record.IDresultado,
            result: record.Resultado, description: record.Descripcion
        };
    });
}
