"""Import anatomical sites in source order; preserves duplicate source codes and names."""
import csv
import json
import sys

PROCEDURES = {'B': 'Biopsia', 'C': 'Citología', 'CT': 'Citología', 'L': 'Líquido'}

def load_organs(path):
    with open(path, encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        if reader.fieldnames != ['IDlugar_anat', 'IDseccion', 'descripcion']:
            raise ValueError('Columnas del CSV incorrectas')
        rows = list(reader)
    result = []
    for number, row in enumerate(rows, start=1):
        if None in row or any(value is None for value in row.values()) or not row['descripcion'].strip():
            raise ValueError(f'Fila {number+1}: campos incorrectos')
        section = row['IDseccion'].strip()
        if section not in PROCEDURES:
            raise ValueError(f'Fila {number+1}: procedimiento desconocido')
        result.append(dict(id=number, name=row['descripcion'].strip(), procedure_type=PROCEDURES[section],
                           original_code=row['IDlugar_anat'].strip(), section_code=section, source_record=row))
    if not result:
        raise ValueError('El CSV no contiene localizaciones')
    return result

def import_sql(rows):
    payload = json.dumps(rows, ensure_ascii=False).replace("'", "''")
    return """insert into public.organs(id,name,procedure_type,original_code,section_code,source_record)
select id,name,procedure_type,original_code,section_code,source_record
from jsonb_to_recordset('%s'::jsonb) as r(id bigint,name text,procedure_type text,original_code text,section_code text,source_record jsonb)
on conflict(id) do update set name=excluded.name,procedure_type=excluded.procedure_type,original_code=excluded.original_code,
section_code=excluded.section_code,source_record=excluded.source_record;
""" % payload

if __name__ == '__main__':
    rows=load_organs(sys.argv[1])
    with open(sys.argv[2], 'w', encoding='utf-8') as destination:
        destination.write(import_sql(rows))
        destination.write("select setval(pg_get_serial_sequence('public.organs','id'), (select max(id) from public.organs), true);\n")
    print(f'{len(rows)} localizaciones validadas; SQL generado')
