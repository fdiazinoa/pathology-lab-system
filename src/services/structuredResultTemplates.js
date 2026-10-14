import { normalizeSearch } from './resultTemplates.js';

export const DETAIL_LABELS = {
    specimen: 'Muestra / material recibido', technique: 'Técnica / método', adequacy: 'Adecuación de la muestra',
    category: 'Categoría general', inflammation: 'Inflamación', organisms: 'Microorganismos',
    hormonalAssessment: 'Evaluación hormonal / maduración', genotype: 'Genotipado',
    interpretation: 'Interpretación', comments: 'Comentarios / recomendaciones', additionalText: 'Texto adicional por revisar'
};
export const SECTION_LABELS = { macroscopy: 'Macroscopía', microscopy: 'Microscopía / descripción citológica', diagnosis: 'Diagnóstico / resultado', ...DETAIL_LABELS };
export const STUDY_FIELDS = {
    B: ['technique', 'comments', 'additionalText'],
    C: ['specimen', 'technique', 'adequacy', 'category', 'inflammation', 'organisms', 'hormonalAssessment', 'comments', 'additionalText'],
    L: ['specimen', 'technique', 'adequacy', 'category', 'inflammation', 'organisms', 'hormonalAssessment', 'comments', 'additionalText'],
    CT: ['specimen', 'technique', 'adequacy', 'comments', 'additionalText'],
    HPV: ['specimen', 'technique', 'genotype', 'interpretation', 'comments', 'additionalText']
};

export function formatTemplateText(text) {
    return String(text || '').replace(/\r\n?/g, '\n').replace(/[ \t]{2,}/g, '\n')
        .replace(/\.\s*-\s*/g, '.\n').replace(/\n\s*-\s*/g, '\n')
        .split('\n').map(line => line.trim().replace(/^[-•]\s*/, '')).filter(Boolean).join('\n');
}

const add = (sections, key, value) => {
    const text = formatTemplateText(value);
    if (text) sections[key] = sections[key] ? `${sections[key]}\n${text}` : text;
};

