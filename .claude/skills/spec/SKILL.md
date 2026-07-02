---
name: spec
description: Genera una especificación técnica completa basada en el análisis del Inspector. Es interactivo — presenta opciones de diseño al usuario y permite ajustarlas paso a paso antes de generar el documento. El spec se devuelve como mensaje en contexto, no se escribe a disco.
argument-hint: <descripción de la tarea>
---

# Spec

## Rol

Generar un documento de especificación técnica completo, agnóstico de lenguaje, basado en el análisis del Inspector. El spec sirve de contrato entre el usuario y el Executor.

**El spec es interactivo:** antes de generar el documento, presentá al usuario las opciones de diseño que se van a tener en consideración y dejalo ajustar cada decisión.

**El spec vive en la conversación, no en disco.**

**Tarea:** $ARGUMENTS  
(Si fuiste invocado por el orquestador `/workflow`, la tarea y el reporte del Inspector ya están en la conversación — leelos arriba.)

---

## Proceso

### 1. Revisión del Análisis del Inspector

- Buscá el reporte del Inspector más arriba en la conversación (bloque `## Stack Detectado` y `## Resumen de Análisis`).
- Tomá nota del **Stack Detectado** — define convenciones, APIs disponibles y el formato del plan de verificación.
- Si no hay reporte del Inspector en la conversación, ejecutá primero una mini-detección de stack leyendo el manifest del proyecto.
- Validá que no haya ambigüedades pendientes. Si las hay, listálas como "Preguntas Bloqueantes" y devolvé al usuario antes de generar el spec.

### 2. Decisiones de Diseño con el Usuario (interactivo)

Antes de escribir el documento, presentá las decisiones clave con `AskUserQuestion` — una pregunta por decisión, en este orden, **solo las que apliquen a la tarea**:

#### 2a. Enfoque de diseño (siempre)

Derivá 2–4 alternativas concretas del análisis del Inspector y del stack detectado. Ejemplos según el caso: "Service + Form Request" / "Controller directo" / "Action dedicada"; "extender clase existente" / "componente nuevo"; "lógica en código" / "lógica en stored procedure".

- `header`: corto (ej. "Enfoque").
- Cada opción con `label` breve y su **trade-off** en `description` (complejidad, consistencia con el proyecto, mantenibilidad).
- Poné primero la opción que recomendás, con "(Recomendado)".

#### 2b. Alcance y contratos (si la tarea toca interfaces)

Versionado de endpoint ("nueva `/v2`" / "extender `/v1` compatible" / "reemplazo breaking"), modelo de datos, compatibilidad con consumidores existentes.

#### 2c. Plan de verificación (siempre)

Cómo se va a verificar el resultado: build/lint, validación manual paso a paso, o tests automatizados **solo si el proyecto tiene runner** (se ejecutan aparte con `/test` — el spec solo lo especifica, no lo ejecuta).

#### 2d. Confirmación final

Resumí las decisiones tomadas y preguntá con `AskUserQuestion`: **Aprobar** / **Ajustar**. Si elige Ajustar, volvé a la pregunta correspondiente e incorporá el cambio (máximo 2 vueltas de ajuste; después generá el documento con lo último acordado y dejá nota de lo pendiente).

> **Degradación no interactiva:** si no se puede preguntar (entorno batch), presentá las opciones como texto, asumí la recomendada y registrá en el documento: "Decisión asumida por falta de interactividad: {opción}".

### 3. Diseño de la Solución (según lo aprobado)

- Definí la arquitectura acorde al stack detectado y al **enfoque elegido por el usuario**.
- Especificá cambios en cada archivo (qué se crea, modifica, elimina).
- Diseñá interfaces y contratos (firmas, schemas de request/response, contratos de DB).
- Planificá el orden de implementación.

### 4. Definir Criterios de Aceptación

- Requisitos funcionales verificables (tabla RF-XX).
- Requisitos no funcionales con métrica (tabla RNF-XX).
- Criterios de éxito medibles.

### 5. Plan de Verificación (según lo elegido en 2c)

- **Si hay test runner y el usuario eligió tests** → "Plan de Tests": tabla con tests Unitarios / Integración / Edge cases siguiendo la convención del runner (PHPUnit, xUnit, Jest, Jasmine/Karma, etc.). Se ejecutan con el comando individual `/test`.
- **Si NO hay test runner** → "Plan de Validación Manual": tabla `Caso de uso → Pasos → Resultado esperado`. Solo se especifica — no se ejecuta nada en esta skill.

