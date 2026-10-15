# Grupos anatómicos del catálogo

El catálogo conserva sus 925 registros y todos sus identificadores, nombres, códigos, procedimientos, estado y datos de origen. `anatomical_group` es independiente de `procedure_type`: no sustituye Biopsia, Citología o Líquido ni modifica el filtro clínico de plantillas.

| Grupo | Registros iniciales |
|---|---:|
| Ginecológicas | 98 |
| Gastrointestinal | 129 |
| Urogenital | 72 |
| Glándulas Mamarias | 22 |
| Piel y Partes Blandas | 29 |
| Patología Quirúrgica | 575 |

283 registros genéricos, mixtos o sin tejido/especialidad identificable se mantienen en Patología Quirúrgica con `classification_review_required=true`. No se infiere, por ejemplo, que «LABIO ANTERIOR» sea cuello uterino, que «CÁPSULA PERIPROTÉSICA» sea mama o que una región de una extremidad corresponda a piel. El grupo por sí solo no debe autorizar diagnósticos, plantillas ni rutas clínicas de esos registros.

En **Órganos**, filtrar por grupo o por **Solo pendientes de revisión**. Al editar se puede elegir un grupo y conservar/quitar explícitamente la marca de revisión. Las escrituras conservan los permisos existentes `organs.create`/`organs.edit`; no se ampliaron políticas RLS.

La migración contiene el mapeo explícito de los registros originales y verifica nombre + ID antes de actualizar. Dentro de la misma transacción compara el hash de todas las columnas originales para abortar si se altera alguna. Nuevos registros de clientes antiguos tienen grupo general y revisión pendiente por defecto; el formulario actualizado exige seleccionar un grupo.

`node scripts/classify-organ-groups.mjs <fuente.json> <revision.json>` genera una propuesta revisable a partir de un array de objetos con `id` y `name`. No escribe en la BD. La migración es la clasificación aplicada; el clasificador no se ejecuta automáticamente al editar un órgano.

Validación: 35 pruebas Node, build y lint focalizado; consulta de seis grupos, 925 IDs únicos y ningún grupo vacío. Se mantienen los avisos previos de los asesores de Supabase documentados en PERMISSIONS.md, sin nuevos hallazgos en esta tarea.
