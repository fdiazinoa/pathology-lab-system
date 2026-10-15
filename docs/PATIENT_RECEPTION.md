# Registro rápido y corrección desde Recepción

Causas corregidas: la tabla `patients` no existía en el proyecto Supabase; Recepción cerraba el modal y seleccionaba un ID temporal sin esperar el resultado de `addPatient`; el proveedor no guardaba edad/cédula en todos los flujos; y la carga inicial descartaba pacientes si fallaba un módulo clínico distinto.

El registro rápido espera confirmación del servidor, selecciona el UUID persistido y mantiene el formulario abierto con sus datos si falla. El directorio se carga antes que los estudios para que sobreviva a errores de módulos independientes. El modal no presenta botones de confirmación sin guardado asociado.

Después de elegir un paciente, **Editar datos del paciente** abre sus generales dentro de Recepción. Se pueden corregir nombre, edad o nacimiento, sexo, documento, teléfono, ciudad, provincia y antecedentes. El ID se conserva y los cambios se reflejan en el directorio y la selección actual. Editar edad elimina una fecha de nacimiento anterior para no conservar datos contradictorios; elegir fecha calcula la edad. La fecha es opcional y no se inventa a partir de la edad.

Los documentos se verifican en cliente y mediante un índice único normalizado en la BD. Menores sin documento reciben una referencia UUID única. Los nombres/campos canónicos del proveedor se traducen a los alias usados por las pantallas; los campos opcionales pueden vaciarse explícitamente sin sustituirse por valores antiguos.

La tabla tiene RLS por `patients.read/create/edit`. Los clientes no pueden borrar pacientes ni cambiar su identidad/origen. Las correcciones registran actor y nombres de campos modificados, sin duplicar valores personales o clínicos en el log. Solo `audit.read` permite leer esa trazabilidad.

**Límite existente:** el esquema de casos/muestras todavía no está habilitado. Recepción ahora espera también el guardado de la muestra y muestra el error si no puede persistirla; no ofrece una etiqueta de éxito para una muestra inexistente. Un paciente ya guardado no se pierde si el paso de registrar la muestra falla.

Validación: pruebas Node del contrato de datos, correcciones, duplicados, edad/nacimiento y mensajes de error; `tests/sql/patient-directory.sql` verifica creación/edición, permisos y restricciones dentro de una transacción con ROLLBACK; build y lint focalizado.
