"""Validate doctor master data and emit import SQL without connecting to a database."""
import csv
import json
import sys

COLUMNS = ['ID_MEDICO', 'ID_LIS', 'NOMBRE_MEDICO', 'ESPECIALIDAD', 'ID_CENTRO', 'RUTA_ASIGNADA', 'ESTATUS_2026', 'CELULAR', 'TELEFONO', 'EMAIL', 'SECRETARIA', 'SALDO_PENDIENTE', 'CATEGORIA', 'FECHA_CREACION', 'CREADO_POR']

def load_doctors(path):
    with open(path, encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        if reader.fieldnames != COLUMNS:
            raise ValueError('Columnas del CSV incorrectas')
        rows = list(reader)
    seen = set()
    for number, row in enumerate(rows, start=2):
        if None in row or any(value is None for value in row.values()):
            raise ValueError(f'Fila {number}: columnas incorrectas')
        key = row['ID_MEDICO'].strip()
        if not key or not row['NOMBRE_MEDICO'].strip() or key in seen:
            raise ValueError(f'Fila {number}: ID duplicado o ID/nombre vacío')
        seen.add(key)
    if not rows:
        raise ValueError('El CSV no contiene médicos')
    return rows

def import_sql(rows):
    payload = json.dumps(rows, ensure_ascii=False).replace("'", "''")
    return """begin;
create temporary table doctor_import on commit drop as
select value as original, trim(value->>'ID_MEDICO') as id from jsonb_array_elements('%s'::jsonb);
insert into public.doctors (id,lis_id,name,specialty,source_center_id,center_id,assigned_route,source_status,is_active,mobile,phone,email,secretary)
select r.id,nullif(trim(original->>'ID_LIS'),''),trim(original->>'NOMBRE_MEDICO'),nullif(trim(original->>'ESPECIALIDAD'),''),
nullif(trim(original->>'ID_CENTRO'),''),c.id,nullif(trim(original->>'RUTA_ASIGNADA'),''),nullif(trim(original->>'ESTATUS_2026'),''),
upper(trim(original->>'ESTATUS_2026')) <> 'INACTIVO',nullif(trim(original->>'CELULAR'),''),nullif(trim(original->>'TELEFONO'),''),
nullif(trim(original->>'EMAIL'),''),nullif(trim(original->>'SECRETARIA'),'') from doctor_import r
left join public.centers c on c.id=trim(original->>'ID_CENTRO')
on conflict (id) do update set lis_id=excluded.lis_id,name=excluded.name,specialty=excluded.specialty,
source_center_id=excluded.source_center_id,center_id=excluded.center_id,assigned_route=excluded.assigned_route,
source_status=excluded.source_status,is_active=excluded.is_active,mobile=excluded.mobile,phone=excluded.phone,email=excluded.email,secretary=excluded.secretary;
insert into public.doctor_master_details(doctor_id,source_record) select id,original from doctor_import
on conflict (doctor_id) do update set source_record=excluded.source_record;
commit;
""" % payload

if __name__ == '__main__':
    rows = load_doctors(sys.argv[1])
    with open(sys.argv[2], 'w', encoding='utf-8') as destination:
        destination.write(import_sql(rows))
    print(f'{len(rows)} médicos validados; SQL generado')
