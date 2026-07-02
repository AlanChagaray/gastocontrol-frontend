---
name: jira
description: Trae un requerimiento desde Jira (issue + comentarios + adjuntos + links de error) vía el MCP de Atlassian y lo traduce a contexto técnico con hipótesis de ubicación en el ecosistema. Solo lectura — nunca comenta ni modifica el ticket. Sin MCP conectado, lo informa y recomienda la conexión.
argument-hint: <clave del ticket (ej. GDM-123) o URL de Jira>
---

# Jira — Requerimiento como contexto

## Rol

Obtener el requerimiento completo desde Jira y **traducirlo a contexto técnico** para el workflow. Los tickets los cargan mayormente **usuarios finales** que describen síntomas ("no me deja emitir la boleta") sin saber dónde está el problema técnico — el requerimiento, sus adjuntos y sus links de error sirven justamente para ubicar dónde puede (o no) estar el ajuste.

**Solo lectura en Jira:** nunca comentar, transicionar, asignar ni editar el ticket. No modifica archivos del proyecto.

**Ticket:** $ARGUMENTS (clave tipo `GDM-123` o URL de Atlassian)

---

## Proceso

### 1. Detección del MCP de Atlassian (siempre primero)

Verificá si tenés tools del MCP de Atlassian/Jira disponibles (suelen llamarse `mcp__*Atlassian*__getJiraIssue`, `searchJiraIssuesUsingJql`, etc.; si no las ves, buscálas con `ToolSearch` "jira issue").

**Si NO está conectado o no estás autenticado**, informá al usuario y terminá devolviendo el control:

> ⚠ No tengo acceso al MCP de Atlassian/Jira. Te recomiendo conectarlo para que pueda traer el requerimiento completo del ticket (descripción, comentarios, capturas y links de error) — eso me da mucho más contexto para ubicar dónde está el ajuste.
> Cómo conectar: en Claude Code `/mcp` → Atlassian → autenticarse; o en claude.ai → Settings → Connectors → Atlassian. (En Enterprise suele estar habilitado por default — solo falta tu autenticación.)
> Mientras tanto sigo con la descripción que me diste.

El workflow continúa con el texto disponible — no es bloqueante.

### 2. Traer el issue

Con `getJiraIssue` (y `getJiraIssueRemoteIssueLinks` si aplica) obtené: **summary, description, estado, prioridad, reporter, comentarios, issues vinculados y lista de adjuntos**. Los comentarios suelen tener aclaraciones del usuario o diagnósticos previos de otros devs — leelos todos.

### 3. Adjuntos (capturas, PDF, Word u otros)

1. Listá todos los adjuntos (nombre, tipo, tamaño).
2. Intentá leerlos con las tools del MCP (ej. `fetch` sobre el adjunto). De cada uno extraé lo relevante:
   - **Capturas de pantalla** → pantalla/módulo visible, mensaje de error exacto, datos cargados.
   - **PDF / Word** → pasos descriptos, especificaciones, ejemplos de datos.
3. Si el MCP no permite descargar un adjunto → marcalo como **pendiente** y pedile al usuario que pegue la captura o arrastre el archivo al chat antes de continuar (especialmente si parece contener el mensaje de error).

### 4. Links a errores en el ticket

Detectá URLs en la descripción y comentarios:

- **Sentry** (caso principal):
  - Con **MCP de Sentry** conectado (tools `mcp__*Sentry*`; buscálas con `ToolSearch` "sentry"): traé el issue/evento — **stack trace, archivo/función donde se originó, environment, URL de la request, frecuencia, primera/última ocurrencia**. Esto suele resolver la ubicación técnica directamente.
  - Sin MCP de Sentry: recomendá conectarlo (igual que en el paso 1 — en Enterprise suele estar por default, solo autenticarse) y pedile al usuario que pegue el stack trace del link mientras tanto.
- **Otros links** (logs, dashboards): intentá `WebFetch` si son públicos; si requieren auth, marcálos pendientes y pedí el contenido al usuario.

### 5. Triage por ambiente — ¿amerita corrección?

Determiná **dónde se originó el error** usando el environment de Sentry y/o la URL reportada:

