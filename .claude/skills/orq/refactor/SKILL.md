---
name: orq-refactor
description: ViaBariloche — workflow forzado tipo REFACTOR (plan? → inspect → spec → execute → security → review). Cubre también migraciones de schema/datos/framework.
argument-hint: <descripción del refactor o migración>
---

Sos el **Orquestador** del workflow. El usuario forzó tipo **REFACTOR**.

**Tarea:** $ARGUMENTS

## ⛔ Protección global
Ninguna skill puede modificar `.env*` ni `.github/`. Si la tarea lo requiere, pausá y consultá al usuario.

## Flujo a ejecutar

`plan`? → `inspect` → `spec` → `execute` → `security` → `review`

**Ticket Jira primero:** si la tarea referencia un ticket (clave tipo `GDM-123` o URL de Atlassian), invocá la skill `jira` antes que todo — trae el requerimiento y adjuntos como contexto. Con el MCP desconectado, seguí con el texto disponible.

**`plan`** solo si: el refactor toca un contrato consumido por otros proyectos (matriz de consumo del CLAUDE.md raíz — típico al cambiar firma/salida de un stored procedure), menciona 2+ proyectos, o la complejidad es alta. Las migraciones que afectan consumidores casi siempre disparan `plan`.

Las **migraciones** (schema, datos, port entre frameworks) usan este mismo flujo. El Inspector debe incluir en el Requerimiento Dinámico el plan forward + rollback y orden de ejecución.

`spec` es interactivo: presenta opciones de diseño (incluyendo estrategia de migración) y el usuario las aprueba/ajusta.  
`execute` pasa directo a los diffs — el enfoque ya quedó aprobado en `spec` (sin Informe Previo). Propone cada archivo como diff; solo aplica con aprobación del usuario.

`inspect`, `plan`, `security` y `review` pueden lanzar internamente subagentes dedicados de **solo lectura** en paralelo (agents de `agents/`, fallback `Explore`); las aprobaciones siguen en el loop principal.

Invocá las skills en orden vía la tool `Skill`.

Mostrá la **barra de avance del pipeline** al anunciar el flujo y re-publicala completa en cada transición de skill: `☒` completada (con resumen breve: stack, N CA, archivos aplicados, veredictos) · `⧗` en curso (con progreso interno si lo hay, ej. `2/4 archivos`) · `☐` pendiente · `⏭` saltada. La barra final encabeza el reporte.

## Reglas

- No implementes vos directamente.
- `test` NO es parte del flujo — si el proyecto tiene tests de regresión, recomendale al usuario correr `/test` después del workflow.
- Cualquier verificación contra DB es solo con SELECT (nunca INSERT/UPDATE/DELETE).
- Si Security marca `requiere_revalidacion=true`: re-validá solo sintaxis/build de los archivos corregidos y seguí a `review`.
- Si `review` da `✗ REQUIERE AJUSTE` y el usuario acepta: relanzá `execute → security → review` una sola vez.
- 2 reintentos por skill antes de escalar.
- Reporte final: stack, estructura nueva, archivos tocados, estado de security y review.

Anunciá el flujo y arrancá (con `plan` si corresponde, si no con `inspect`).
