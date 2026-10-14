# Maestro de órganos y lugares anatómicos

El CSV proporcionado tiene 925 filas con columnas IDlugar_anat, IDseccion y descripcion. Se conservan las filas repetidas: algunos códigos y nombres originales no son únicos.

El consecutivo usa la identidad de PostgreSQL y un código generado ORG-0001 … ORG-0925. La secuencia quedó en 925; una nueva localización recibirá ORG-0926. El código crece sin truncarse al superar cuatro dígitos.

Procedimientos: B → Biopsia (917), C y CT → Citología (4), L → Líquido (4). CT se clasificó como Citología por confirmación explícita del usuario. Se preservan original_code, section_code y el registro original completo en source_record.

Conversor sin conexión a base:

```sh
python3 scripts/organs_csv_to_sql.py /ruta/lugares.csv /tmp/organos-import.sql
```

La primera importación asigna IDs por posición original del archivo y ajusta la secuencia. Reejecutar el mismo archivo y orden actualiza por ID. No usar este conversor para agregar un archivo distinto o reordenado a un maestro ya existente: debe reconciliarse primero. No elimina localizaciones fuera del archivo.

Migración e importación aplicadas en Patología. Se compararon los 925 registros y campos importados: cero diferencias. RLS exige perfil activo autorizado para lectura y admin para modificar. La pantalla muestra procedimiento y código, permite buscar y filtrar por procedimiento. Su carga no depende de que estén listas las tablas clínicas.
