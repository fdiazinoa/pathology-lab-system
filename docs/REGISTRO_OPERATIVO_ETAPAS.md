# Registro operativo de etapas

El flujo optativo registra tres acciones por cada una de las ocho etapas del laboratorio: **Registrar entrada → Iniciar → Finalizar**. Cada acción se guarda inmediatamente, separada del borrador clínico. Actualizar la etapa no descarta el texto que el usuario esté editando.

## Activación gradual

1. Aplicar `supabase/migrations/20261021002818_operational_stage_events.sql` al desplegar el cambio en Supabase.
2. En **Configuración → General → Flujo de Trabajo y Equipos**, activar **Registro operativo de etapas** y guardar. Esta opción activa también la trazabilidad interna.
3. En un caso guardado, abrir **Registrar estación de trabajo** y registrar el código y nombre reales del puesto. No se crean estaciones ficticias ni se conserva el identificador de ejemplo `Station-01` en los eventos nuevos.
4. Seleccionar **Estación de esta terminal**. La selección se recuerda en ese navegador, separada para cada modo del sistema. El catálogo se comparte entre usuarios en Supabase.
5. Registrar entrada, inicio y finalización en orden. Si se exige QR, cada acción verifica el QR del caso o de un bloque guardado que le pertenezca.

`enableOperationalWorkflow` está desactivado por defecto. Sin activarlo se mantiene el flujo anterior y no se consultan las tablas nuevas. Desactivarlo no elimina los eventos registrados. No se aplica la migración automáticamente desde el navegador.

## Datos y permisos

- **Entrada:** hora, usuario que recibe y estación.
- **Inicio:** hora y usuario que empieza, que queda como responsable de esa etapa.
- **Finalización:** hora y usuario que termina. Puede ser una persona diferente; el responsable original no se sustituye.
- Se conservan el ID del actor y una copia de su nombre, el ID/código/nombre de estación y el código verificado. Cuando se escanea un bloque se guardan sus referencias de bloque y espécimen.
- Consultar requiere `cases.read` y `processing.read`; registrar acciones requiere `cases.read` y `processing.edit`.
- Registrar estaciones requiere `system.edit`; activar o desactivar el flujo requiere `settings.edit`. El administrador puede conceder `processing.edit` a los roles que deban registrar acciones.

En Supabase, `case_stage_events` es de solo lectura para clientes. Una función pública con seguridad de invocador llama a una función privada que valida identidad, permisos actuales, opción de activación, caso, QR, estación y secuencia. Las horas proceden del servidor y los actores de la sesión y perfil aprobados; el cliente no envía actor ni fecha.

El bloqueo de la fila del caso serializa operaciones concurrentes. Se admite un evento por tipo de acción y etapa. Un intento duplicado o fuera de orden se rechaza y puede consultarse el estado con **Actualizar registro**. Inicio y finalización deben utilizar la estación de la entrada.

Con el flujo activo, el mapa deja de permitir arrastrar casos: la etapa cambia mediante el registro operativo. El servidor también rechaza cambios directos de etapa o de trazabilidad antigua mediante una actualización genérica del caso. Un caso cerrado requiere reapertura antes de registrar acciones. Completar la última etapa operativa **no valida, firma ni libera el informe**; esas operaciones mantienen sus permisos independientes.

Los eventos no se borran al editar un borrador. La relación de integridad impide borrar un caso con eventos: debe conservarse su historial. Las estaciones y los eventos guardan referencias estables; este cambio incorpora creación de estaciones, sin interfaz de edición o eliminación.

## Compatibilidad y alcance

Las etapas que ya estaban completadas se muestran como históricas y permiten continuar. No se inventan fechas de entrada o inicio, responsables nuevos ni estaciones para esos registros. Las acciones nuevas no reescriben esa trazabilidad histórica.

Se registra un ciclo por etapa y caso. Reprocesos, correcciones del historial y reasignaciones dentro de una etapa necesitan un flujo específico posterior; no se sobrescriben los eventos para representarlos. Las colas por estación, métricas TAT y sus alertas quedan para cambios posteriores.

Los modos DEMO y PROD local conservan estaciones y eventos bajo sus respectivos prefijos `app_workflow_*` y `prod_workflow_*`, separados de los campos clínicos, con hora local del dispositivo. Al recargar, la etapa local se deriva de esos eventos. Cuando el navegador dispone de Web Locks se serializan las acciones locales del mismo caso. El modo local no constituye una auditoría de servidor.

Para respaldar el historial de Supabase deben incluirse `workflow_stations` y `case_stage_events` en la copia de base de datos. El exportador/restaurador genérico existente y el migrador entre modos no importan este historial inmutable; en modo local también deben preservarse las claves `*_workflow_*`. No se borran ni se trasladan historiales automáticamente al cambiar de modo.

## Validación

- Pruebas Node: ciclo, secuencia, duplicados, QR ajenos, estaciones, permisos revocados, opción desactivada, casos cerrados, conservación del editor y compatibilidad histórica.
- `tests/sql/operational-stage-events.sql`: ejecutar tras las migraciones en una base de prueba con un administrador aprobado; la transacción se revierte. Comprueba las ocho etapas, horas/actores/estaciones, restricciones, RLS, permisos y bloqueo de escritura directa, sin validar el informe.
- Smoke en navegador con SDK Supabase, PostgREST y PostgreSQL locales y autenticación sintética; prueba de dos conexiones concurrentes. Smoke adicional en ambos modos locales y regresión del flujo anterior con la opción apagada.
- El lector físico, la impresora y los nombres reales de estaciones se validan en el laboratorio antes de activar la opción en operación.
