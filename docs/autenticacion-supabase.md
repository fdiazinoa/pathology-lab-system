# Registro y Google del laboratorio

El registro utiliza Supabase Auth. Confirmar el correo o entrar por Google no asigna rol: debe existir un perfil autorizado en `public.profiles`. El código lee el rol del registro en la base, nunca de user_metadata. Los roles compatibles son administrador/admin, patólogo/pathologist, técnico/technician y repartidor/courier. Una cuenta sin perfil o con estado inactivo no entra al dashboard.

## Configuración pendiente del proyecto Patología

Proyecto: sxpowmwgxorkjnartswe. Al revisar el 14 de octubre de 2026, Google estaba deshabilitado y el esquema public no tenía tablas. No se debe activar operación clínica sin inicializar el esquema del laboratorio y las políticas RLS. Este PR no ejecuta el esquema completo ni asigna administradores automáticamente.

1. Google Cloud → Google Auth Platform → Clients. Localizar el cliente `59779272886-hckkd4r3simics37ps6iaaeglf58gbeg.apps.googleusercontent.com`. Recuperar o generar el Client Secret. Nunca ponerlo en una variable VITE ni en el repositorio.
2. Añadir el URI de retorno autorizado `https://sxpowmwgxorkjnartswe.supabase.co/auth/v1/callback` al cliente de Google.
3. Supabase → Authentication → Sign In / Providers → Google: activar y guardar Client ID y Client Secret.
4. Supabase → Authentication → URL Configuration: Site URL `https://pathology-lab-system-lac.vercel.app`. Autorizar `https://pathology-lab-system-lac.vercel.app/auth/callback`; añadir localhost y previews específicos solo para pruebas.
5. Inicializar el esquema revisado del laboratorio y crear perfiles autorizados para usuarios confirmados. No asignar un rol automáticamente por dominio o correo.
6. Probar registro con correo propio, confirmación, retorno Google, rechazo de una cuenta sin perfil y entrada de un usuario autorizado.

El retorno autorizado cambia ese navegador a SUPABASE; no mezcla una identidad cloud con pacientes Demo/locales. La autorización de datos también debe aplicarse en las políticas RLS de las tablas clínicas. El control del frontend por sí solo no sustituye esas políticas.

Fuentes: https://supabase.com/docs/guides/auth/social-login/auth-google y https://supabase.com/docs/reference/javascript/auth-signup

## Tabla de autorización inicializada

La migración `authorized_profiles` crea `public.profiles` con RLS, lectura solo del perfil propio y sin permisos de INSERT/UPDATE/DELETE para clientes autenticados. El rol no tiene valor predeterminado y `is_active` comienza en false. El alta de un perfil y la aprobación se realizan por una conexión administrativa confiable; el frontend no puede autoasignarse roles. La autorización inicial de la cuenta confirmada se realizó separadamente, sin datos específicos de usuarios en la migración.

La inicialización clínica continúa pendiente. No ejecutar sin revisión las políticas antiguas de `supabase_schema.sql`: permiten actualizar el propio rol y conceden acceso clínico por autenticación sin comprobar perfiles autorizados. La migración de perfiles no instala esas políticas ni crea tablas clínicas.