export function structureTemplate(template) {
    const sections = {};
    const source = formatTemplateText(template.result);
    // Match explicit headings, not unmarked clinical statements inside a paragraph.
    const markers = /(?:^|\n|(?<=\s))(?:\d\s*[-.)]\s*)?(descripci[oó]n\s+macrosc[oó]pica|macroscop[ií]a|descripci[oó]n\s+microsc[oó]pica|microscop[ií]a|los\s+cortes\s+microsc[oó]picos\s+muestran|muestra|material\s+recibido|t[eé]cnica|m[eé]todo|cortes|genotipado|interpretaci[oó]n|resultados?|diagn[oó]stico|dx|comentarios?|adecuaci[oó]n)(?:\s*[:;.]+\s*|\s*\n|$)/gi;
    let cursor = 0;
    let active = null;
    const mapping = {
        'descripcion macroscopica': 'macroscopy', macroscopia: 'macroscopy',
        'descripcion microscopica': 'microscopy', microscopia: 'microscopy', 'los cortes microscopicos muestran': 'microscopy',
        muestra: template.group === 'B' ? 'macroscopy' : 'specimen', 'material recibido': 'specimen',
        tecnica: 'technique', metodo: 'technique', cortes: 'technique', genotipado: 'genotype', interpretacion: 'interpretation',
        resultado: 'diagnosis', resultados: 'diagnosis', diagnostico: 'diagnosis', dx: 'diagnosis',
        comentario: 'comments', comentarios: 'comments', adecuacion: 'adequacy'
    };
    const distribute = (text, field) => {
        if (field) { add(sections, field, text); return; }
        if (template.group === 'C' || template.group === 'L') {
            for (const line of text.split('\n')) {
                const n = normalizeSearch(line);
                let key = 'microscopy';
                if (/^(?:celulas? (?:en )?limites? normales?|celulas? anormales?)/.test(n)) key = 'category';
                else if (/^(?:inflamatori|inflamacion)/.test(n)) key = 'inflammation';
                else if (/^(?:gardnerella|candida|trichomon|colonias? bacterian|flora |lactobacil)/.test(n)) key = 'organisms';
                else if (/^(?:superficiales|intermedias|parabasales|valor de maduracion)/.test(n)) key = 'hormonalAssessment';
                else if (/^(?:satisfactori|insatisfactori|adecuada|inadecuada)/.test(n)) key = 'adequacy';
                else if (/^(?:tratar|sugerimos|realizar control|seguimiento|se recomienda)/.test(n)) key = 'comments';
                else if (/(?:lesion|atipic|atipia|ascus|asc-us|asc-h|lsil|hsil|displasia|carcinoma|neoplasia|cambios celulares asociados)/.test(n)) key = 'diagnosis';
                add(sections, key, line);
            }
        } else add(sections, template.group === 'CT' ? 'microscopy' : template.group === 'HPV' ? 'additionalText' : 'diagnosis', text);
    };
    for (const match of source.matchAll(markers)) {
        distribute(source.slice(cursor, match.index), active);
        active = mapping[normalizeSearch(match[1])];
        cursor = match.index + match[0].length;
        if (normalizeSearch(match[1]) === 'cortes') add(sections, active, 'Cortes:');
    }
    distribute(source.slice(cursor), active);
    if (['C', 'L'].includes(template.group) && !sections.diagnosis && sections.category) sections.diagnosis = sections.category;
    const titleSource = sections.diagnosis || sections.category || sections.microscopy || source;
    const first = titleSource.split('\n').find(line => line && !line.endsWith(':')) || titleSource.split('\n').find(Boolean) || template.code;
    const sentence = first.split(/\.\s+/)[0].replace(/^\d+[.)-]\s*/, '');
    const title = sentence.length > 85 ? `${sentence.slice(0, 82).replace(/\s+\S*$/, '')}…` : sentence;
    return { ...template, title, sections, structureVersion: 1 };
}

// Anatomical terms explicitly present in the source. No diagnosis-to-organ guesses.
const ANATOMY = {
    cervix: /\b(?:cervix|exocerv\w*|endocerv\w*|cuello uterino)\b/,
    endometrium: /\b(?:endometrio|endometrial\w*)\b/,
    uterus: /\b(?:utero|miometrio|cuerpo uterino)\b/,
    stomach: /\b(?:estomago|antro|antral|gastritis|(?:mucosa|cuerpo|fondo)\s+gastric\w*)\b/,
    esophagus: /\b(?:esofag\w*|barrett)\b/,
    duodenum: /\bduoden\w*\b/,
    colon: /\b(?:colon|colonic\w*|sigmoide\w*|ciego|colitis)\b/,
    rectum: /\b(?:recto|rectal\w*)\b/,
    anus: /\b(?:ano|anal)\b/,
    tonsil: /\bamigdal\w*\b/,
    thyroid: /\b(?:tiroid\w*|tiroide\w*)\b/,
    breast: /\b(?:mama|mamario\w*|mamaria\w*)\b/,
    bladder: /\b(?:vejiga|vesical\w*)\b/,
    prostate: /\bprostat\w*\b/,
    kidney: /\b(?:rinon|renal\w*)\b/,
    skin: /\b(?:piel|cutane\w*)\b/,
    lymphNode: /\b(?:ganglio\w*|nodulo linfatico)\b/,
    ovary: /\bovari\w*\b/,
    fallopianTube: /\b(?:trompa\w*|salping\w*)\b/,
    testis: /\b(?:testicul\w*|testiculo\w*)\b/,
    larynx: /\blaring\w*\b/,
    appendix: /\bapendi\w*\b/,
    gallbladder: /\b(?:vesicula biliar|colecist\w*)\b/,
    liver: /\b(?:higado|hepatic\w*)\b/,
    lung: /\b(?:pulmon\w*|bronqui\w*)\b/,
    pleura: /\bpleur\w*\b/,
    bone: /\b(?:hueso|ose[oa]\w*|femoral|femur)\b/,
    nasal: /\b(?:nasal\w*|nariz|etmoid\w*)\b/,
    vulva: /\bvulv\w*\b/,
    vagina: /\b(?:vagina|vaginal|vaginales)\b/,
    penis: /\b(?:pene|prepucio|glande)\b/,
    brain: /\b(?:cerebr\w*|encefal\w*)\b/
};
const SUBSITES = {
    antrum: /\b(?:antro|antral)\b/, gastricBody: /\bcuerpo gastric\w*\b/, gastricFundus: /\bfondo gastric\w*\b/,
    exocervix: /\bexocerv\w*\b/, endocervix: /\bendocerv\w*\b/,
    ascendingColon: /\bcolon ascendente\b/, descendingColon: /\bcolon descendente\b/, sigmoid: /\bsigmoide\w*\b/,
    palatineTonsil: /\bpalatin\w*\b/, lingualTonsil: /\blingual\w*\b/,
    forehead: /\bfrente\b/, cheek: /\bmejill\w*\b/, eyelid: /\bparpad\w*\b/, ear: /\b(?:oreja|pabellon auricular)\b/,
    forearm: /\bantebrazo\w*\b/, arm: /\bbrazo\w*\b/, hand: /\bmano\w*\b/, foot: /\bpie\b/, leg: /\bpierna\w*\b/
};
const tags = (text, dictionary) => Object.keys(dictionary).filter(key => dictionary[key].test(normalizeSearch(text)));
const sides = text => tags(text, { right: /\bderech\w*\b/, left: /\bizquierd\w*\b/ });

