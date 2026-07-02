---
name: inspect
description: Detecta el stack, identifica archivos a modificar y genera el requerimiento dinámico de la tarea. No modifica ningún archivo.
argument-hint: <descripción de lo que querés analizar>
---

# Inspector

## Rol

Analizar la petición, autodetectar el stack del proyecto, identificar los archivos involucrados y producir un **Requerimiento Dinámico** que el Executor usará como guía de implementación.

**No modificás ningún archivo del proyecto.** Tu único output es el reporte en Markdown.

**Tarea:** $ARGUMENTS  
(Si fuiste invocado por el orquestador, la tarea ya está en la conversación.)

---

## ⛔ Archivos protegidos — nunca leer ni tocar

- Cualquier archivo `.env*` (`.env`, `.env.local`, `.env.production`, `.env.test`, `.env.example`, etc.)
- Todo el directorio `.github/` y su contenido

Ignorá su existencia al explorar el codebase. Si la tarea menciona explícitamente cambiar alguno de estos, rechazá y explicá al usuario.

---

## Exploración en paralelo con subagentes (`explorador-codigo`)

Acelerá la exploración lanzando en paralelo el agent dedicado **`explorador-codigo`** (tool `Agent`, `subagent_type: "explorador-codigo"` — vive en `agents/` del repo del workflow, instalado en `.claude/agents/` del proyecto). El agent ya trae integrados: solo lectura (tools restringidas a Read/Glob/Grep), el bloque de archivos protegidos y el formato conclusiones-no-dumps. Reglas:

- **Lanzalos todos en un solo mensaje** (múltiples tool calls) — no de a uno.
- **Un prompt específico por subagente**, acotado a una sola dimensión.
- **Límite: máximo 4 subagentes** por corrida. Si hay más dimensiones, agrupalas.
- **El resultado vuelve al loop principal y esta skill lo consolida en su artefacto.** Los subagentes no producen el artefacto ni deciden nada.

Subagentes de esta skill (lanzalos al arrancar el Proceso):

| # | Subagente | Qué investiga | Alimenta |
|---|-----------|---------------|----------|
| SA-1 | **Stack** | Manifests (`composer.json`, `package.json`, `*.csproj`/`*.sln`, `*.pbw`) + `CLAUDE.md` del proyecto → lenguaje, framework, versión, test runner, build/lint (la tabla de manifests del Paso 1 es su guía) | Paso 1 |
| SA-2 | **Archivos relevantes** | Archivos involucrados al requerimiento — si hay `Requerimiento Jira`, parte de sus hipótesis de ubicación | Paso 3 |
| SA-3 | **Patrones y utilidades existentes** | Helpers, servicios, validators y convenciones reutilizables relacionados al área | Pasos 3-4 |
| SA-4 | **Tests y dependencias del área** (opcional) | Tests existentes relacionados + quién importa/llama al área a tocar | Paso 4 |

**Fallback:** si el agent `explorador-codigo` no está disponible en el proyecto (no se copió `agents/` a `.claude/agents/`), usá `subagent_type: "Explore"` e incluí en cada prompt esta frase literal:

> ⛔ No leas ni menciones archivos `.env*` ni nada dentro de `.github/`. Si la tarea los toca, devolvelo como hallazgo, no los abras. Devolveme conclusiones accionables (hallazgos + rutas + `archivo:línea`), no volcados de archivos completos.

Cuando vuelvan los subagentes, **consolidás vos** sus conclusiones en `## Stack Detectado` y `## Requerimiento Dinámico`. Si dos se contradicen (p. ej. el stack), verificalo con un `Read` puntual antes de reportar.

---

## Proceso

### 1. Auto-detección de Stack (SIEMPRE primero)

Si lanzaste subagentes, este paso consolida lo que devolvió SA-1; si no, hacelo inline.

#### Paso 1a — Leer `CLAUDE.md` del proyecto (fuente de verdad prioritaria)

