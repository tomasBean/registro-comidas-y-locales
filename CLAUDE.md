# Libreta de comidas

App personal (PWA) para registrar lugares donde comemos, qué pedimos en cada visita, con puntaje, precio, comentario y foto. Ver `BRIEF.md` (la app) y `BRIEF-SUPABASE.md` (backend, sesión aparte).

## Antes de empezar

1. Leé `PROGRESS.md` primero. Después, solo lo necesario para el siguiente paso.
2. Notas de contexto enlazadas en `docs/context/` (índice en `docs/context/README.md`). Cuando termines una parte, volcá lo importante ahí.

## Convenciones

- Código, identificadores y comentarios en **inglés**; texto visible al usuario en **español rioplatense (es-AR)**.
- Capas: `src/domain` (lógica pura) → `src/data` (repositorios) → `src/features` → `src/ui`. La UI no contiene lógica de negocio ni de datos.
- Un hito = una rama = un PR hacia `main`. No push directo a `main`, no reescribir historia compartida, no mergear PR propios.

## Secretos (regla dura)

- **Nunca leas, imprimas ni muestres** `.env.secrets` ni `.env.local`. Nada de `cat`, `Read`, `echo $VAR`, `printenv`, `env`.
- Para usar valores sin verlos: `set -a; . ./.env.secrets; set +a; <comando>`.
- Solo `.env.example` y `.env.secrets.example` se commitean y son plantillas sin valores.
- El repo se hará público: ninguna clave, token, contraseña ni `service_role` en archivos versionados, workflows ni mensajes de commit.

## Consultar antes de

Crear o borrar recursos externos, gastar dinero, cambiar el modelo de datos, hacer público el repo, o cualquier acción irreversible.
