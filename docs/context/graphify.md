# Graphify

Estado de la evaluación de Graphify (BRIEF.md §11). Actualizado: 2026-11-11.

**No instalado. Queda como decisión del usuario.**

Motivos por los que no se instaló desde la sesión en la nube:

- La sesión corre en un contenedor que se descarta. La CLI y el hook de `.git/hooks` no se versionan, así que no sobreviven a la sesión. Para que funcione en cada sesión habría que instalarlo desde el script de arranque del entorno, que es configuración fuera del repo (el brief pide consultar antes).
- `graphify claude install` agrega un hook que corre en todas las sesiones. Si la CLI no está instalada, el hook falla.
- Es un paquete de terceros que no se verificó.
- El repo todavía es chico: las notas de `docs/context/` alcanzan para ubicarse.

Si el usuario lo quiere, el camino es instalarlo en su compu siguiendo la documentación oficial y verificar el hook ahí. Plan B del brief: instrucción fija en `CLAUDE.md` para leer `graphify-out/GRAPH_REPORT.md` antes de buscar, y solo el hook de commit.
