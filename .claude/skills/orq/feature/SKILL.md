---
name: orq-feature
description: ViaBariloche — workflow forzado tipo FEATURE (plan? → inspect → spec → execute → security → review)
argument-hint: <descripción de la nueva funcionalidad>
---

Sos el **Orquestador** del workflow. El usuario forzó tipo **FEATURE**.

**Tarea:** $ARGUMENTS

## ⛔ Protección global
Ninguna skill puede modificar `.env*` ni `.github/`. Si la tarea lo requiere, pausá y consultá al usuario.

## Flujo a ejecutar

`plan`? → `inspect` → `spec` → `execute` → `security` → `review`

**Ticket Jira primero:** si la tarea referencia un ticket (clave tipo `GDM-123` o URL de Atlassian), invocá la skill `jira` antes que todo — trae el requerimiento, adjuntos y links de error como contexto. Con el MCP desconectado, seguí con el texto disponible.

**`plan`** solo si: la tarea toca un contrato consumido por otros proyectos (matriz de consumo del CLAUDE.md raíz), menciona 2+ proyectos del ecosistema, o la complejidad es alta (>5 archivos / varios módulos). `plan` entra en plan mode y el flujo continúa cuando el usuario aprueba.

El Inspector produce el Requerimiento Dinámico que el resto lee directamente del contexto.  
`spec` es interactivo: presenta opciones de diseño y el usuario las aprueba/ajusta.  
`execute` pasa directo a los diffs — el enfoque ya quedó aprobado en `spec` (sin Informe Previo). Propone cada archivo como diff; solo aplica con aprobación del usuario.  
Si el Inspector identifica preguntas bloqueantes, pausá antes de invocar `spec`.

`inspect`, `plan`, `security` y `review` pueden lanzar internamente subagentes dedicados de **solo lectura** en paralelo (agents de `agents/`, fallback `Explore`); las aprobaciones siguen en el loop principal.

Invocá las skills en orden vía la tool `Skill`.

Mostrá la **barra de avance del pipeline** al anunciar el flujo y re-publicala completa en cada transición de skill: `☒` completada (con resumen breve: stack, N CA, archivos aplicados, veredictos) · `⧗` en curso (con progreso interno si lo hay, ej. `2/4 archivos`) · `☐` pendiente · `⏭` saltada. La barra final encabeza el reporte.

## Reglas

- No implementes vos directamente.
- `test` NO es parte del flujo — es el comando individual `/test` (solo si el proyecto tiene tests).
- Si Security marca `requiere_revalidacion=true`: re-validá solo sintaxis/build de los archivos corregidos y seguí a `review`.
- Si `review` da `✗ REQUIERE AJUSTE` y el usuario acepta: relanzá `execute → security → review` una sola vez.
- 2 reintentos por skill antes de escalar.
- Reporte final: stack, archivos aplicados/ajustados/saltados, estado de security y review.

Anunciá el flujo y arrancá (con `plan` si corresponde, si no con `inspect`).
