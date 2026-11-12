# Despliegue en GitHub Pages

Pasos que le tocan al usuario para publicar la app. El agente no cambia la visibilidad del repo ni la configuración de GitHub.

La app queda en `https://tomasbean.github.io/registro-comidas-y-locales/`.

## Estado

- Workflow de deploy escrito: `.github/workflows/deploy.yml`. Corre al mergear a `main` o a mano. **Nunca corrió todavía**: no existe `main` y Pages no está activado.
- Workflow de CI: `.github/workflows/ci.yml`, en cada PR.
- Hoy la app usa datos de ejemplo en memoria. Hasta que se integre Supabase (hito H3), lo publicado es una demo: los cambios se pierden al recargar.

## 0. Antes de todo: definir la rama principal

La rama `main` no existe. Los PR están apilados sobre `ccr-05e3a17d-dyke5o`. Opciones:

- **A.** Crear `main` desde `ccr-05e3a17d-dyke5o`, marcarla como rama por defecto y cambiar la base del PR #1 a `main`.
- **B.** Renombrar `ccr-05e3a17d-dyke5o` a `main` (Settings → Branches). GitHub actualiza la base del PR #1 solo.

Después, mergear los PR **en orden** (#1, #2, #3, …) con *merge commit*, no squash. Al mergear uno, GitHub cambia la base del siguiente.

## 1. Revisión de secretos (antes de hacer público el repo)

El plan gratuito de GitHub Pages exige repo público. Antes de cambiar la visibilidad:

1. Confirmar que solo las plantillas están versionadas:

   ```bash
   git log --all --name-only --pretty=format: | sort -u | grep -iE "\.env|secret|\.pem|\.key$"
   ```

   Tiene que listar únicamente `.env.example` y `.env.secrets.example`.

2. Escanear el historial completo, incluida la rama `infra/supabase`:

   ```bash
   git fetch --all
   docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect --source /repo --log-opts="--all"
   ```

   Sin Docker: instalar `gitleaks` y correr `gitleaks detect --log-opts="--all"`.

3. Revisar a mano que en ningún archivo, workflow ni mensaje de commit aparezca la clave `service_role`, el token de acceso de Supabase ni la contraseña de la base.

**Resultado del agente (2026-11-12):** el punto 1 y una búsqueda por patrones sobre el historial de las ramas de la app no encontraron nada. No se usó `gitleaks` (no está instalado en la sesión) y **no se revisó la rama `infra/supabase`**, que no estaba en el remoto. Repetir los puntos 1 a 3 con todas las ramas antes de publicar.

Si aparece un secreto en el historial: rotarlo primero (ver `docs/SETUP_SUPABASE.md`) y avisar antes de hacer público el repo. Borrarlo del último commit no alcanza.

## 2. Hacer público el repo

Settings → General → Danger Zone → Change repository visibility → Public.

## 3. Activar Pages

Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## 4. Cargar las variables de Supabase

Settings → Secrets and variables → Actions → pestaña **Variables** → New repository variable:

| Nombre | Valor |
|---|---|
| `VITE_SUPABASE_URL` | La URL del proyecto (`https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | La clave `anon` (pública) |

Van como **variables**, no como secretos: las dos son públicas por diseño y quedan dentro del JavaScript publicado. La seguridad la dan RLS y el registro cerrado.

**Nunca** cargar la clave `service_role`, ni como variable ni como secreto.

Mientras H3 no esté hecho, estas variables no se usan y se pueden dejar vacías.

## 5. Desplegar

Mergear a `main` dispara el deploy. Para repetirlo a mano: Actions → "Deploy to GitHub Pages" → Run workflow.

Verificar:

1. El workflow termina en verde y muestra la URL.
2. La app abre en esa URL desde el celular.
3. Recargar dentro de una pantalla interna (por ejemplo `…/#/places`) no da 404. Por eso la app usa rutas con `#`.
4. Instalarla en el celular (README, sección "Instalarla en el celular").

## 6. Después de publicar

- En Supabase, agregar la URL de Pages a Authentication → URL Configuration (Site URL y Redirect URLs). Lo necesitan los links de invitación y de recuperación de contraseña.
- Correr el checklist de iPhone del README.

## Actualizaciones

Cada merge a `main` publica una versión nueva. La app instalada se actualiza sola: el *service worker* baja la versión nueva en segundo plano y la aplica la siguiente vez que se abre.
