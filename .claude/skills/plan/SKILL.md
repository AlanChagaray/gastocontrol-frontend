---
name: plan
description: Planificación exhaustiva. Entra en plan mode para tareas complejas o que involucran varios proyectos del ecosistema (CLAUDE.md raíz / matriz de consumo). Mapea impacto cruzado antes de inspect. No modifica archivos.
argument-hint: <descripción de la tarea a planificar>
---

# Plan

## Rol

Planificar de forma exhaustiva una tarea **antes** de que arranque el ciclo de implementación (inspect → spec → execute → security → review). Se usa cuando la tarea es compleja o toca **más de un proyecto del ecosistema**.

**No modifica ningún archivo.** El resultado es un plan en la conversación que el resto del workflow usa como guía.

**Tarea:** $ARGUMENTS  
(Si fuiste invocado por el orquestador, la tarea ya está en la conversación.)

---

## ⛔ Protección global

- No se modifica ningún archivo en esta skill (es solo lectura).
- No accedés a `.env*` ni a `.github/`.

---

## Proceso

### 1. Entrar en plan mode

- Invocá la tool `EnterPlanMode` para que ningún cambio se aplique hasta que el usuario apruebe el plan.
- Si `EnterPlanMode` no está disponible en el entorno, avisalo explícitamente y continuá igual: el plan se presenta como texto y **nada se implementa** hasta la aprobación del usuario.

### 2. Mapa del ecosistema

- Buscá el **CLAUDE.md raíz** del workspace: empezá por la raíz del proyecto actual y subí de nivel hasta encontrar un CLAUDE.md que contenga un **mapa de proyectos** y una **matriz de consumo** (en este ecosistema vive en `Documents/CLAUDE.md`).
- Leé también el CLAUDE.md del proyecto actual (detalle técnico local).
- Si no existe un CLAUDE.md raíz con matriz, limitá el plan al proyecto actual y anotalo en el output.

### 3. Análisis de impacto cruzado

- **Si hay un bloque "Requerimiento Jira" en la conversación** (skill `jira`), usá sus hipótesis de ubicación técnica como punto de partida: ya mapean el reporte del usuario final a proyectos candidatos del ecosistema.

Determiná si la tarea altera un **contrato consumido por otros proyectos**:

- Endpoint (URL / verbo) o forma/nombres del JSON de respuesta.
- Claims del JWT, permisos, headers `X-*` reenviados por el gateway.
- Firma o salida de un stored procedure (`db*`).
- Rutas embebidas / protocolo de mensajes de iframes.

Con la **matriz de consumo** del CLAUDE.md raíz identificá los consumidores candidatos, y **confirmalos con `Grep`** en esos proyectos: buscá el host/puerto (`9500`, `8081`, `8000`, `vb-api`, `api.viatesting`), el nombre del endpoint, o el nombre del campo/SP que cambia.

#### Confirmación en paralelo con subagentes (`verificador-consumidores`)

Una vez que la matriz te da los proyectos candidatos, lanzá **un subagente por proyecto** con el agent dedicado **`verificador-consumidores`** (tool `Agent`, `subagent_type: "verificador-consumidores"` — vive en `agents/` del repo del workflow, instalado en `.claude/agents/` del proyecto). El agent ya trae integrados: solo lectura (Read/Glob/Grep), el bloque de archivos protegidos y el formato veredicto + evidencia `archivo:línea`. Reglas:

- **Lanzalos todos en un solo mensaje** (múltiples tool calls) — no de a uno.
- **Un prompt específico por subagente**: el proyecto a revisar + qué buscar (host/puerto, endpoint, campo, SP).
- **Límite: máximo 5 subagentes** por corrida. Si hay más candidatos, priorizá los de la matriz y agrupá el resto.
- **El resultado vuelve al loop principal y esta skill lo consolida** en la tabla `## 3. Impacto Cruzado`. Los subagentes no producen el plan ni deciden nada.

**Fallback:** si el agent `verificador-consumidores` no está disponible en el proyecto (no se copió `agents/` a `.claude/agents/`), usá `subagent_type: "Explore"` e incluí en cada prompt esta frase literal:

> ⛔ No leas ni menciones archivos `.env*` ni nada dentro de `.github/`. Si la tarea los toca, devolvelo como hallazgo, no los abras. Devolveme conclusiones accionables (hallazgos + rutas + `archivo:línea`), no volcados de archivos completos.

**El plan mode y la aprobación del usuario NO se delegan** — siguen en el loop principal.

### 4. Plan por fases

- Enumerá los archivos/áreas a tocar **por proyecto**.
- Definí el orden de implementación entre proyectos (qué se despliega primero, dependencias, compatibilidad hacia atrás).
- Incluí plan de rollback si el cambio es riesgoso (migraciones, contratos).

---

## Output

Devolvé el plan como mensaje en Markdown. **No escribas archivos.**

```markdown
# Plan: {TÍTULO}

## 1. Resumen
{Qué se va a hacer y por qué requiere planificación}

## 2. Proyectos Involucrados
| Proyecto | Rol en el cambio | Archivos/Áreas |
|----------|------------------|----------------|
| `api` | {expone el contrato que cambia} | {rutas} |
| `checkout` | {consumidor — confirmado con grep} | {rutas} |

## 3. Impacto Cruzado
| Contrato que cambia | Consumidores confirmados | Evidencia (grep) |
|---------------------|--------------------------|------------------|
| {endpoint/campo/SP} | {proyectos} | {archivo:línea} |

## 4. Plan por Fases
### Fase 1: {nombre} — proyecto `{x}`
- {paso}
### Fase 2: ...

## 5. Orden y Dependencias
{Qué va primero, compatibilidad hacia atrás, rollback}

## 6. Riesgos
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|

## 7. Preguntas Bloqueantes
- {pregunta — o "ninguna"}

## 8. Flujo Recomendado
{feature | fix | refactor} — {por qué}
```

---

## Reglas

- **No modifiques ningún archivo.** Plan es 100% lectura y análisis.
- Rutas relativas a la raíz de cada proyecto, prefijadas con el nombre del proyecto cuando haya varios.
- Si hay preguntas bloqueantes, listálas y esperá respuesta del usuario antes de cerrar el plan.
- El plan termina cuando el usuario lo aprueba — recién ahí el orquestador continúa con `inspect`.

## Tools

- `Agent` (`subagent_type: "verificador-consumidores"`, fallback `"Explore"`) para confirmar consumidores en paralelo, uno por proyecto candidato.
- `Read`, `Glob`, `Grep` para explorar los proyectos y confirmar consumidores.
- `Bash` solo para comandos de lectura (listar, buscar) — nunca para modificar.
- `EnterPlanMode` para activar plan mode (con degradación a plan-como-texto si no existe).
