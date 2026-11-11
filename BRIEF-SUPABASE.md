# BRIEF — Configuración de Supabase (sesión aparte)

> Este brief es para una **segunda sesión** que corre en paralelo a la que construye la app (`BRIEF.md`). Su trabajo es dejar el backend listo y verificado. Va pidiéndole datos al usuario en su propio chat, así la otra sesión no se interrumpe.
> **Modelo recomendado: Sonnet** (es trabajo mecánico y acotado).

## 1. Objetivo

Dejar listo en Supabase: base de datos con el modelo de `BRIEF.md` §3, seguridad por filas (RLS), almacenamiento privado de fotos, autenticación de las dos cuentas con el registro público cerrado, y un archivo `.env.local` con las variables públicas para el frontend. Todo con migraciones versionadas y probado.

## 2. Reglas de oro sobre secretos (leelas antes de hacer nada)

- **Nunca leas, imprimas ni muestres** el contenido de `.env.secrets` ni de `.env.local`. No uses `cat`, `Read`, `echo $VAR`, `printenv`, `env` ni nada que vuelque su contenido a la conversación. Si un comando falla y su salida podría incluir un secreto, no la pegues completa.
- El usuario crea `.env.secrets` (ya está en `.gitignore`) con lo que le pidas. Vos **usás** esos valores sin verlos:
  `set -a; . ./.env.secrets; set +a; supabase <comando>`
- Lo que genere el sistema (contraseña de la base, claves de API) lo escribís **directo al archivo**, sin mostrarlo. Ejemplo para una contraseña: `printf 'SUPABASE_DB_PASSWORD=%s\n' "$(openssl rand -base64 24 | tr -d '/+=')" >> .env.secrets`. Para extraer una clave de la CLI, redirigí la salida a un archivo o filtrala con `jq` hacia el archivo, sin pasarla por pantalla.
- Separación estricta:
  - `.env.secrets` → token de acceso, contraseña de la base, `service_role`. **Nunca sale de la compu del usuario.**
  - `.env.local` → solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Es lo único que consume la app.
- La clave `service_role` y el token de acceso **jamás** van al frontend, al repo, a un workflow ni a un mensaje.
- El `project ref` y la URL del proyecto no son secretos: podés mostrarlos.
- Al terminar, **recordale al usuario revocar el token de acceso personal** (se puede generar otro cuando haga falta).

## 3. Cómo trabajar

1. Leé `CLAUDE.md`, `BRIEF.md` (§1, §3, §7) y `PROGRESS.md`.
2. Trabajá en un *worktree* aparte para no pisar a la otra sesión:
   `git worktree add ../registro-comidas-supabase -b infra/supabase`
   Solo tocás `supabase/`, `docs/SETUP_SUPABASE.md` y, si hace falta, `.env.example`. **Nada de `src/`.**
3. Commits chicos; un PR a `main` al final (el usuario lo mergea). No pushees a `main`.
4. Antes de actuar, mandá **un solo mensaje** al usuario con todo lo que necesitás de él (ver §4), así después seguís de corrido.

## 4. Lo que le pedís al usuario (en un solo mensaje)

- Que genere un **token de acceso personal** de Supabase y lo guarde en `.env.secrets` como `SUPABASE_ACCESS_TOKEN=...` (le indicás la ruta exacta y que no lo pegue en el chat).
- **Qué proyecto usar** — **CONSULTAR**: la cuenta gratuita permite 2 proyectos activos y el usuario ya usa 1. Opciones: (a) crear el segundo proyecto, o (b) usar un *schema* separado dentro del proyecto existente (mezcla dos apps en un proyecto). Antes de crear nada, listá los proyectos existentes (`supabase projects list`) para confirmar cuántos hay.
- Si crea el proyecto: nombre, **región** (la más cercana a Argentina que ofrezca la cuenta; ofrecé las opciones que lista la CLI) y organización.
- Los **emails de las dos cuentas** que van a entrar.
- Qué prefiere para el primer acceso: **invitación por email** (cada persona define su contraseña desde el link; **recomendado**, no hay contraseñas en el chat) o contraseñas temporales generadas y guardadas en `.env.secrets`.

