# Permisos por sección y acción

`src/services/permissions.js` es el catálogo compartido por navegación, editor de roles y comprobaciones de operaciones. Cada permiso exige `read` en su sección. Los roles nuevos comienzan sin permisos; el administrador integrado conserva acceso completo. Las acciones desconocidas y los valores que no sean booleanos se rechazan. El antiguo `write` solo migra a crear/editar, nunca a validar o firmar.

- **Roles y permisos** permite editar las acciones de cada perfil y buscar una sección.
- **Usuarios** asigna perfiles y activa/desactiva cuentas existentes. En Supabase no crea usuarios Auth desde el navegador.
- **Plantillas** tiene acceso propio, sin conceder configuración general. Usar, importar y asignar grupos son permisos independientes.
- Guardar un caso conserva un borrador. Validar, firmar/liberar, reabrir e imprimir son acciones distintas. Reabrir elimina los datos de validación/liberación. El identificador de firma existente sigue siendo un registro interno; no se añadió infraestructura de firma criptográfica.

## Persistencia y controles

En Supabase, `profiles.permission_role_id` apunta a `app_roles`. Los perfiles existentes conservan sus roles mediante la correspondencia de `profiles.role`. El acceso inicial sigue exigiendo un perfil activo aprobado; los metadatos editables de Auth nunca autorizan.

`private.has_permission` consulta la identidad de `auth.uid()` y los permisos actuales. El RPC público es SECURITY INVOKER. Las operaciones de la aplicación consultan el RPC antes de escribir, por lo que revocar un permiso bloquea la siguiente operación aunque la interfaz todavía tenga datos en memoria. La interfaz actualiza el rol al volver a la ventana.

RLS controla SELECT/INSERT/UPDATE/DELETE de los catálogos existentes (`centers`, `doctors`, `organs`, `exams`) y la gestión de roles/usuarios. Los triggers de `profiles` comprueban cada columna, protegen la asignación administrativa y el último administrador activo. Los de `lab_info` distinguen importar plantillas, asociar grupos y modificar configuración. `permission_audit_log` registra cambios de autorización y solo puede leerse con `audit.read`; los clientes no pueden modificarlo.

`permission_catalog` no tiene acceso directo para clientes: RLS activado y todos los grants revocados. Su lectura interna requiere las funciones privadas con search_path fijo. Es intencional que el asesor informe una tabla con RLS sin política de acceso.

**Alcance del backend:** al implementar este cambio el proyecto Supabase todavía no tiene la tabla `cases` ni los demás modelos clínicos de estudios. El directorio `patients` ya dispone de persistencia y RLS por acción, verificados en la corrección del registro rápido. Los permisos de esas secciones se comprueban en las operaciones de la aplicación y en los modos locales, pero el flujo clínico completo no puede probarse contra Supabase hasta habilitar su esquema. Antes de exponer esas tablas, deben tener RLS y controles equivalentes de transición y de contenido; el RPC previo no sustituye esos controles de servidor.

Los modos DEMO/PROD locales sirven como simulación y no constituyen una frontera de seguridad frente a alguien con acceso al almacenamiento del navegador.

## Validación

- `node --test tests/*.test.js`
- `npm run build`
- `tests/sql/granular-permissions.sql`: pruebas de acceso permitido/denegado y escalamiento con usuarios sintéticos; siempre terminan en ROLLBACK. Ejecutar mediante la conexión administrativa de pruebas contra el proyecto correcto.
- `npm run lint` tiene un bloqueo previo: el repositorio no incluye configuración ESLint. Se ejecutaron controles focalizados de variables no definidas, claves duplicadas y código inalcanzable sobre los archivos modificados.

No se cambiaron asignaciones de usuarios reales durante la implementación.

## Admisión de registros

Cada alta de Auth crea un perfil `viewer` inactivo, sin rol asignado. La migración recupera registros anteriores que no tenían perfil y preserva todos los perfiles existentes. Los metadatos del registro solo aportan el nombre visible; nunca autorizan.

En **Usuarios → Pendientes de admisión**, el administrador comprueba el correo y selecciona un rol antes de pulsar **Admitir y asignar rol**. El RPC comprueba en el servidor `users.assignRole` y `users.deactivate`, el correo confirmado y el rol activo, y activa el perfil de forma atómica. Solo un administrador del sistema puede admitir a otro administrador. Los cambios quedan auditados. Una cuenta inactiva ya admitida se distingue de una cuenta pendiente.

El directorio muestra correos y su confirmación mediante funciones privadas que solo devuelven campos de directorio. Los usuarios con `users.read` ven el listado; los demás únicamente su propio registro. El esquema Auth y sus credenciales no se exponen. **Actualizar** refresca el listado sin recargar la página.

`tests/sql/user-admission.sql` verifica el registro pendiente, el rechazo de auto-admisión y de correos sin confirmar, la elección explícita del rol y la auditoría. Todas las pruebas de admisión se revierten; no se concedieron permisos a usuarios reales durante esta corrección.
