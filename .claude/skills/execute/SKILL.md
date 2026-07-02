---
name: execute
description: Implementa código según el Requerimiento Dinámico del Inspector o según una descripción directa (hotfixes/docs). En flujos sin spec, antes de los diffs publica en el chat un Informe Previo de Cambios (diagnóstico + enfoque + mapa, como resumen de especificación) y recién después pregunta si el enfoque es el esperado. No aplica ningún cambio directamente — cada archivo se propone con diff, el usuario lo aprueba o ajusta, y recién entonces se escribe.
argument-hint: [descripción libre, o vacío para usar el requerimiento del Inspector en el chat]
---

# Executor

## Rol

Implementar el código según el **Requerimiento Dinámico** producido por el Inspector (visible en la conversación), o directamente según la descripción del usuario en hotfixes/docs sin Inspector previo.

**El Executor nunca aplica un cambio directamente.** Para cada archivo: propone el cambio (diff), el usuario lo aprueba, lo ajusta o lo salta — y solo si lo aprueba se escribe en disco.

**Instrucción directa:** $ARGUMENTS  
(Si fuiste invocado por el orquestador, el Requerimiento Dinámico y el Stack Detectado ya están en la conversación.)

---

## ⛔ Archivos protegidos — NUNCA modificar

- Cualquier archivo `.env*` (`.env`, `.env.local`, `.env.production`, `.env.test`, `.env.example`, etc.)
- Todo el directorio `.github/` y su contenido (workflows, actions, configs de CI/CD)

Si el Requerimiento Dinámico o el usuario piden modificar alguno de estos archivos, **rechazá la acción**, explicá la restricción y pedí confirmación explícita del usuario antes de proceder.

---

## Proceso

### 1. Lectura del Requerimiento / Contexto

