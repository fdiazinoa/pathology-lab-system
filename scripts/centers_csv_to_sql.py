"""Validate a centers master and emit an idempotent SQL import; does not connect to a database."""
import argparse
import csv
import json
import re

COLUMNS = ['ID_CENTRO', 'NOMBRE_CENTRO', 'DIRECCION', 'RUTA_PRINCIPAL', 'UBICACION_GPS', 'TELEFONO']

def load_centers(path):
    with open(path, encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        if reader.fieldnames != COLUMNS:
            raise ValueError('Columnas del CSV incorrectas')
        rows = list(reader)
    seen = set()
    result = []
    for number, row in enumerate(rows, start=2):
        if None in row or any(value is None for value in row.values()):
            raise ValueError(f'Fila {number}: cantidad de columnas incorrecta')
        center_id, name = row['ID_CENTRO'].strip(), row['NOMBRE_CENTRO'].strip()
        if not center_id or not name or center_id in seen:
            raise ValueError(f'Fila {number}: ID duplicado o ID/nombre vacío')
        seen.add(center_id)
        gps = row['UBICACION_GPS'].strip()
        location = 'https://www.google.com/maps?q=' + gps.replace(' ', '') if re.fullmatch(r'-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?', gps) else None
        result.append(dict(id=center_id, name=name, address=row['DIRECCION'].strip() or None,
                           main_route=row['RUTA_PRINCIPAL'].strip() or None, gps_location=gps or None,
                           location=location, phone=row['TELEFONO'].strip() or None))
    if not result:
        raise ValueError('El CSV no contiene centros')
    return result

def import_sql(rows):
    payload = json.dumps(rows, ensure_ascii=False).replace("'", "''")
    return """insert into public.centers (id,name,address,main_route,gps_location,location,phone)
select id,name,address,main_route,gps_location,location,phone
from jsonb_to_recordset('%s'::jsonb) as r(id text,name text,address text,main_route text,gps_location text,location text,phone text)
on conflict (id) do update set name=excluded.name,address=excluded.address,main_route=excluded.main_route,
gps_location=excluded.gps_location,location=excluded.location,phone=excluded.phone;
""" % payload

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_file')
    parser.add_argument('output_sql')
    args = parser.parse_args()
    centers = load_centers(args.csv_file)
    with open(args.output_sql, 'w', encoding='utf-8') as destination:
        destination.write(import_sql(centers))
    print(f'{len(centers)} centros validados; SQL guardado en {args.output_sql}')
