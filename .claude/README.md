# ai-workflow · ViaBariloche · Workflow Orquestado para Claude Code

Sistema organizacional de skills orquestadas para Claude Code. Estandariza el ciclo de desarrollo asistido (planificación → análisis → especificación → implementación → seguridad → revisión) en todos los proyectos de la organización, **independiente del lenguaje, framework o versión**.

---

## ¿Qué resuelve?

Cada desarrollador, en cada proyecto (PHP Laravel/CodeIgniter, React, React Native, Angular, Node, C#/.NET, PowerBuilder), trabaja con el mismo flujo y los mismos comandos:

```
/workflow "agregar endpoint de health"           → flujo completo (auto-detectado)
/workflow "GDM-123"                              → flujo a partir de un ticket Jira
/workflow-feature "..."                          → flujo forzado feature
/workflow-fix "fix login validation"            → flujo fix
/workflow-hotfix "error crítico en producción"  → flujo express
/workflow-refactor "reorganizar servicios"      → incluye migraciones
/workflow-docs "documentar API"                 → solo escritura

# Skills individuales
/plan "..."   /inspect "..."   /spec "..."   /execute   /security   /review

# Traer un requerimiento de Jira como contexto (requiere MCP de Atlassian)
/jira "GDM-123"

# Análisis de stored procedures (la lógica de negocio crítica vive en db*)
/sp "BusPlusLoginObtener"

# Solo si el proyecto tiene tests automatizados (fuera del workflow)
/test

# Modo profesor: explica los cambios y enseña el lenguaje (fuera del workflow)
/teach "explicame cómo funciona el ApiMirror"
```

> Los comandos `/workflow*` viven en `commands/` y delegan en las skills `orq`, `orq-feature`, etc. — el nombre visible es el del comando.

## Características

- **Integración Jira + Sentry (opcional)**: con el MCP de Atlassian conectado, pasale el número de ticket (`GDM-123`) al workflow y la skill `jira` trae el requerimiento completo — descripción, comentarios, **adjuntos (capturas, PDF, Word)** y **links de error** (con MCP de Sentry: stack trace + ambiente). Como los tickets los cargan usuarios finales sin precisión técnica, la skill los traduce a **hipótesis de ubicación** en el ecosistema, y hace **triage por ambiente**: si el error se originó en dev/testing (suelen ser pruebas) te pregunta si vale la pena corregirlo. Sin MCPs, recomienda la conexión y sigue con el texto.
- **Planificación multi-proyecto (`plan`)**: para tareas complejas o que tocan varios proyectos del ecosistema, entra en **plan mode**, lee el CLAUDE.md raíz (mapa de proyectos + matriz de consumo), confirma consumidores con grep y arma el plan por fases antes de tocar nada. El orquestador lo dispara automáticamente cuando detecta impacto cruzado.
- **Auto-detección de stack**: el Inspector lee `composer.json`, `package.json`, `*.csproj`/`*.sln`, `*.pbw`/`*.pbt` y reporta lenguaje, framework, versión y test runner. El resto de las skills adapta sus comandos y ejemplos automáticamente.
- **Exploración en paralelo (agents dedicados)**: `inspect`, `plan`, `security` y `review` lanzan subagentes de **solo lectura** en paralelo usando los agents de `agents/` (`explorador-codigo`, `verificador-consumidores`, `analista-owasp`, `verificador-review`) — con tools restringidas a Read/Glob/Grep por frontmatter y los invariantes integrados. Si el proyecto no los tiene instalados, degradan al agent genérico `Explore`. Las correcciones, aprobaciones y veredictos siguen en el loop principal — los subagentes nunca editan.
- **Spec interactivo**: antes de generar la especificación, presenta **opciones de diseño** (enfoque, contratos, plan de verificación) con sus trade-offs; el usuario elige y puede ajustar cada decisión paso a paso antes de que se escriba el documento.
- **Execute con aprobación por archivo**: en flujos **sin spec** (fix, hotfix, docs), antes del primer diff publica en el chat un **Informe Previo de Cambios** — diagnóstico (el error encontrado o el ajuste necesario según la tarea), enfoque propuesto, mapa de cambios y flujo ASCII opcional — y **recién con el informe visible** pregunta si el enfoque coincide con el que el usuario tenía pensado (solo en la conversación, no en disco). Si hubo `spec`, va directo a los diffs: el enfoque ya quedó aprobado ahí. Después, **ningún cambio se aplica directamente**: cada archivo se propone como diff encabezado por su **ubicación navegable** (`ruta/Archivo.ext:142-156` — clickeable, con las líneas que se van a modificar), el usuario lo Aprueba / Ajusta / Salta, y solo lo aprobado se escribe.
- **`/test` solo con tests reales**: la mayoría de los proyectos no tiene tests unitarios, así que `test` quedó **fuera del workflow** como comando individual. Si el proyecto no dispone de tests automatizados, lo informa y termina.
- **`/teach` — modo profesor**: comando individual (fuera del workflow) que explica **qué se cambió, por qué y cómo funciona por detrás**, enseñando el lenguaje del cambio (auto-detecta; Python por default) con **puente desde PHP** — sintaxis idiomática, funciones nativas, librerías, tablas y diagramas ASCII. Solo lectura: nunca edita. Se usa suelto (`/teach "cómo funciona X"`) o al cerrar un ciclo — `review` y el reporte de `orq` lo recomiendan. Puede fanear el agent `profesor-codigo` para inventariar conceptos por archivo.
- **OWASP por lenguaje**: la skill Security incluye ejemplos de inyección, XSS, mass assignment, command injection, deserialización insegura, etc., adaptados al stack del proyecto. Si corrige algo, el orquestador re-valida **sintaxis/build** (no ejecuta tests).
- **Review final**: cierra todos los flujos revisando el ciclo completo (plan/inspect/spec → execute → security): criterios cumplidos, patrones de diseño, convenciones del proyecto. Corrige issues menores con aprobación por archivo y escala los mayores.
- **Barra de avance del pipeline**: el orquestador publica una checklist del flujo al anunciarlo y la re-publica en cada transición de skill — `☒` completada (con resumen: stack, N CA, archivos aplicados, veredictos) · `⧗` en curso (`2/4 archivos`) · `☐` pendiente · `⏭` saltada. Siempre sabés en qué paso está el workflow y qué produjo cada etapa.
- **Output 100% en contexto**: plan, spec y reportes viven en la conversación. **No se escriben archivos** a disco (solo el código fuente aprobado). Si querés persistir un reporte, copiá manualmente.
- **context7 opcional**: si el MCP `context7` está disponible (Spec y Executor lo usan para validar APIs de librerías), se aprovecha; si no, degradan a `WebFetch` sobre la doc oficial.

## Tipos de workflow

| Tipo | Flujo | Cuándo |
|------|-------|--------|
| **feature** | plan? → inspect → spec → execute → security → review | Nueva funcionalidad |
| **fix** | plan? → inspect → execute → security → review | Corrección de bugs |
| **refactor** | plan? → inspect → spec → execute → security → review | Reestructuración + migraciones |
| **hotfix** | execute → security → review | Urgencias en producción |
| **docs** | execute → security → review | Solo documentación |

> `plan?` = el orquestador lo invoca solo si la tarea toca un contrato consumido por otros proyectos (matriz de consumo del CLAUDE.md raíz), menciona 2+ proyectos del ecosistema, o la complejidad es alta. Hotfix nunca dispara plan.
>
> Las **migraciones** (schema, datos, port entre frameworks) se modelan como `refactor`. El spec del refactor incluye plan de rollback / forward-only.

## Diagrama del flujo

`⏸` = el flujo se pausa y espera una decisión del usuario.

```
          /workflow "descripción de la tarea"   o   /workflow "GDM-123"
                                    │
                ¿referencia un ticket Jira (GDM-123 / URL)?
                        no │                  │ sí
                           │         ┌────────▼─────────┐
                           │         │       JIRA       │ MCP Atlassian
                           │         │ issue+comentarios│ desconectado →
                           │         │ +adjuntos (capt./│ recomienda
                           │         │ PDF/Word)+links  │ conexión y sigue
                           │         │ de error (Sentry)│ con el texto
                           │         │ → hipótesis técn.│
                           │         └────────┬─────────┘
                           │     ¿error originado en dev/testing?
                           │         ⏸ sí → ¿Descartar? → FIN (era prueba)
                           │                  │ continuar
                           └──────────┬───────┘
                     ┌──────────────▼───────────────┐
                     │      ORQUESTADOR (orq)       │
                     │  clasifica tipo (prioridad:  │
                     │  hotfix > fix > refactor >   │
                     │  docs > feature)             │
                     └──────────────┬───────────────┘
                                    │
              ¿toca contrato de otros proyectos / 2+ proyectos
                   / complejidad alta?  (hotfix y docs: nunca)
                        sí │                    │ no
                  ┌────────▼─────────┐          │
                  │       PLAN       │          │
                  │ plan mode        │          │
                  │ CLAUDE.md raíz + │          │
                  │ matriz de consumo│          │
                  │ + grep de        │          │
                  │ consumidores     │          │
                  │ (fan-out agents) │          │
                  └────────┬─────────┘          │
                    ⏸ usuario aprueba           │
                       el plan └────────┬───────┘
                                        ▼
                  ┌─────────────────────────────────┐
                  │             INSPECT             │  hotfix y docs
                  │ detecta stack + Requerimiento   │  lo saltan ──┐
                  │ Dinámico (archivos, CA-XX)      │              │
                  │ (fan-out de agents dedicados)   │              │
                  └────────────────┬────────────────┘              │
                                   ▼                               │
                  ┌─────────────────────────────────┐              │
                  │       SPEC (interactivo)        │  solo feature│
                  │ ⏸ opciones de diseño con        │  y refactor  │
                  │   trade-offs (enfoque, contrato,│              │
                  │   verificación)                 │              │
                  │ ⏸ confirmación Aprobar/Ajustar  │              │
                  │   (máx 2 vueltas)               │              │
                  └────────────────┬────────────────┘              │
                                   ▼                               │
                  ┌─────────────────────────────────┐              │
                  │    EXECUTE (aprobación x arch.) │◄─────────────┘
                  │ ⏸ informe previo de cambios     │
                  │   (diagnóstico+enfoque+mapa;    │
                  │    solo si NO hubo spec)        │
                  │ por cada archivo:               │
                  │   1. propone diff               │
                  │   2. ⏸ Aprobar/Ajustar/Saltar   │
                  │      (máx 3 ajustes x archivo)  │
                  │   3. aplica SOLO lo aprobado    │
                  │ + validación sintaxis/build     │
                  └────────────────┬────────────────┘
                                   ▼
                  ┌─────────────────────────────────┐
                  │            SECURITY             │
                  │ OWASP Top 10 según stack        │
                  │ (fan-out agents x dimensión)    │
                  │ corrige vulnerabilidades (Edit) │
                  └────────────────┬────────────────┘
              ┌────────────────────┼─────────────────────┐
        ✗ BLOQUEADO      ⚠ corrigió código          ✓ APROBADO
              │     (requiere_revalidacion=true)         │
              ▼                    ▼                     │
        escala al        re-valida sintaxis/build        │
        usuario          de los archivos corregidos      │
        (fin)            (NUNCA ejecuta tests)           │
                                   └──────────┬──────────┘
                                              ▼
                  ┌─────────────────────────────────┐
                  │             REVIEW              │
                  │ revisa el ciclo completo:       │
                  │ CA-XX cumplidos + patrones +    │
                  │ convenciones + impacto cruzado  │
                  │ (fan-out agents x verificación) │
                  │ issues menores: ⏸ corrige con   │
                  │ aprobación · mayores: escala    │
                  └────────────────┬────────────────┘
              ┌────────────────────┼─────────────────────┐
      ✗ REQUIERE AJUSTE   ⚠ CON OBSERVACIONES       ✓ APROBADO
              │                    └──────────┬──────────┘
   ⏸ si el usuario acepta:                    ▼
   relanza execute → security        ┌─────────────────┐
   → review (UNA sola vez)           │  REPORTE FINAL  │
                                     │ (en contexto,   │
                                     │  no en disco)   │
                                     └─────────────────┘

 ──────────────────────────────────────────────────────────────
  /test — comando individual, FUERA del workflow
      │
      ¿el proyecto tiene test runner / tests?
      ├─ no ──► "no dispone de tests automatizados" → termina
      └─ sí ──► ejecuta la suite (o subset filtrado) → reporte

  /teach — comando individual, FUERA del workflow (modo profesor)
      │
      ¿hay un tema puntual ($ARGUMENTS) o un ciclo recién terminado?
      └─► lee el código (solo lectura) → lección: qué cambió, por qué,
          conceptos del lenguaje (puente desde PHP) y cómo funciona por detrás
```

## Estructura

```
ai-workflow/
├── README.md
├── INSTALL.md
├── skills/                  # 16 skills — subir a Enterprise workspace
│   ├── orq/SKILL.md                 # orquestador (comando /workflow)
│   ├── orq/feature/SKILL.md
│   ├── orq/fix/SKILL.md
│   ├── orq/refactor/SKILL.md
│   ├── orq/hotfix/SKILL.md
│   ├── orq/docs/SKILL.md
│   ├── jira/SKILL.md                # requerimiento desde Jira (MCP Atlassian + Sentry)
│   ├── plan/SKILL.md
│   ├── inspect/SKILL.md
│   ├── spec/SKILL.md
│   ├── execute/SKILL.md
│   ├── test/SKILL.md                # comando individual, fuera del workflow
│   ├── teach/SKILL.md               # modo profesor, fuera del workflow
│   ├── security/SKILL.md
│   ├── review/SKILL.md
│   └── sp/SKILL.md                  # análisis de stored procedures, fuera del workflow
├── commands/                # 16 slash commands — copiar a .claude/commands
│   ├── workflow.md … workflow-docs.md
│   └── jira.md, plan.md, inspect.md, spec.md, execute.md, test.md, teach.md, security.md, review.md, sp.md
└── agents/                  # 5 subagentes de solo lectura — copiar a .claude/agents
    ├── explorador-codigo.md         # fan-out de inspect
    ├── verificador-consumidores.md  # fan-out de plan (impacto cruzado)
    ├── analista-owasp.md            # fan-out de security (solo detecta)
    ├── verificador-review.md        # fan-out de review (no emite veredicto)
    └── profesor-codigo.md           # fan-out de teach (inventario de conceptos)
```

## Stacks soportados (auto-detectados por el Inspector)

| Manifest | Stack | Test runner por default |
|---|---|---|
| `composer.json` | PHP / Laravel / CodeIgniter (3 y 4) | `vendor/bin/phpunit` o `php artisan test` |
| `package.json` | JS / TS (React, React Native/Expo, Angular, Next, Express, NestJS) | `npm test` / `npx jest` / `ng test` |
| `*.csproj` o `*.sln` | C# / .NET (ASP.NET Core, Blazor, WinForms, WPF) | `dotnet test` |
| `*.pbw` / `*.pbt` / `*.pbl` | PowerBuilder (legacy) | ninguno — build y validación desde el IDE |

Si en la raíz del proyecto coexisten varios manifests (ej: backend + frontend), el Inspector los reporta todos y aclara cuál es relevante para la tarea.

## Instalación

Ver [INSTALL.md](INSTALL.md). Skills desde el admin console de Enterprise; commands copiándolos a `.claude/commands` del proyecto.

## Ejemplos de uso

### Feature en proyecto Laravel
```
/workflow "agregar endpoint GET /api/v1/health"
```
Inspector detecta PHP/Laravel 11. Spec ofrece opciones (Form Request + Service vs controller directo) y el usuario elige. Executor propone cada archivo como diff y aplica lo aprobado. Security revisa rate limiting y validación. Review confirma criterios y convenciones.

### Fix a partir de un ticket de Jira
```
/workflow "GDM-482"
```
La skill `jira` trae el ticket: "no me deja emitir la boleta" (usuario final), una captura con el error y un link a Sentry. Lee la captura, trae el stack trace de Sentry (`Ventas.php:214`, environment production) y arma la hipótesis: `api` → modelo de ventas → SP de `db-boletos`. El Inspector la confirma y el flujo sigue como fix. Si Sentry hubiera dicho environment `testing`, te preguntaba antes si valía la pena corregirlo.

### Cambio multi-proyecto (dispara plan)
```
/workflow "agregar el claim tenant_type al JWT del api-gateway"
```
El orquestador detecta que el shape del JWT es un contrato consumido por `api` y los frontends (matriz de consumo del CLAUDE.md raíz) → invoca `plan`, que entra en plan mode, confirma consumidores con grep y arma el plan por fases. Recién con el plan aprobado sigue el flujo.

### Hotfix en app React Native sin tests
```
/workflow-hotfix "crash al abrir pantalla de detalle"
```
Sin inspect. Executor detecta el stack (Expo/React Native) y propone el fix como diff — se aplica con tu aprobación. Security revisa almacenamiento de tokens y datos sensibles en logs. Review cierra el ciclo. (Sin tests no hay nada que correr con `/test`.)

### Migración de schema (se modela como refactor)
```
/workflow-refactor "migrar columna users.email a CITEXT y recrear índice único"
```
Si la columna la consumen otros proyectos, primero `plan`. Spec incluye plan forward + rollback elegido con el usuario. Toda verificación contra DB es solo con SELECT.

## Filosofía

- **Skills orquestadas en contexto compartido.** El plan/Inspector escriben su reporte → el Spec lo lee directamente → el Executor lee el spec. Sin propagación manual de información entre pasos.
- **Nada se escribe sin aprobación del usuario.** El Executor (y Review para issues menores) proponen diffs y aplican solo lo aprobado. Plan, Inspector y Spec no tocan archivos. Security puede corregir vulnerabilidades con `Edit`.
- **Nada se escribe a disco fuera del código fuente.** Planes, specs y reportes son artefactos de conversación.
- **El fan-out de solo lectura acelera, no decide.** Los agents dedicados de `agents/` (o `Explore` como fallback) exploran en paralelo y devuelven conclusiones; las correcciones, aprobaciones y veredictos quedan siempre en el loop principal.
- **El stack manda.** Convenciones, comandos y ejemplos se eligen según lo que detecte el Inspector.
- **El ecosistema manda más.** Si el cambio toca un contrato consumido por otro proyecto, se planifica el impacto cruzado antes de escribir una línea (protocolo del CLAUDE.md raíz).