export function templateMatchesOrgan(template, organ) {
    if (!organ?.trim()) return false;
    // Comments often mention other organs for follow-up; use the clinical content only.
    const sections = template.sections || structureTemplate(template).sections;
    const clinical = Object.entries(sections).filter(([key]) => !['comments', 'technique', 'organisms'].includes(key)).map(([, value]) => value).join('\n');
    const sourceTags = tags(clinical, ANATOMY), selectedTags = tags(organ, ANATOMY);
    if (!sourceTags.length || !selectedTags.length) return false;
    if (sourceTags.length !== selectedTags.length || !sourceTags.every(tag => selectedTags.includes(tag))) return false;
    if (!sides(clinical).every(side => sides(organ).includes(side))) return false;
    if (['C', 'L'].includes(template.group)) return true;
    const sourceSubsites = tags(clinical, SUBSITES), selectedSubsites = tags(organ, SUBSITES);
    // Do not apply a subsite-specific result to a different or unspecified subsite.
    return sourceSubsites.every(site => selectedSubsites.includes(site)) &&
        selectedSubsites.every(site => sourceSubsites.includes(site));
}

export function applyStructuredTemplate(form, template, organ, group) {
    if (template.group !== group || !templateMatchesOrgan(template, organ)) throw new Error('La plantilla no corresponde al examen y órgano seleccionados.');
    const base = clearAppliedTemplate(form);
    const next = { ...base, resultDetails: { ...(base.resultDetails || {}) } };
    const fields = [];
    for (const [key, value] of Object.entries(template.sections || structureTemplate(template).sections)) {
        if (!Object.hasOwn(SECTION_LABELS, key)) continue;
        if (!value?.trim()) continue;
        if (['macroscopy', 'microscopy', 'diagnosis'].includes(key)) next[key] = value;
        else next.resultDetails[key] = value;
        fields.push(key);
    }
    next.resultDetails._template = { id: template.id, title: template.title, organ, group, fields };
    return next;
}

export function clearAppliedTemplate(form) {
    const next = { ...form, resultDetails: { ...(form.resultDetails || {}) } };
    for (const key of next.resultDetails._template?.fields || []) {
        if (['macroscopy', 'microscopy', 'diagnosis'].includes(key)) next[key] = '';
        else delete next.resultDetails[key];
    }
    delete next.resultDetails._template;
    return next;
}
