# Registro rápido y corrección desde Recepción

Causas corregidas: la tabla `patients` no existía en el proyecto Supabase; Recepción cerraba el modal y seleccionaba un ID temporal sin esperar el resultado de `addPatient`; el proveedor no guardaba edad/cédula en todos los flujos; y la carga inicial descartaba pacientes si fallaba un módulo clínico distinto.

El registro rápido espera confirmación del servidor, selecciona el UUID persistido y mantiene el formulario abierto con sus datos si falla. El directorio se carga antes que los estudios para que sobreviva a errores de módulos independientes. El modal no presenta botones de confirmación sin guardado asociado.

Después de elegir un paciente, **Editar datos del paciente** abre sus generales dentro de Recepción. Se pueden corregir nombre, edad o nacimiento, sexo, documento, teléfono, ciudad, provincia y antecedentes. El ID se conserva y los cambios se reflejan en el directorio y la selección actual. Editar edad elimina una fecha de nacimiento anterior para no conservar datos contradictorios; elegir fecha calcula la edad. La fecha es opcional y no se inventa a partir de la edad.

Los documentos se verifican en cliente y mediante un índice único normalizado en la BD. Menores sin documento reciben una referencia UUID única. Los nombres/campos canónicos del proveedor se traducen a los alias usados por las pantallas; los campos opcionales pueden vaciarse explícitamente sin sustituirse por valores antiguos.

La tabla tiene RLS por `patients.read/create/edit`. Los clientes no pueden borrar pacientes ni cambiar su identidad/origen. Las correcciones registran actor y nombres de campos modificados, sin duplicar valores personales o clínicos en el log. Solo `audit.read` permite leer esa trazabilidad.

**Límite existente:** el esquema de casos/muestras todavía no está habilitado. Recepción ahora espera también el guardado de la muestra y muestra el error si no puede persistirla; no ofrece una etiqueta de éxito para una muestra inexistente. Un paciente ya guardado no se pierde si el paso de registrar la muestra falla.

Validación: pruebas Node del contrato de datos, correcciones, duplicados, edad/nacimiento y mensajes de error; `tests/sql/patient-directory.sql` verifica creación/edición, permisos y restricciones dentro de una transacción con ROLLBACK; build y lint focalizado.

## Continuar el estudio recibido

La migración `20261015192502_reception_case_continuation.sql` habilita `cases` y su auditoría inmutable; sustituye el límite de casos indicado arriba. El número de caso lo genera la BD y el UUID permanece como identidad interna. Se conservan médico, centro, muestra, fecha de recolección, prioridad, cobertura, póliza y observaciones en `metadata.report`. Se cargan casos antes de módulos independientes y por páginas para evitar truncar el catálogo en 1.000 filas.

Nuevo caso permite buscar pacientes por nombre o documento mostrando sus generales, sin UUID visible. Al elegir un paciente con una sola recepción pendiente abre ese caso para editar; con varias, permite elegir entre sus recepciones pendientes ordenadas por fecha. La bandeja **Recepciones pendientes** permite buscar también por caso, fecha, muestra o médico, con 20 filas por página. Cancelar la bandeja no crea registros; guardar un nuevo caso con recepciones pendientes vuelve a pedir selección para evitar duplicados. Otra muestra se registra desde Recepción.

Continuar conserva la identidad y los datos de la recepción; al guardar pasa de `pending` a `in_progress` y deja la bandeja. Nunca se reutilizan casos finalizados, cancelados o con contenido diagnóstico. El examen solo se asigna automáticamente si el catálogo tiene una coincidencia exacta y única; los tipos generales o ambiguos requieren elegir el examen correcto. Los permisos de casos, recepción, cada sección clínica y las transiciones de informe se verifican también en BD. Los UUID y el paciente de un caso recibido están protegidos; su auditoría de servidor no guarda una copia del contenido clínico.