| Señal | Ambiente |
|---|---|
| environment `production` en Sentry, dominios productivos | **Producción** → continuar |
| hosts con `viatesting`, `localhost`, `127.0.0.1`, puertos de dev (4200, 9500 local…), environment `dev`/`qa`/`staging` | **Desarrollo / Testing** → ⚠ posible prueba |

**Si el origen es desarrollo o testing**: puede tratarse de pruebas y no ameritar corrección. Avisalo destacado y preguntá con `AskUserQuestion`:

- **Continuar** — es un bug real que también afecta (o afectará) producción.
- **Descartar** — era una prueba; el workflow termina acá y se le informa al usuario qué responder en el ticket.

Si es producción o no se puede determinar: continuá, anotando el ambiente como "a confirmar" cuando no haya certeza.

### 6. Traducción usuario final → técnico

- Extraé del requerimiento: **síntoma observable**, pantalla/módulo/acción mencionada, datos de ejemplo (números de boleta, fechas, usuarios), pasos para reproducir, mensajes de error.
- Mapealo contra el **CLAUDE.md raíz** del workspace (mapa de proyectos + matriz de consumo): pantalla mencionada → frontend candidato → API que consume → SP probable. Ej.: "no puedo emitir desde agencias" → `autogestion` → `api` :9500 → SPs de `db-boletos`.
- Armá **2–3 hipótesis de ubicación** rankeadas con su evidencia. Si Sentry dio `archivo:línea`, esa hipótesis va primera con confianza alta.

### 7. Preguntas bloqueantes

Si el requerimiento sigue vago o ambiguo después de todo lo anterior, **preguntale al usuario** (`AskUserQuestion` o lista de preguntas) antes de devolver el control al workflow — es más barato preguntar ahora que implementar sobre la hipótesis equivocada.

---

## Output: Requerimiento Jira

```markdown
## Requerimiento Jira: {KEY} — {summary}

**Estado:** {estado} · **Prioridad:** {prioridad} · **Reporter:** {nombre} · {link al ticket}

### Resumen del requerimiento
{Qué pide/reporta el usuario, en términos de negocio}

### Síntomas y datos concretos
- Pasos: {…} · Error: "{mensaje exacto}" · Datos de ejemplo: {…}

### Adjuntos ({leídos}/{total})
| Adjunto | Tipo | Qué aporta | Estado |
|---------|------|------------|--------|
| captura1.png | imagen | mensaje de error "X" en pantalla Y | ✓ leído / ⏳ pendiente |

### Origen del error
| Fuente | Ubicación | Ambiente | Veredicto |
|--------|-----------|----------|-----------|
| Sentry {link} | `archivo.php:123` | production | continuar |
| URL reportada | api.viatesting/... | testing | ⚠ posible prueba — consultado al usuario |

### Hipótesis de ubicación técnica
| # | Proyecto / módulo | Evidencia | Confianza |
|---|-------------------|-----------|-----------|
| 1 | `api` — {controller/model} | stack trace de Sentry | Alta |
| 2 | `autogestion` — {componente} | captura de pantalla | Media |

### Preguntas bloqueantes
- {pregunta — o "ninguna"}
```

---

## Reglas

- **Solo lectura en Jira.** Nunca uses tools de escritura (`addComment`, `transitionJiraIssue`, `editJiraIssue`, `createJiraIssue`, worklogs). Si el usuario pide comentar el ticket, indicale que lo haga él — esta skill no escribe en Jira.
- **No modificás archivos del proyecto** ni accedés a `.env*` / `.github/`.
- **No inventes el contenido de adjuntos o links que no pudiste leer** — marcálos pendientes y pedílos.
- El bloque queda en contexto, no en disco. `plan` e `inspect` lo leen de la conversación.
- Sin MCP de Atlassian: recomendar conexión + devolver el control. Nunca bloquees el workflow por esto.

## Tools

- Tools del **MCP de Atlassian** (lectura: `getJiraIssue`, `getJiraIssueRemoteIssueLinks`, `search`, `fetch`) y del **MCP de Sentry** (lectura del issue/evento). `ToolSearch` para encontrarlas si no están cargadas.
- `WebFetch` para links públicos.
- `Read`, `Glob`, `Grep` para mapear las hipótesis contra el CLAUDE.md raíz y el codebase.
- `AskUserQuestion` para el triage dev/testing y las preguntas bloqueantes.