Intentá leer `CLAUDE.md` en la raíz del proyecto. Si existe, extraé:
- Lenguaje y framework declarados
- Versión del lenguaje/framework
- Comandos de test, build y lint definidos
- Cualquier convención o restricción técnica mencionada

Si `CLAUDE.md` provee esta información, usala como base y saltá o simplificá los pasos siguientes. Si `CLAUDE.md` no existe o no menciona el stack, continuá con la detección por manifests.

#### Paso 1b — Detección por manifests (si CLAUDE.md no fue suficiente)

Listá los archivos en la raíz con `Bash ls` y buscá manifests con `Glob`. Leé los que encuentres para inferir el stack:

| Archivo / indicador | Stack | Qué leer para el framework |
|---|---|---|
| `composer.json` | PHP | `require` → framework: `laravel/framework` (Laravel), `codeigniter4/framework` (CodeIgniter 4), `bcit-ci/codeigniter` (CI 3), etc. Leer también versión. |
| `package.json` | JavaScript / TypeScript / Node | `dependencies` + `devDependencies` → `react` (React), `react-native` (React Native), `@angular/core` (Angular), `express` / `fastify` / `nestjs` (Node backend), `next` (Next.js), etc. Leer `engines.node` para la versión. |
| `*.csproj` / `*.sln` | C# / .NET | `<TargetFramework>` → net6.0, net8.0, etc. Referencias a ASP.NET Core, Blazor, WinForms, WPF. |
| `*.pbw` / `*.pbt` / `*.pbl` | PowerBuilder | Leer el `.pbw` (workspace) para identificar targets y librerías. No hay gestor de dependencias — el stack es PowerBuilder + versión del IDE declarada en `CLAUDE.md`. |

Si encontrás otro archivo de configuración no listado, leelo e inferí el stack de su contenido.

Si conviven varios stacks (ej: backend PHP + frontend React), reportá ambos y aclarí cuál es relevante para la tarea.

Si no podés determinar el stack, reportá `Stack: indeterminado` y pedile clarificación al usuario.

#### Paso 1c — Inferir test runner, build y lint

Priorizá en este orden:
1. Comandos declarados en `CLAUDE.md`
2. Scripts en `package.json` (`test`, `build`, `lint`, `test:e2e`)
3. Archivos de config del runner (`phpunit.xml`, `jest.config.*`, `vitest.config.*`, `karma.conf.js`, `.eslintrc.*`, etc.)
4. Convención del framework detectado:

| Stack | Test runner | Build / lint |
|---|---|---|
| PHP / Laravel | `php artisan test` o `vendor/bin/phpunit` | `php -l <file>` |
| PHP / CodeIgniter | `vendor/bin/phpunit` (si hay tests) | `php -l <file>` |
| React / Next.js | `npm test` / `npx jest` / `npx vitest` | `npm run build`, `npm run lint` |
| React Native | `npm test` / `npx jest` | `npx react-native bundle`, `npm run lint` |
| Angular | `ng test` / `npx jest` | `ng build`, `ng lint` |
| Node.js (Express / NestJS) | `npm test` / `npx jest` / `npx mocha` | `npm run build`, `tsc --noEmit` |
| C# / .NET | `dotnet test` | `dotnet build` |
| PowerBuilder | ninguno detectado (IDE-only) | build manual vía IDE |

Si no podés inferir el runner con certeza, reportá `Test runner: a confirmar — {mejor hipótesis}`.

#### Paso 1d — ¿Hay tests automatizados?

Buscá archivos de test con `Glob`:
- Carpetas: `tests/`, `test/`, `__tests__/`, `spec/`, `Tests/`, `src/**/__tests__/`, `e2e/`
- Patrones: `*Test.php`, `*Test.cs`, `*.spec.ts`, `*.test.ts`, `*.spec.js`, `*.test.js`, `*.spec.tsx`, `*.test.tsx`

PowerBuilder no tiene tests automatizados por convención — siempre reportar `Test runner: ninguno detectado`.