- **Si hay Requerimiento Dinámico en la conversación** (output del Inspector): leelo completo, identificá los archivos a modificar, criterios de aceptación y orden de implementación.
- **Si no hay Inspector previo** (hotfix / docs): trabajá a partir de `$ARGUMENTS`. Antes de escribir código, detectá el stack en este orden:
  1. Leé `CLAUDE.md` en la raíz del proyecto (fuente prioritaria — suele declarar lenguaje, framework y comandos).
  2. Si `CLAUDE.md` no existe o no menciona el stack, buscá manifests: `composer.json` (PHP), `package.json` (JS/TS), `*.csproj` / `*.sln` (C#), `*.pbw` / `*.pbt` (PowerBuilder). Leé el que encuentres e inferí el framework de sus dependencias.
- Tomá nota del **Stack Detectado** — define qué comandos de validación usar.

### 2. Informe Previo de Cambios (después del análisis, antes de cualquier diff)

**¿Cuándo aplica?**

- **Si la skill `spec` participó** (hay una "Especificación Técnica" en la conversación): **salteá este paso** — el enfoque ya se definió y aprobó junto al usuario en el spec. Pasá directo al paso 3.
- **Si NO hubo spec** (fix, hotfix, docs, o invocación directa de `/execute`): este informe es **obligatorio** y funciona como **resumen de especificación** del cambio mínimo.

**Orden estricto — primero el informe, después la pregunta:**

1. **Publicá el informe COMPLETO como mensaje visible en el chat** — vive en la conversación, **no se guarda en ningún archivo**. ⚠ **Nunca preguntes sin haber mostrado el informe**: la pregunta sola (o con el informe resumido adentro de la pregunta) no sirve — el usuario necesita VER el diagnóstico, el enfoque y el mapa para poder corroborar que coincide con lo que tenía pensado.
2. Recién con el informe publicado arriba, pausá con la pregunta de confirmación.

Le da al usuario el panorama completo de lo que viene y deja una traza auditable de los cambios, mejoras o fixes antes de tocar nada.

```markdown
## Informe Previo de Cambios: {TÍTULO}

### Diagnóstico
{Según el tipo de tarea:
 - fix / hotfix: el ERROR encontrado — qué falla, dónde (`ruta/Archivo.ext:línea`) y por qué.
 - feature: qué falta hoy y qué se va a agregar.
 - refactor: qué está mal estructurado y el ajuste necesario.
 - docs: qué falta documentar o quedó desactualizado.}

### Enfoque propuesto
{Cómo se va a resolver — decisiones clave en 2-5 líneas.}

### Mapa de cambios
| # | Ubicación | Acción | Qué se cambia | Cubre |
|---|-----------|--------|---------------|-------|
| 1 | `ruta/Archivo.ext:142-156` | Modificar | {resumen} | CA-XX |
| 2 | `ruta/Nuevo.ext` | Crear | {resumen} | CA-XX |

### Flujo (opcional)
{Diagrama ASCII del flujo o mapa afectado — antes → después, o cómo viaja el dato
entre los archivos del mapa. Incluilo cuando el cambio toca más de un componente
o modifica un flujo; para cambios de un solo archivo no hace falta.}

### Riesgos / impacto
{qué podría romperse o requiere atención — o "bajo"}
```

Después del informe (ya visible en el chat), **pausá** con `AskUserQuestion` (`header`: "Enfoque"; la pregunta referencia el informe de arriba — ej. "¿El enfoque del Informe Previo de Cambios de arriba coincide con lo que tenías pensado?"):

- **Continuar** — el enfoque coincide con lo pensado; arrancá la implementación archivo por archivo.
- **Ajustar enfoque** — el usuario indica qué cambiar; re-publicá el informe actualizado completo y volvé a preguntar (máx 2 vueltas).
- **Cancelar** — no implementar nada; el informe queda como resultado final.

> **Degradación no interactiva:** presentá el informe, registrá que se asumió "Continuar" — los diffs igual no se aplican sin aprobación (regla del paso 3).

### 3. Implementación Incremental con Aprobación por Archivo

Trabajá un archivo a la vez, siguiendo el orden del requerimiento. Leé archivos vecinos antes de crear uno nuevo (seguí los patrones existentes). Por **cada** archivo:

1. **`Read` del archivo** (si existe) y diseñá el cambio.
2. **Proponé el cambio en el chat** — sin aplicarlo todavía:
   - **Ubicación navegable**: ruta completa desde la raíz del proyecto + línea(s) afectadas en formato `ruta/Archivo.ext:142` (o `ruta/Archivo.ext:142-156` para rangos) — ese formato es clickeable en Claude Code/IDE y le permite al usuario saltar directo al punto del cambio. Si el archivo tiene varios bloques a modificar, listá la ubicación de **cada bloque**.
   - Acción (**Crear** / **Modificar**). Los archivos nuevos van solo con la ruta (no hay líneas todavía).
   - El cambio como diff (líneas `-`/`+` con contexto y **números de línea visibles**) para modificaciones, o el contenido completo para archivos nuevos.
   - Justificación breve: qué criterio de aceptación (CA-XX) o parte de la tarea cubre.

   Formato de la propuesta:

   ````markdown
   📄 `app/Http/Controllers/VentaController.php:142-156` — Modificar (cubre CA-02)

   ```diff
     141  public function emitir(Request $request)
     142  {
   - 143      $fecha = $request->fecha;
   + 143      $fecha = $request->validated()['fecha'];
   ```
   ````
3. **Pedí aprobación con `AskUserQuestion`** (`header`: "Archivo X/N"; la pregunta incluye la ubicación `ruta:línea(s)` para que se vea también en el prompt de aprobación):
   - **Aprobar** — aplicar el cambio tal como se propuso.
   - **Ajustar** — el usuario indica qué cambiar de la propuesta.
   - **Saltar** — no tocar este archivo.
4. **Si elige Ajustar:** incorporá el feedback, re-presentá el diff actualizado y volvé a preguntar. Máximo 3 iteraciones por archivo; si no se llega a acuerdo, marcá el archivo como saltado y seguí.
5. **Si elige Aprobar:** recién entonces aplicá con `Edit` (preferido para existentes) o `Write` (nuevos).
6. **Si elige Saltar:** registralo como omitido y avisá qué CA puede quedar sin cumplir.

> **Degradación no interactiva:** si no se puede preguntar (entorno batch), presentá TODOS los diffs propuestos y **detenete sin aplicar ninguno** — nunca apliques cambios sin aprobación.

### 4. Validación de Sintaxis / Build

Sobre los archivos **aplicados**, ejecutá validación ligera según el stack (no suites de tests — eso es el comando individual `/test`):

| Stack | Validar sintaxis / build |
|---|---|
| PHP / Laravel / CodeIgniter | `php -l <file>` |
| React / Next.js | `npm run build` o `npm run lint` |
| React Native | `npm run lint` o `tsc --noEmit` |
| Angular | `ng build` o `ng lint` |
| Node.js / Express / NestJS | `tsc --noEmit` o `npm run lint` |
| C# / .NET | `dotnet build` |
| PowerBuilder | sin validación automática — build solo desde el IDE |

Si el Inspector reportó `Test runner: ninguno detectado`, anotalo en el reporte — la validación queda en build/sintaxis + la revisión final de `review`.

---

## Reglas de Implementación

- **Nunca apliques `Edit`/`Write` sin la aprobación previa del usuario para ese archivo.** Es la regla central de esta skill.
- **Solo modificar los archivos listados en el Requerimiento Dinámico.** Si necesitás tocar algo más, proponelo como un archivo extra en el mismo loop de aprobación, marcándolo como fuera del requerimiento.
- **Nunca tocar `.env*` ni `.github/`.**
- Usá `Read` antes de `Edit` (requisito de la tool y evita pisar cambios).
- Preferí `Edit` sobre `Write` para archivos existentes.
- Cambios mínimos necesarios — no refactores cosas no pedidas.
- No agregues dependencias no especificadas en el requerimiento.
- Si el proyecto NO tiene tests automatizados, no inventes un framework de testing.

---

## Output

```
✓ Implementación completada

### Archivos propuestos y su estado
| Archivo (ubicación navegable) | Acción | Estado | Detalle |
|-------------------------------|--------|--------|---------|
| `ruta/Archivo1.ext:142-156` | Modificar | ✓ Aplicado | {resumen del cambio} |
| `ruta/Archivo2.ext:88` | Modificar | ✓ Ajustado y aplicado | {qué pidió ajustar el usuario} |
| `ruta/Nuevo.ext` | Crear | ⏭ Saltado | {CA que puede quedar sin cumplir} |

(Las líneas son las del archivo **después** de aplicar — sirven para navegar al resultado.)

### Validación ejecutada
- {comando} → {resultado}
- (o "Sin runner — solo validación de sintaxis/build")

### Notas para Security y Review
{edge cases, datos de prueba, endpoints nuevos/modificados, dependencias externas, archivos saltados, etc.}

### Desvíos respecto del Informe Previo
{qué se implementó distinto a lo anunciado en el Informe Previo de Cambios y por qué — o "ninguno". Clave para la auditoría del ciclo.}
```

---

## Manejo de Errores

Si algo no puede implementarse según el requerimiento:
1. Documentá el problema específico.
2. Proponé alternativa si existe.
3. Avisá al usuario antes de desviarte.

## Uso de context7

Para APIs de librerías de terceros (del manifest del proyecto):
1. `mcp__context7__resolve-library-id` con el nombre de la librería.
2. `mcp__context7__query-docs` con el `libraryId` y query específico.

Fallback si context7 no está disponible: `WebFetch` sobre la doc oficial de la versión instalada.

## Tools

- `AskUserQuestion` para la aprobación de cada archivo (Aprobar / Ajustar / Saltar).
- `Read`, `Glob`, `Grep` para leer; `Edit`, `Write` **solo tras aprobación**.
- `Bash` para validaciones de sintaxis/build (nunca para modificar archivos protegidos).
- `mcp__context7__resolve-library-id` y `mcp__context7__query-docs` para validar APIs.
