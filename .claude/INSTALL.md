# Instalación · ai-workflow — Workflow Orquestado ViaBariloche

Con plan Enterprise, las **skills** se distribuyen centralmente desde el admin console de Claude.ai. Los **slash commands** (`commands/`) y los **agents** (`agents/`) se copian por proyecto a `.claude/commands` y `.claude/agents` (los commands también pueden subirse al workspace si la UI lo soporta; los agents **no** tienen distribución por admin console).

---

## 1. Subir las skills al workspace Enterprise

1. Entrá a **claude.ai** con tu cuenta admin.
2. Navegá a **Team Settings → Customize → Skills** (o "Habilidades").
3. Por cada archivo en `skills/`, creá una skill nueva con el contenido del `SKILL.md` correspondiente. **El nombre debe coincidir con el `name:` del frontmatter:**

| Nombre de skill | Archivo |
|---|---|
| `orq` | `skills/orq/SKILL.md` |
| `orq-feature` | `skills/orq/feature/SKILL.md` |
| `orq-fix` | `skills/orq/fix/SKILL.md` |
| `orq-refactor` | `skills/orq/refactor/SKILL.md` |
| `orq-hotfix` | `skills/orq/hotfix/SKILL.md` |
| `orq-docs` | `skills/orq/docs/SKILL.md` |
| `jira` | `skills/jira/SKILL.md` |
| `plan` | `skills/plan/SKILL.md` |
| `inspect` | `skills/inspect/SKILL.md` |
| `spec` | `skills/spec/SKILL.md` |
| `execute` | `skills/execute/SKILL.md` |
| `test` | `skills/test/SKILL.md` |
| `teach` | `skills/teach/SKILL.md` |
| `security` | `skills/security/SKILL.md` |
| `review` | `skills/review/SKILL.md` |
| `sp` | `skills/sp/SKILL.md` |

Una vez subidas, **todos los colaboradores del workspace las ven automáticamente** al abrir Claude Code o Claude.ai — sin instalar nada localmente.

## 2. Instalar los slash commands (`commands/`)

Los comandos visibles (`/workflow`, `/workflow-feature`, `/plan`, etc.) son archivos de `commands/` que delegan en la skill correspondiente (`orq`, `orq-feature`, `plan`, …).

Por proyecto:

```bash
# desde la raíz del proyecto
mkdir -p .claude/commands
cp ~/ai-workflow/commands/*.md .claude/commands/
git add .claude/commands
git commit -m "feat: add ViaBariloche workflow commands"
```

> Si tu workspace Enterprise permite distribuir commands centralmente, subilos ahí con el mismo nombre del archivo (sin `.md`).

## 3. Instalar los agents (`agents/`)

Los agents son los **subagentes de solo lectura** que las skills `inspect`, `plan`, `security`, `review` (fan-out de análisis) y `teach` (inventario de conceptos a enseñar) lanzan en paralelo. Tienen las tools restringidas a `Read, Glob, Grep` por frontmatter y los invariantes (archivos protegidos, conclusiones-no-dumps) integrados.

Por proyecto:

```bash
# desde la raíz del proyecto
mkdir -p .claude/agents
cp ~/ai-workflow/agents/*.md .claude/agents/
git add .claude/agents
git commit -m "feat: add ViaBariloche workflow agents"
```

| Agent | Archivo | Lo usa |
|---|---|---|
| `explorador-codigo` | `agents/explorador-codigo.md` | `inspect` — stack, archivos relevantes, patrones, tests |
| `verificador-consumidores` | `agents/verificador-consumidores.md` | `plan` — confirma impacto cruzado por proyecto |
| `analista-owasp` | `agents/analista-owasp.md` | `security` — una dimensión OWASP por instancia (solo detecta) |
| `verificador-review` | `agents/verificador-review.md` | `review` — CA-XX, patrones, convenciones (no emite veredicto) |
| `profesor-codigo` | `agents/profesor-codigo.md` | `teach` — inventaría conceptos del lenguaje a enseñar por archivo (no redacta la lección) |

> Si un proyecto no tiene los agents instalados, las skills **degradan automáticamente** al agent genérico `Explore` — el workflow no falla, pero pierde la restricción de tools por frontmatter.

---

## Verificación post-instalación

En cualquier proyecto de la organización:

```
1. Abrí Claude Code y tipear "/" → deberías ver:
   workflow, workflow-feature, workflow-fix, workflow-refactor,
   workflow-hotfix, workflow-docs, jira, plan, inspect, spec,
   execute, test, security, review, sp

2. Smoke test del Inspector:
   /inspect "agregar endpoint de health"
   → debe reportar el stack detectado del proyecto actual

3. Smoke test de flujo completo:
   /workflow "agregar endpoint de health"
   → debe ejecutar inspect → spec (con opciones para elegir) →
     execute (con aprobación por archivo) → security → review

4. Smoke test del disparador de plan (tarea multi-proyecto):
   /workflow "cambiar el shape del JWT del api-gateway"
   → debe invocar plan primero (plan mode) por impacto cruzado

5. Smoke test de /test en un proyecto SIN tests:
   /test
   → debe informar que no hay tests automatizados y terminar

6. Smoke test del fan-out de subagentes:
   /inspect "agregar endpoint de health"
   → con agents/ instalado en .claude/agents/: debe lanzar instancias
     de "explorador-codigo" en paralelo (stack / archivos / patrones)
     y consolidar UN solo bloque "Stack Detectado" + "Requerimiento
     Dinámico".
   → sin agents/ instalado: debe degradar a subagentes "Explore" sin
     fallar.
     En ambos casos: ningún subagente edita archivos ni lee
     .env*/.github/

7. Smoke test de /teach (modo profesor, solo lectura):
   /teach "explicame cómo funciona el ApiMirror"
   → debe leer el código y devolver una lección (qué hace, conceptos
     del lenguaje, puente desde PHP, cómo funciona por detrás) SIN
     editar ningún archivo ni proponer diffs.
```

