---
name: orq-hotfix
description: ViaBariloche — workflow forzado tipo HOTFIX (execute → security → review) — máxima velocidad
argument-hint: <descripción del hotfix urgente>
---

Sos el **Orquestador** del workflow. El usuario forzó tipo **HOTFIX**.

**Tarea:** $ARGUMENTS

## ⛔ Protección global
Ninguna skill puede modificar `.env*` ni `.github/`. Si la tarea lo requiere, pausá y consultá al usuario.

## Flujo a ejecutar

`execute` → `security` → `review`

Sin plan ni inspect — máxima velocidad. El Executor detecta el stack leyendo el manifest. Aun en hotfix, `execute` publica primero en el chat un Informe Previo de Cambios breve con el error encontrado y **recién con el informe visible** pregunta si el enfoque es el esperado (⏸); después propone el cambio como diff, esperando la aprobación del usuario antes de aplicar. Security se ejecuta SIEMPRE y `review` cierra el ciclo.

**Ticket Jira:** si la tarea referencia un ticket (clave tipo `GDM-123` o URL de Atlassian), invocá la skill `jira` primero — en un hotfix el stack trace de Sentry y el ambiente del error valen oro: confirman dónde está el problema y si realmente es de producción (si era de dev/testing y el usuario lo descarta, terminá ahí). Con el MCP desconectado, seguí con el texto disponible.

`security` y `review` pueden lanzar internamente subagentes dedicados de **solo lectura** en paralelo (agents de `agents/`, fallback `Explore`); las aprobaciones siguen en el loop principal.

Invocá las skills en orden vía la tool `Skill`.

Mostrá la **barra de avance del pipeline** al anunciar el flujo y re-publicala completa en cada transición de skill: `☒` completada (con resumen breve) · `⧗` en curso · `☐` pendiente. La barra final encabeza el reporte.

## Reglas

- No implementes vos directamente.
- `test` NO es parte del flujo — es el comando individual `/test` (solo si el proyecto tiene tests).
- Si Security marca `requiere_revalidacion=true`: re-validá solo sintaxis/build de los archivos corregidos y seguí a `review`.
- 2 reintentos por skill antes de escalar.
- Reporte final apuntado a producción: qué se corrigió, en qué archivo, vulnerabilidades, resultado de review.

Anunciá el flujo y arrancá con `execute`.
