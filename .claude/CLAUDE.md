# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repo

`ai-workflow` distribuye el **workflow orquestado de ViaBariloche** para Claude Code: 16 skills (prompts en `skills/**/SKILL.md`), 16 slash commands (`commands/*.md`) y 5 agents de fan-out (`agents/*.md`). **No hay código ejecutable** — todo el contenido es Markdown de prompt-engineering. No hay build, lint ni tests; la verificación son los smoke tests de `INSTALL.md`, que se corren instalando el flujo en un proyecto real.

## Distribución (cómo "se instala" lo que se edita acá)

- **Skills** → se suben al admin console de Claude Enterprise. El nombre de la skill **debe coincidir con el `name:` del frontmatter** (tabla de mapeo en `INSTALL.md`). Los subdirectorios de `orq/` mapean a nombres con guion: `skills/orq/feature/SKILL.md` → skill `orq-feature`.
- **Commands** → se copian a `.claude/commands/` de cada proyecto. Son shims de ~3 líneas que delegan en la skill homónima vía la tool `Skill` (ej.: `commands/workflow.md` → skill `orq`).
- **Agents** → se copian a `.claude/agents/` de cada proyecto (**no** se distribuyen por el admin console; eso es solo para skills). Son los subagentes de solo lectura del fan-out, invocados por nombre vía `subagent_type`. El `name:` del frontmatter es contrato — si lo cambiás, actualizá la skill que lo invoca, INSTALL.md y el README.

Si cambiás el `name:` de una skill, tenés que actualizar: el command que la invoca, las tablas de `INSTALL.md`, el README y los orquestadores que la referencian.

## Arquitectura: pipeline de skills sobre contexto compartido

```
orq (clasifica tipo) ──► jira? ──► plan? ──► inspect ──► spec ──► execute ──► security ──► review
```

- `skills/orq/SKILL.md` es el orquestador genérico (auto-detecta el tipo); `orq/{feature,fix,refactor,hotfix,docs}/SKILL.md` son variantes que fuerzan el tipo y **repiten las mismas reglas en versión resumida** — un cambio de regla en `orq` debe replicarse en las 5 variantes.
- Flujos por tipo: feature/refactor usan el pipeline completo; fix salta `spec`; hotfix y docs saltan `plan`, `inspect` y `spec`. `test` y `sp` son comandos individuales **fuera** del workflow.
- **Las skills no se pasan parámetros: se comunican por artefactos con nombre en la conversación.** Estos nombres son contratos — si renombrás uno en una skill, rompés a sus consumidores:
  - `Requerimiento Jira` (jira → orq/inspect)
  - `Requerimiento Dinámico` y `Stack Detectado` con criterios `CA-XX` (inspect → spec/execute/security/review)
  - `Informe Previo de Cambios`: diagnóstico + enfoque + mapa de cambios — **solo en flujos sin `spec`** (si spec participó, el enfoque ya quedó aprobado ahí). Execute lo publica COMPLETO en el chat ANTES del primer diff y recién entonces pregunta si el enfoque es el esperado — nunca la pregunta sin el informe visible (execute → usuario/review, que audita desvíos)
  - reporte del Executor: archivos aplicados/ajustados/saltados (execute → security/review)
  - flag `requiere_revalidacion=true` (security → orq, que re-valida solo sintaxis/build)
  - veredictos de review: `✗ REQUIERE AJUSTE` / `⚠ CON OBSERVACIONES` / `✓ APROBADO`

## Invariantes transversales (aparecen en varias skills — mantener consistentes)

- **⛔ Archivos protegidos**: ninguna skill lee/modifica `.env*` ni `.github/`. El bloque se repite en casi todas las skills.
- **Nada se aplica sin aprobación**: `execute` (y `review` para issues menores) proponen diffs y aplican solo lo aprobado vía `AskUserQuestion` (Aprobar/Ajustar/Saltar, máx 3 ajustes por archivo). Cada propuesta va encabezada por la **ubicación navegable** `ruta/Archivo.ext:línea(s)` (clickeable) con números de línea visibles en el diff. En entorno no interactivo se detienen sin aplicar.
- **Nada se escribe a disco salvo código fuente aprobado** — planes, specs y reportes viven en la conversación.
- **Tests nunca dentro del workflow**: la validación post-execute/security es solo sintaxis/build (`php -l`, `npm run build`, `dotnet build`, …). La suite la corre el usuario con `/test`.
- Consultas a DB: solo `SELECT`.
- Límites: 2 reintentos por skill; relanzar `execute → security → review` una sola vez; hotfix nunca dispara `plan`.
- **Disparador de `plan`**: contrato consumido por otros proyectos (matriz de consumo del CLAUDE.md raíz del ecosistema en `Documents\CLAUDE.md`), 2+ proyectos mencionados, o complejidad alta.
- **Barra de avance del pipeline**: `orq` y las 5 variantes publican una checklist del flujo (`☒` completada con resumen del artefacto · `⧗` en curso con progreso interno · `☐` pendiente · `⏭` saltada · `✗` bloqueada) al anunciar el flujo, la re-publican completa en cada transición de skill, y la versión final encabeza el reporte.
- **Fan-out de subagentes dedicados (solo lectura)**: `inspect`, `plan`, `security` y `review` lanzan en paralelo sus agents de `agents/` (`explorador-codigo`, `verificador-consumidores`, `analista-owasp`, `verificador-review`) — todos en un solo mensaje, un prompt específico por subagente, límite 4-5 por skill, y la skill consolida los resultados en su artefacto. Los invariantes (solo lectura vía `tools: Read, Glob, Grep`, archivos protegidos, conclusiones-no-dumps) viven **en el agent**; las skills solo repiten la frase fija de archivos protegidos en el **fallback a `Explore`** (cuando el proyecto no tiene `agents/` instalado). **Nunca se delega lo que escribe o decide**: las correcciones con `Edit` (security/review), el flag `requiere_revalidacion` (security) y el veredicto final (review) quedan SIEMPRE en el loop principal.

## Tablas duplicadas a sincronizar

La **tabla de detección de stack por manifest** (composer.json / package.json / *.csproj / *.pbw) y la de **validación sintaxis/build por stack** están duplicadas en `skills/inspect/SKILL.md` y `skills/execute/SKILL.md` (y resumidas en README/INSTALL). Si agregás un stack, actualizá todas.

El **bloque de exploración con subagentes** (reglas del fan-out + nota de fallback con la frase fija de archivos protegidos) está replicado en `skills/{inspect,plan,security,review}/SKILL.md`, y los invariantes integrados (⛔ archivos protegidos, solo lectura, conclusiones-no-dumps) en los 4 agents de fan-out de análisis (`explorador-codigo`, `verificador-consumidores`, `analista-owasp`, `verificador-review`). Si cambiás una regla del fan-out, sincronizá las 4 skills **y** los 4 agents. (El 5º agent, `profesor-codigo`, es el fan-out propio de `teach` — inventario de conceptos a enseñar — y no participa de este bloque.)

El README contiene el diagrama ASCII del flujo y las tablas de tipos — cualquier cambio de flujo en los orquestadores debe reflejarse ahí.