### Checklist por stack

| Proyecto | Manifest esperado | Test runner esperado |
|---|---|---|
| Laravel backend | `composer.json` | `vendor/bin/phpunit` o `php artisan test` |
| CodeIgniter backend | `composer.json` | `vendor/bin/phpunit` (si hay tests) o ninguno |
| .NET backend / desktop | `*.csproj` o `*.sln` | `dotnet test` |
| React / Next web | `package.json` | `npm test` / `npx jest` |
| Angular web | `package.json` | `ng test` / `npx jest` |
| React Native / Expo app | `package.json` | `npm test` / `npx jest` |
| Node backend (Express/NestJS) | `package.json` | `npm test` |
| PowerBuilder (legacy) | `*.pbw` / `*.pbt` | ninguno — validación desde el IDE |

Si el Inspector no detecta el stack o reporta el equivocado, abrí un issue en el repo `ai-workflow/` con el contenido del manifest y la salida del Inspector.

---

## Actualización

Cuando se libera una versión nueva, el admin re-sube las skills modificadas desde el admin console (los colaboradores las reciben automáticamente) y cada proyecto actualiza sus copias de `commands/` y `agents/` con los mismos `cp`.

---

## Configuración opcional

### MCPs de Atlassian (Jira) y Sentry

La skill `jira` usa el **MCP de Atlassian** para traer el requerimiento del ticket (descripción, comentarios, adjuntos) y el **MCP de Sentry** para seguir los links de error (stack trace, archivo:línea, ambiente).

- **Cómo conectarlos:** en Claude Code, `/mcp` → seleccionar el conector → autenticarse; o en claude.ai → Settings → Connectors. En Enterprise suelen estar habilitados por default a nivel workspace — cada usuario solo necesita autenticarse una vez.
- **Sin Atlassian:** `/jira` y `/workflow "GDM-123"` no fallan — informan, recomiendan la conexión y el workflow sigue con el texto que escriba el dev.
- **Sin Sentry:** la skill recomienda conectarlo y pide al usuario pegar el stack trace del link mientras tanto.
- La skill es **solo lectura** en ambos: nunca comenta, transiciona ni edita tickets o issues.

### MCP context7

Los skills Spec y Execute usan `mcp__context7__resolve-library-id` y `mcp__context7__query-docs` para validar APIs de librerías de terceros. Si la organización tiene una instancia de context7 disponible, activala en `.claude/settings.json` del proyecto o vía MCP global. Si no, los skills degradan automáticamente a `WebFetch` — no es bloqueante.

### Interactividad (plan mode y AskUserQuestion)

- `plan` usa la tool `EnterPlanMode`; si el entorno no la tiene, la skill degrada a plan-como-texto y lo avisa.
- `spec`, `execute` y `review` usan `AskUserQuestion` para opciones y aprobaciones. En entornos no interactivos (batch/CI): `spec` asume la opción recomendada y lo registra; `execute` y `review` presentan los diffs y **se detienen sin aplicar nada**.

### Subagentes de fan-out (agents dedicados, solo lectura)

`inspect`, `plan`, `security` y `review` lanzan en paralelo, vía la tool `Agent`, los agents dedicados de `agents/` (`explorador-codigo`, `verificador-consumidores`, `analista-owasp`, `verificador-review`) para detección de stack, confirmación de consumidores, dimensiones OWASP y verificación de CA-XX. Son **solo lectura** (tools restringidas a `Read, Glob, Grep` por frontmatter) y traen integrada la prohibición de `.env*`/`.github/`. Si el proyecto no los tiene en `.claude/agents/`, las skills degradan al agent genérico `Explore` con la prohibición escrita en cada prompt. No aplican cambios: las correcciones (`Edit`), las aprobaciones y los veredictos quedan siempre en el loop principal. Se asume Claude Code con la tool `Agent` disponible.

### `/test` — solo con tests reales

`test` es un comando individual, fuera del workflow. Si el proyecto no dispone de tests automatizados, informa y termina — no genera checklists alternativos. Cualquier consulta a DB que hagan las skills es exclusivamente `SELECT`.

### Permisos

Las skills usan `Bash` para validaciones de build y para el test runner de `/test`. Si tu `.claude/settings.json` tiene allowlist, agregá los comandos que uses (`npm test`, `npm run build`, `ng build`, `ng test`, `dotnet build`, `dotnet test`, `php -l`, `vendor/bin/phpunit`, etc.) para evitar prompts repetidos.

`inspect`, `plan`, `security` y `review` usan además la tool `Agent` (agents dedicados de `agents/`, fallback `Explore`) para exploración de solo lectura en paralelo; si tu allowlist restringe tools, habilitala.

---

## Distribución alternativa por proyecto (sin Enterprise workspace)

Si necesitás versionar el flujo completo junto al código de un proyecto específico:

```bash
# desde la raíz del proyecto
cp -r ~/ai-workflow/skills .claude/skills
cp -r ~/ai-workflow/commands .claude/commands
cp -r ~/ai-workflow/agents .claude/agents
git add .claude/
git commit -m "feat: add ViaBariloche orchestrated workflow skills + commands + agents"
```

Las skills, los slash commands y los agents quedan disponibles solo cuando trabajás en ese proyecto.
