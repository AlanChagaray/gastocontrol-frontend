---
name: review
description: Revisión final del ciclo completo (plan/inspect/spec → execute → security). Verifica patrones de diseño, convenciones del proyecto y que el resultado cumpla el requerimiento original. Puede corregir issues menores con aprobación por archivo; escala lo mayor.
argument-hint: [qué revisar — opcional; usa el ciclo visible en el chat por default]
---

# Review

## Rol

Última etapa de **todos** los flujos del workflow, después de `security`. Revisa el ciclo completo de principio a fin y verifica que el resultado sea el esperado:

1. ¿Se cumplió el requerimiento original (y el plan/spec si hubo)?
2. ¿El código respeta los patrones de diseño y convenciones del proyecto?
3. ¿Las correcciones de Security no rompieron el diseño?

**Qué revisar:** $ARGUMENTS (si especificado), o el ciclo completo visible en la conversación.

---

## ⛔ Archivos protegidos — nunca modificar

- Cualquier archivo `.env*` ni el directorio `.github/`.
- Si fueron tocados durante el ciclo, reportalo como issue crítico.

---

## Exploración en paralelo con subagentes (`verificador-review`)

Acelerá el Paso 3 (Verificaciones) lanzando en paralelo el agent dedicado **`verificador-review`** (tool `Agent`, `subagent_type: "verificador-review"` — vive en `agents/` del repo del workflow, instalado en `.claude/agents/` del proyecto). El agent ya trae integrados: solo lectura (Read/Glob/Grep — **no puede editar**), el bloque de archivos protegidos y el formato cumplido/incumplido + evidencia `archivo:línea` con clasificación menor/mayor. Reglas:

- **Lanzalos todos en un solo mensaje** (múltiples tool calls) — no de a uno.
- **Un prompt específico por subagente**, acotado a una sola dimensión.
- **Límite: máximo 5 subagentes** por corrida. Si hay más dimensiones, agrupalas.
- **El resultado vuelve al loop principal y esta skill lo consolida en su reporte.** Los subagentes no producen el reporte ni emiten veredicto.

Reparto sugerido (máx 5; agrupá si hace falta):

| # | Subagente | Qué verifica |
|---|-----------|--------------|
| SA-1..n | **Criterios CA-XX** | Uno por criterio (agrupados por área si son más de 3): ¿está cumplido en el código final? Evidencia `archivo:línea`. |
| SA-P | **Patrones de diseño** | La solución sigue el patrón del spec (si hubo) y los del proyecto (capas, servicios, errores). |
| SA-C | **Convenciones** | Naming, idioma, estructura, estilo vs. código vecino. |
| SA-X | **Impacto cruzado** (opcional) | Solo si el plan listó consumidores en otros proyectos: ¿se cubrió/avisó cada uno? |

**Fallback:** si el agent `verificador-review` no está disponible en el proyecto (no se copió `agents/` a `.claude/agents/`), usá `subagent_type: "Explore"` e incluí en cada prompt esta frase literal:

> ⛔ No leas ni menciones archivos `.env*` ni nada dentro de `.github/`. Si la tarea los toca, devolvelo como hallazgo, no los abras. Devolveme conclusiones accionables (hallazgos + rutas + `archivo:línea`), no volcados de archivos completos.

**El veredicto final NO se delega**: `✓ APROBADO` / `⚠ APROBADO CON OBSERVACIONES` / `✗ REQUIERE AJUSTE` lo decidís VOS consolidando los hallazgos. Las correcciones menores siguen en el loop principal con el protocolo por archivo (diff → Aprobar/Ajustar/Saltar → `Edit`). Un subagente nunca edita ni emite veredicto.

---

## Proceso

### 1. Reconstrucción del ciclo

Releé en la conversación, en orden, todo lo que haya participado:

- La **tarea original** del usuario.
- El **plan** (si la skill `plan` participó) — proyectos involucrados e impacto cruzado.
- El **Requerimiento Dinámico** del Inspector (si participó) — criterios CA-XX.
- La **especificación** del Spec (si participó) — decisiones de diseño aprobadas por el usuario.
- El **Informe Previo de Cambios** del Executor (solo flujos sin spec) — diagnóstico y enfoque que el usuario confirmó antes de implementar. Auditá que el resultado final siga ese enfoque y revisá los desvíos declarados.
- El **reporte del Executor** — archivos aplicados, ajustados y saltados.
- El **reporte de Security** — vulnerabilidades y correcciones aplicadas.

### 2. Relectura del estado final

- Leé los archivos modificados/creados **en disco** (estado final, post-correcciones de Security).
- Leé archivos vecinos representativos para comparar convenciones.

### 3. Verificaciones

Si lanzaste subagentes `verificador-review`, este paso consolida sus hallazgos; si no, hacelo inline.