## 5. Tareas

1. **Proyecto:** crearlo (o seleccionar el existente) con la CLI. Anotar `project ref` en `docs/SETUP_SUPABASE.md`. Verificar con la documentación oficial vigente los comandos y flags; la CLI cambia.
2. **Migraciones** en `supabase/migrations/` desde el modelo de `BRIEF.md` §3:
   - Tablas: `notebooks`, `notebook_members`, `places`, `items`, `visits`, `tastings`, `place_photos`. Todas con `notebook_id` (o derivable) para la seguridad.
   - Restricciones: `rating` entre 1 y 10, `quantity` ≥ 1, `price_total` ≥ 0, `status` en (`visited`,`wishlist`), `kind` en (`menu`,`general`). Índices por `place_id`, `item_id`, `visit_id`, fecha y categoría.
   - `created_by` con valor por defecto `auth.uid()`.
3. **RLS en todas las tablas:** un usuario solo ve y modifica filas de libretas de las que es miembro. Función auxiliar `is_member(notebook_id)` (`security definer`, con `search_path` fijado).
4. **Storage:** bucket **privado** `photos`, con rutas `<notebook_id>/<place_id>/<archivo>` y políticas por pertenencia a la libreta. El frontend usa URLs firmadas.
5. **Auth:** crear o invitar a las dos cuentas, crear la libreta y asociar a ambas como miembros (script en `supabase/` reproducible, que no deje datos sensibles en el repo). **Cerrar el registro público** (verificar en la documentación vigente cómo se hace por CLI o Management API) y confirmar que quedó cerrado.
6. **Seed de desarrollo** en `supabase/seed.sql`, marcado "solo desarrollo", con los datos de `BRIEF.md` §9. No se aplica a producción salvo que el usuario lo pida.
7. **Pruebas de RLS** (script reproducible): con una cuenta temporal que **no** sea miembro, comprobar que no puede leer ni escribir en ninguna tabla ni en el bucket; con una cuenta miembro, que sí. Borrar la cuenta temporal al terminar. Mostrar el resultado de cada prueba.
8. **`.env.local`:** escribir las dos variables públicas y copiarlo a la carpeta principal del repo (`cp`, sin mostrar el contenido; el usuario te da la ruta si no la sabés).
9. **`docs/SETUP_SUPABASE.md`:** estado (qué quedó hecho y verificado), `project ref`, cómo aplicar migraciones, cómo agregar una persona a la libreta (para sumar amigos más adelante), cómo rotar claves, y la línea **"LISTO PARA H3"** cuando todo esté verificado.
10. Actualizá `PROGRESS.md` (sección "Estado de la sesión de Supabase").

## 6. Límites y consultas

- **CONSULTAR** antes de: crear o borrar un proyecto, borrar datos, cualquier cambio que cueste dinero, aplicar el seed en producción, o cualquier acción irreversible.
- No uses `supabase db reset` contra el proyecto remoto.
- Si el modelo de `BRIEF.md` §3 necesita cambios, o la otra sesión pidió un cambio en `PROGRESS.md` ("Pedidos a la sesión de Supabase"), anotalo y hacelo en una migración nueva; nunca edites una migración ya aplicada.
- Si algo no se puede automatizar, **no bloquees**: documentá en `docs/SETUP_SUPABASE.md` los pasos manuales exactos y seguí con el resto.

## 7. Entrega final

Reportá: qué quedó hecho y verificado (con el resultado de las pruebas de RLS), qué quedó pendiente o manual, el `project ref`, qué le toca hacer al usuario (revocar el token, mergear el PR, avisar a la otra sesión) y cualquier decisión que tomaste.
