"""Generate a guarded catalog import without storing clinical text in the repository."""
import csv
import hashlib
import json
import sys


def load_results(path):
    with open(path, encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        required = {'IDseccion', 'IDresultado', 'Resultado', 'Descripcion'}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError('Columnas del CSV incorrectas')
        result = []
        for number, row in enumerate(reader, 1):
            group = row['IDseccion'].strip()
            if group not in {'B', 'C', 'L', 'CT', 'HPV'} or not row['IDresultado'].strip() or not row['Resultado'].strip():
                raise ValueError(f'Registro {number}: sección, código o resultado inválido')
            result.append(dict(id=f'{group}:{number}', group=group, code=row['IDresultado'],
                               result=row['Resultado'], description=row['Descripcion']))
        if not result:
            raise ValueError('El CSV no contiene plantillas')
        return result


def import_sql(rows):
    payload = json.dumps(rows, ensure_ascii=False, separators=(',', ':'))
    tag = '$catalog_' + hashlib.sha256(payload.encode()).hexdigest()[:16] + '$'
    while tag in payload:
        tag = tag[:-1] + 'x$'
    escaped = payload.replace("'", "''")
    return f"""do {tag}
declare catalog jsonb := '{escaped}'::jsonb;
begin
    if (select count(*) from public.lab_info) <> 1 then
        raise exception 'Se requiere una única configuración de laboratorio';
    end if;
    if exists (select 1 from public.lab_info where
        jsonb_array_length(coalesce(settings->'resultTemplates','[]'::jsonb)) > 0
        and settings->'resultTemplates' <> catalog) then
        raise exception 'Ya existe un catálogo diferente; no se reemplazará automáticamente';
    end if;
    update public.lab_info set settings=jsonb_set(settings,'{{resultTemplates}}',catalog), updated_at=now();
end {tag};
select jsonb_array_length(settings->'resultTemplates') as imported_templates from public.lab_info;
"""


if __name__ == '__main__':
    print(import_sql(load_results(sys.argv[1])))