| Dimensión | Qué verificar |
|-----------|---------------|
| **Resultado esperado** | Cada CA-XX del Requerimiento (o cada objetivo de la tarea) está cumplido en el código final. Archivos saltados en execute = CA potencialmente incumplido. |
| **Patrones de diseño** | La solución sigue el patrón elegido en el spec (si hubo) y los patrones del proyecto (capas, servicios, inyección, manejo de errores). |
| **Convenciones** | Naming, idioma de comentarios, estructura de carpetas, estilo consistente con el código vecino. |
| **Post-security** | Las correcciones de Security no degradaron el diseño ni rompieron contratos. |
| **Impacto cruzado** | Si el plan listó consumidores en otros proyectos, verificá que se avisó/cubrió cada uno (protocolo de impacto cruzado del CLAUDE.md raíz). |
| **Integridad** | No se tocaron archivos fuera de lo acordado, ni `.env*` / `.github/`. |

### 4. Corrección acotada (solo issues menores)

- **Issues menores** (naming, convención, detalle de un patrón, comentario): podés corregirlos, pero **con el mismo protocolo de aprobación por archivo del Executor**:
  1. Proponé el cambio con diff en el chat, encabezado por la **ubicación navegable** `ruta/Archivo.ext:línea(s)` (ruta completa desde la raíz — clickeable para saltar al punto exacto) y con números de línea visibles en el diff.
  2. `AskUserQuestion` (la pregunta incluye la ubicación `ruta:línea(s)`): **Aprobar** / **Ajustar** / **Saltar**.
  3. Solo si se aprueba: `Edit`. Después re-validá sintaxis/build del archivo tocado.
- **Issues mayores** (CA incumplido, diseño incorrecto, contrato roto): **NO edites.** Listá los ajustes concretos (archivo, qué cambiar, por qué) y escalá al usuario con decisión `✗ REQUIERE AJUSTE`.
- Si no se puede preguntar (entorno no interactivo): no edites nada — listá todas las correcciones propuestas como pendientes.

---

## Output: Reporte de Review

```markdown
# Reporte de Review: {TÍTULO}

**Ciclo revisado:** {plan → }{inspect → }{spec → }execute → security
**Stack:** {del Inspector, o detectado}
**Decisión:** ✓ APROBADO | ⚠ APROBADO CON OBSERVACIONES | ✗ REQUIERE AJUSTE

## 1. Cumplimiento del Requerimiento

| Criterio / Objetivo | Estado | Evidencia |
|---------------------|--------|-----------|
| CA-01: {criterio} | ✓/✗ | {archivo:línea o explicación} |

## 2. Patrones y Convenciones

- [ ] Sigue el enfoque de diseño aprobado en el spec (si hubo)
- [ ] Consistente con patrones del proyecto (capas, servicios, errores)
- [ ] Naming y estilo coherentes con el código vecino
- [ ] Correcciones de Security sin regresiones de diseño
- [ ] Impacto cruzado cubierto o avisado (si aplicó plan)
- [ ] Sin archivos tocados fuera de lo acordado

## 3. Correcciones Aplicadas en Review

| Archivo | Issue | Estado |
|---------|-------|--------|
| `ruta` | {menor — naming} | Aplicado con aprobación / Saltado |

## 4. Ajustes Pendientes (si REQUIERE AJUSTE)

| # | Archivo | Qué ajustar | Por qué |
|---|---------|-------------|---------|

## 5. Decisión

**{✓ APROBADO | ⚠ APROBADO CON OBSERVACIONES | ✗ REQUIERE AJUSTE}**
{Justificación en una o dos líneas}
```

---

## Criterios de Decisión

### ✓ APROBADO
- Todos los CA cumplidos, convenciones respetadas, sin issues (o solo menores ya corregidos con aprobación).

### ⚠ APROBADO CON OBSERVACIONES
- Resultado correcto, pero quedan issues menores no corregidos (saltados o pendientes) documentados.

### ✗ REQUIERE AJUSTE
- Algún CA incumplido, diseño incorrecto o contrato roto. Listá los ajustes y escalá al usuario — el orquestador puede relanzar `execute → security → review` si el usuario acepta.

---

## Reglas

- **Solo editás issues menores y siempre con aprobación previa del usuario** (diff + Aprobar/Ajustar/Saltar). Lo mayor se escala, no se corrige acá.
- **Nunca modifiques `.env*` ni `.github/`.**
- No reformatees código que no tiene issues.
- El reporte va en contexto, no en disco.
- **Los subagentes solo verifican** — el veredicto final y los `Edit` son de esta skill, en el loop principal con aprobación.
- **Al cerrar** (veredicto `✓ APROBADO` o `⚠ APROBADO CON OBSERVACIONES`), agregá una línea recomendando entender los cambios: `💡 Para una explicación didáctica de qué se cambió y por qué (con foco en aprender el lenguaje), corré /teach.` Es opcional y no forma parte del veredicto.

## Tools

- `Agent` (`subagent_type: "verificador-review"`, fallback `"Explore"`) para verificar CA-XX y patrones/convenciones en paralelo (solo verificación; veredicto y correcciones quedan en esta skill).
- `Read`, `Glob`, `Grep` para releer el código final y compararlo con el vecino.
- `AskUserQuestion` para la aprobación de cada corrección menor.
- `Edit` solo tras aprobación explícita.
- `Bash` para re-validar sintaxis/build de archivos corregidos.
