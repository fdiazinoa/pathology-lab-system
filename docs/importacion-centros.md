# Maestro de centros

La tabla `public.centers` conserva el ID_CENTRO como clave textual (no se agrupan nombres iguales). Campos: NOMBRE_CENTRO → name, DIRECCION → address, RUTA_PRINCIPAL → main_route, UBICACION_GPS → gps_location, TELEFONO → phone. Las coordenadas se conservan y generan adicionalmente un enlace Maps en location. Se eliminan únicamente espacios en extremos; teléfonos y direcciones no se corrigen ni completan.

El conversor valida columnas, IDs únicos y nombres no vacíos antes de generar SQL. No conecta ni escribe directamente a una base:

```sh
python3 scripts/centers_csv_to_sql.py /ruta/centros.csv /tmp/centros-import.sql
```

Revisar el SQL y ejecutarlo en la base elegida. Reimportar usa ON CONFLICT por ID; actualiza los datos de esos IDs y conserva su estado activo/inactivo. No elimina centros fuera del archivo.

La migración centers_master fue aplicada al proyecto Patología y se importaron 136 filas del maestro proporcionado. Se compararon todos los campos: cero diferencias. La lectura exige perfil activo autorizado y las modificaciones requieren admin mediante RLS.

La aplicación carga centros antes que los otros catálogos, para que la falta del esquema clínico pendiente no oculte este maestro. En recepción, Producción usa exclusivamente el maestro y muestra el ID para distinguir nombres iguales; Demo conserva su directorio inicial.