---

## Output

Devolvé el spec como mensaje, en formato Markdown, **reflejando las decisiones aprobadas por el usuario**. **No escribas archivos.**

```markdown
# Especificación Técnica: {TÍTULO}

**Stack:** {del Inspector}
**Tipo:** {feature | refactor | fix con spec}
**Decisiones aprobadas:** {enfoque elegido} · {alcance/contrato} · {modo de verificación}

## 1. Resumen
{Descripción breve y objetivo principal}

## 2. Contexto

### 2.1 Situación Actual
{Estado actual del sistema relevante a esta tarea}

### 2.2 Problema/Necesidad
{Qué problema resuelve o qué necesidad satisface}

## 3. Requisitos

### 3.1 Funcionales
| ID | Requisito | Criterio de Aceptación |
|----|-----------|------------------------|
| RF-01 | {requisito} | {cómo verificar} |

### 3.2 No Funcionales
| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-01 | {requisito} | {valor objetivo} |

## 4. Diseño Técnico

### 4.1 Arquitectura
{Descripción + diagrama ASCII si aplica. Indicá qué opción de diseño se eligió y por qué.}

### 4.2 Archivos a Modificar
| Archivo | Tipo de Cambio | Descripción |
|---------|----------------|-------------|
| `ruta/relativa.ext` | Crear/Modificar/Eliminar | {detalle} |

### 4.3 Interfaces y Contratos
{Firmas de funciones, schemas, contratos. Usar el lenguaje del stack detectado.}

### 4.4 Modelos de Datos
{Cambios en DB / esquemas / DTOs si aplica}

## 5. Plan de Implementación

### Paso 1: {nombre}
- Archivo: `ruta`
- Acción: {descripción}

## 6. Plan de Verificación

{Según lo elegido en 2c — esto se especifica, no se ejecuta acá.}

### 6.1 Tests Automatizados (solo si hay runner — se ejecutan con `/test`)
| Test | Descripción | Archivo |
|------|-------------|---------|
| `nombreDelTest` | {qué valida} | `ruta/test/...` |

### 6.2 Validación Manual (si no hay test runner)
| Caso | Pasos | Resultado esperado |
|------|-------|--------------------|
| CV-01 | 1. ... 2. ... | {qué debe verse/retornar} |

### 6.3 Casos Edge
- {caso edge a considerar}

## 7. Riesgos y Mitigaciones
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| {riesgo} | Alta/Media/Baja | Alto/Medio/Bajo | {acción} |

## 8. Checklist Pre-Implementación
- [ ] Stack confirmado
- [ ] Requisitos claros y completos
- [ ] Archivos identificados existen
- [ ] Plan de verificación definido
- [ ] Riesgos identificados
```

---

## Principios de Diseño (agnósticos)

- **Single Responsibility** — cada componente con una razón clara para cambiar.
- **Métodos pequeños y descriptivos** — nombres expresivos.
- **Sin código duplicado** — si aparece tres veces, extraer.
- **Validación en el borde del input** — no propagar datos sin validar al núcleo.
- **Capa de servicios cuando aplique** — separar lógica de negocio de controladores/UI.
- **Manejo adecuado de errores** — fallar visiblemente al borde del sistema.
- **Respuestas consistentes con el contrato existente.**

## Uso de context7

Cuando la especificación involucre librerías de terceros (aparecen en el manifest del proyecto), citá APIs reales:

1. `mcp__context7__resolve-library-id` con el nombre de la librería.
2. `mcp__context7__query-docs` con el `libraryId` y un query específico.
3. Incluí en el spec: nombre exacto del método/clase, parámetros, y referencia del fragmento relevante.

Si la librería no está indexada o el MCP no está disponible, usá `WebFetch` sobre la doc oficial de la versión instalada.

## Reglas

- **No implementes código.** Solo el spec como mensaje.
- **No escribas archivos.**
- **No generes el documento sin pasar por las decisiones del paso 2** (salvo degradación no interactiva, que debe quedar registrada).
- Máximo 2 vueltas de ajuste en la confirmación final.
- Si la información del Inspector es insuficiente, listá "Preguntas Bloqueantes" en vez de inventar.

## Tools

- `AskUserQuestion` para las decisiones de diseño y la confirmación final.
- `Read`, `Glob`, `Grep` para explorar el codebase si necesitás más contexto.
- `mcp__context7__resolve-library-id` y `mcp__context7__query-docs` para validar APIs de librerías.
- `WebFetch` como fallback si context7 no está disponible.
