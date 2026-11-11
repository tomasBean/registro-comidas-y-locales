# PROGRESS

> Estado vivo del proyecto. Se actualiza en cada commit. Leer esto primero al retomar.

## Hito actual

Ninguno iniciado. Repo con briefs y andamiaje de documentación.

## Hecho y verificado

- `BRIEF.md` v0.2 y `BRIEF-SUPABASE.md` v0.1 escritos (pendiente de revisión del usuario).
- Archivos de infraestructura: `.gitignore`, `.env.example`, `.env.secrets.example`, `.claude/settings.json`, `CLAUDE.md`, `docs/context/`.

## Sigue

1. Revisión del usuario de los briefs.
2. Lanzar sesión A (app, `BRIEF.md`) y sesión B (Supabase, `BRIEF-SUPABASE.md`) en paralelo.

## Decisiones tomadas

- Hosting: GitHub Pages, con repo público al final (hito H6), tras escaneo de secretos.
- Datos: Supabase (un proyecto gratuito; si no hay lugar, schema separado). Detrás de una interfaz `Repository` intercambiable.
- Mapa: Leaflet + OpenStreetMap; Google Maps solo como link.
- Un puntaje por ítem de cada visita, escala 1–10 en pasos de media estrella, mostrada 1–5.
- Supabase lo configura una sesión aparte; las claves van en `.env.secrets` y no se leen.
- Graphify: se evalúa después de H1, con verificación del hook y plan B.

## Pendientes de confirmar por el usuario

- Nombre y dirección de los lugares de ejemplo: *Perdú* (¿la sucursal de Rondeau?), *Albuche*, *La Cabaña de Chamigo* (calle Belgrano, número a completar).

## Pedidos a la sesión de Supabase

(ninguno)

## Estado de la sesión de Supabase

No iniciada.

## Bloqueos

(ninguno)
