// Reorganize a private catalog export; clinical text is never checked into Git.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { structureTemplate } from '../src/services/structuredResultTemplates.js';

const catalog = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (!Array.isArray(catalog) || !catalog.length) throw new Error('Catálogo vacío o inválido.');
const organized = catalog.map(structureTemplate);
if (!organized.every((item, index) => item.result === catalog[index].result && item.description === catalog[index].description && item.code === catalog[index].code)) {
    throw new Error('La estructuración debe conservar el texto y código originales.');
}
const fingerprint = createHash('md5').update(catalog.map(item => [item.id, item.group, item.code, item.result, item.description || ''].join('\u001f')).join('\u001e')).digest('hex');
const patches = Object.fromEntries(organized.map(item => [item.id, { title: item.title, sections: item.sections, structureVersion: item.structureVersion }]));
if (Object.keys(patches).length !== catalog.length) throw new Error('Los identificadores de plantilla deben ser únicos.');
const patchJSON = JSON.stringify(patches);
let tag = `$organize_${fingerprint}$`;
while (patchJSON.includes(tag)) tag = `${tag.slice(0, -1)}x$`;
const literal = text => `'${text.replaceAll("'", "''")}'::jsonb`;
const sql = `do ${tag}
declare patches jsonb := ${literal(patchJSON)};
begin
    if (select count(*) from public.lab_info) <> 1 or
       (select md5(string_agg(concat_ws(chr(31),item->>'id',item->>'group',item->>'code',item->>'result',coalesce(item->>'description','')),chr(30) order by ordinal))
        from public.lab_info l cross join lateral jsonb_array_elements(l.settings->'resultTemplates') with ordinality as t(item,ordinal)) is distinct from '${fingerprint}' then
        raise exception 'El catálogo cambió; no se reemplazará automáticamente';
    end if;
    update public.lab_info l set settings=jsonb_set(settings,'{resultTemplates}',
        (select jsonb_agg(item || (patches->(item->>'id')) order by ordinal)
         from jsonb_array_elements(l.settings->'resultTemplates') with ordinality as t(item,ordinal))),updated_at=now();
    update public.exams set name='Citología' where code='C' and name='Citología (sección C)';
    update public.exams set name='Citología en base líquida' where code='L' and name='Citología (sección L)';
end ${tag};
select jsonb_array_length(settings->'resultTemplates') as organized_templates from public.lab_info;
`;
fs.writeFileSync(process.argv[3], sql);
console.log(JSON.stringify({ templates: organized.length, groups: Object.fromEntries(['B', 'C', 'L', 'CT', 'HPV'].map(group => [group, organized.filter(t => t.group === group).length])) }));
