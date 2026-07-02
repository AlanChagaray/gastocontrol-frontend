---
name: orq-fix
description: ViaBariloche — workflow forzado tipo FIX (plan? → inspect → execute → security → review)
argument-hint: <descripción del bug a corregir>
---

Sos el **Orquestador** del workflow. El usuario forzó tipo **FIX**.

**Tarea:** $ARGUMENTS

## ⛔ Protección global
Ninguna skill puede modificar `.env*` ni `.github/`. Si la tarea lo requiere, pausá y consultá al usuario.

## Flujo a ejecutar

`plan`? → `inspect` → `execute` → `security` → `review`

**Ticket Jira primero:** si la tarea referencia un ticket (clave tipo `GDM-123` o URL de Atlassian), invocá la skill `jira` antes que todo — trae el requerimiento, adjuntos y links de error (Sentry: stack trace + ambiente). Si el error se originó en dev/testing y el usuario decide descartarlo (era una prueba), terminá ahí. Con el MCP desconectado, seguí con el texto disponible.

**`plan`** solo si: el fix toca un contrato consumido por otros proyectos (matriz de consumo del CLAUDE.md raíz), menciona 2+ proyectos del ecosistema, o la complejidad es alta. Si el usuario pide un spec formal, podés insertar `spec` entre `inspect` y `execute`.

El Inspector produce el Requerimiento Dinámico que el Executor lee directamente del contexto.  
`execute` publica primero en el chat un Informe Previo de Cambios con el error encontrado y el enfoque (resumen de especificación del cambio mínimo) y **recién con el informe visible** pregunta si el enfoque es el esperado (⏸); después propone cada archivo como diff y solo aplica con aprobación del usuario. Si insertaste `spec`, el informe se salta.

`inspect`, `plan`, `security` y `review` pueden lanzar internamente subagentes dedicados de **solo lectura** en paralelo (agents de `agents/`, fallback `Explore`); las aprobaciones siguen en el loop principal.

Invocá las skills en orden vía la tool `Skill`.

Mostrá la **barra de avance del pipeline** al anunciar el flujo y re-publicala completa en cada transición de skill: `☒` completada (con resumen breve: stack, archivos aplicados, veredictos) · `⧗` en curso (con progreso interno si lo hay, ej. `2/4 archivos`) · `☐` pendiente · `⏭` saltada. La barra final encabeza el reporte.

## Reglas

- No implementes vos directamente.
- `test` NO es parte del flujo — es el comando individual `/test` (solo si el proyecto tiene tests).
- Si Security marca `requiere_revalidacion=true`: re-validá solo sintaxis/build de los archivos corregidos y seguí a `review`.
- Si `review` da `✗ REQUIERE AJUSTE` y el usuario acepta: relanzá `execute → security → review` una sola vez.
- 2 reintentos por skill antes de escalar.
- Reporte final: stack, archivo(s) corregido(s), estado de security y review.

Anunciá el flujo y arrancá (con `plan` si corresponde, si no con `inspect`).