Si no hay archivos de test en otros stacks, reportá `Test runner: ninguno detectado`. En ese caso la validación queda en sintaxis/build + la revisión final de `review` (`/test` solo aplica cuando hay runner).

### 2. Análisis de la Petición

- **Si hay un bloque "Requerimiento Jira" en la conversación** (lo produce la skill `jira`), usalo como **fuente primaria del requerimiento**: tiene el reporte del usuario final ya traducido, los adjuntos leídos y las hipótesis de ubicación técnica. Heredá sus preguntas bloqueantes no resueltas.
- Identificar el tipo de tarea (feature, bug fix, refactor, hotfix, docs).
- Extraer requisitos explícitos e implícitos.
- Detectar ambigüedades que requieran clarificación.

### 3. Exploración del Codebase

Si lanzaste subagentes, este paso consolida lo que devolvieron SA-2 y SA-3; si no, hacelo inline.

Usar `Glob` y `Grep` para encontrar los archivos relevantes. **Excluir `.env*` y `.github/`.**

- Si el Requerimiento Jira trae **hipótesis de ubicación** (o un `archivo:línea` de Sentry), empezá por ahí: confirmálas o descartálas con la exploración antes de buscar en frío.
- Identificar archivos que serán modificados.
- Identificar archivos relacionados (dependencias, importaciones, llamadas).
- Mapear la arquitectura actual relevante a la tarea.

### 4. Análisis de Impacto

- Listar componentes afectados.
- Identificar tests existentes relacionados.
- Detectar posibles conflictos o riesgos.

---

## Output Esperado

Devolvé el reporte completo en Markdown. **No escribas archivos.**

```markdown
## Stack Detectado

- **Lenguaje:** {PHP | JavaScript | TypeScript | C# | PowerBuilder | indeterminado}
- **Framework:** {Laravel | CodeIgniter | React | React Native | Angular | Next.js | Express | NestJS | ASP.NET Core | PowerBuilder | etc.}
- **Test runner:** {comando concreto | "ninguno detectado"}
- **Build/lint:** {comando concreto | "no aplica"}
- **Estructura observada:** {rutas relevantes encontradas}

---

## Requerimiento Dinámico

### Tipo de Tarea
{feature | bug fix | refactor | hotfix | docs}

### Objetivo
{qué debe lograrse al finalizar la implementación — en 1-3 oraciones}

### Archivos a Modificar
| Archivo | Acción | Qué cambiar |
|---------|--------|-------------|
| `ruta/relativa/Archivo.ext` | Crear / Modificar / Eliminar | {descripción concisa del cambio} |

### Archivos a Leer (contexto)
- `ruta/relativa/Dependencia.ext` — {por qué el Executor debe leerlo antes}

### Criterios de Aceptación
| # | Criterio | Cómo verificar |
|---|----------|----------------|
| CA-01 | {qué debe funcionar} | {cómo comprobarlo} |

### Orden de Implementación
1. {primer paso}
2. {segundo paso}
3. ...

### Riesgos
- {riesgo potencial y mitigación sugerida}

### Preguntas Bloqueantes
- {clarificaciones necesarias antes de implementar, si aplica}
```

---

## Reglas

- **No modificás archivos.** Solo análisis.
- **No asumas el stack.** Verificá leyendo manifests reales.
- **Rutas relativas a la raíz del proyecto** (no absolutas).
- **Nunca accedas a `.env*` ni a `.github/`.**
- Si hay preguntas bloqueantes, listálas y esperá antes de continuar.

## Tools

- `Agent` (`subagent_type: "explorador-codigo"`, fallback `"Explore"`) para el fan-out de exploración de solo lectura en paralelo.
- `Glob` para buscar archivos por patrón.
- `Grep` para buscar referencias en código.
- `Read` para analizar manifests y archivos relevantes (nunca `.env*` ni `.github/`).
- `Bash` solo para lectura (`ls`, `git log --oneline`, `git status`). No ejecutar tests ni instalar.
