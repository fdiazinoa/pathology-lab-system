# Maestro de médicos

Importación por ID_MEDICO (408 IDs únicos). ID_LIS se conserva como referencia y admite repeticiones; no es exequátur. No se inventan licencias ni firmas, ni se crean usuarios o perfiles de autenticación.

`doctors` contiene los campos operativos: nombre, especialidad, LIS, centro, ruta, estado y contactos. `doctor_master_details` conserva las 15 columnas originales como JSON, incluyendo saldo pendiente, categoría, fecha y creador. Esta tabla solo es legible por administradores activos. Los demás campos requieren perfil activo autorizado; modificaciones exigen admin.

El estado original se conserva. Solo INACTIVO marca is_active=false; ACTIVO, POTENCIAL, SEGUIMIENTO y estado vacío no se reclasifican. Los tres INACTIVO se excluyen de selección para casos, pero siguen en el maestro. Las fechas y saldos no se reinterpretan: se preservan exactamente en el registro original.

La referencia C111 de una fila no existe en el maestro de centros. source_center_id conserva C111 y center_id queda nulo hasta completar ese centro. No se creó un centro inventado. Los otros 407 vínculos se resolvieron.

El conversor genera SQL sin conexión a una base:

```sh
python3 scripts/doctors_csv_to_sql.py /ruta/medicos.csv /tmp/medicos-import.sql
```

Validar y ejecutar el SQL en la base elegida. Cada importación actualiza por ID y conserva licencias/firmas existentes. No elimina médicos fuera del archivo. La importación puede ejecutarse en lotes; cada lote es transaccional y puede reintentarse por ID.

Migración doctors_master e importación ya aplicadas en Patología. Se verificaron 408 registros originales contra el CSV: cero diferencias. El listado cloud se carga aunque falten las tablas clínicas restantes.
