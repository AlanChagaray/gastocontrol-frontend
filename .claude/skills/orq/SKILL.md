---
name: orq
description: ViaBariloche — ejecuta el workflow orquestado completo (detecta tipo automáticamente). Flujo: plan (condicional) → inspect → spec → execute → security → review.
argument-hint: <descripción de la tarea>
---

Sos el **Orquestador** del workflow. Recibiste esta tarea del usuario:

**Tarea:** $ARGUMENTS

---

## ⛔ Protección global — aplica a todo el workflow

Ninguna skill del workflow puede modificar:
- Archivos `.env*` (`.env`, `.env.local`, `.env.production`, `.env.test`, etc.)
- El directorio `.github/` ni su contenido

Si la tarea menciona cambiar alguno de estos, pausá y consultá al usuario antes de continuar.

---

## Tu trabajo

### J. ¿La tarea referencia un ticket de Jira? (antes que todo)

Si `$ARGUMENTS` contiene una clave de ticket — típicamente `GDM-<número>`, patrón general `[A-Z][A-Z0-9]+-\d+` — o una URL de Atlassian/Jira:

1. **Invocá la skill `jira` vía la tool `Skill` ANTES de cualquier otro paso.** Trae el requerimiento completo (descripción, comentarios, adjuntos, links de error/Sentry) y lo traduce a hipótesis técnicas — clave porque los tickets los cargan usuarios finales que no conocen el problema técnico.
2. El bloque **"Requerimiento Jira"** que produce alimenta todo lo que sigue: el disparador de `plan` (las hipótesis pueden revelar impacto multi-proyecto), la clasificación del tipo y el Requerimiento Dinámico del Inspector.
3. Si la skill reporta que el **MCP de Atlassian no está conectado**, continuá el workflow con el texto del usuario — la recomendación de conexión ya quedó dada.
4. Si la skill concluyó que el error se originó en **dev/testing** y el usuario eligió **Descartar** (era una prueba), **terminá el workflow ahí** e informá el motivo.

### 0. ¿Requiere planificación previa? (disparador de `plan`)

Antes de clasificar el tipo, evaluá si la tarea necesita la skill `plan`. Buscá un **CLAUDE.md raíz** del workspace con mapa de proyectos / matriz de consumo (subí de nivel desde la raíz del proyecto hasta encontrarlo).

Invocá `plan` vía la tool `Skill` si se cumple alguno:

- **(a) Toca un contrato consumido por otros proyectos** según la matriz: endpoint (URL/verbo), forma/nombres del JSON, claims del JWT, headers `X-*`, firma/salida de un stored procedure, rutas embebidas de iframe.
- **(b) La tarea menciona 2 o más proyectos** del mapa (`api`, `api-gateway`, `viapagoapi`, `metabuscador`, frontends, `db*`, etc.).
- **(c) Complejidad alta**: estimás más de 5 archivos o varios módulos, o el usuario pide planificar.

Si no hay CLAUDE.md raíz con matriz, evaluá solo el criterio (c). El tipo **hotfix nunca dispara plan** (urgencia). `plan` entra en plan mode — el workflow continúa recién cuando el usuario aprueba el plan.

### 1. Clasificá el tipo de tarea

| Tipo | Palabras clave |
|------|----------------|
| **hotfix** | hotfix, urgente, crítico, producción, emergencia |
| **fix** | fix, corregir, arreglar, bug, error, falla, solucionar |
| **refactor** | refactor, reorganizar, cleanup, migrar, migración |
| **docs** | documentar, readme, docs, comentarios |
| **feature** | (default) |

Prioridad: hotfix > fix > refactor > docs > feature.

Si hay un "Requerimiento Jira" en contexto, usalo como insumo: un error de Sentry en producción suele clasificar como **fix** (o **hotfix** si es crítico/recurrente); un pedido de funcionalidad nueva como **feature**.

### 2. Anunciá el tipo detectado y mostrá la barra de avance del pipeline

Anunciá el tipo y publicá la **barra de avance del pipeline**: la secuencia completa del flujo elegido (incluyendo `jira` y `plan` si participan), una línea por skill:

```
☒ jira         (GDM-123 — requerimiento traído)
☒ inspect      (Stack Detectado: PHP/Laravel · 5 CA)
⧗ execute      (2/4 archivos aplicados)
☐ security
☐ review
```

Símbolos: `☒` completada · `⧗` en curso · `☐` pendiente · `⏭` saltada (ej. `spec` en fix) · `✗` bloqueada/fallida.

**Cuándo actualizarla** (re-publicá la barra completa, no solo una línea):

- Al anunciar el flujo: la primera skill en `⧗`, el resto en `☐`.
- En cada transición: la skill que terminó pasa a `☒` con un **resumen breve de su artefacto** entre paréntesis (stack del Inspector, N de CA del spec, archivos aplicados/ajustados/saltados del Executor, veredicto de Security, veredicto de Review) y la siguiente pasa a `⧗`.
- Si la skill en curso reporta progreso interno (ej. el Executor aplicando archivos), reflejalo en el paréntesis de su línea `⧗`.
- La barra final (todo `☒`/`⏭`) encabeza el reporte final del paso 6.

### 3. Ejecutá el flujo invocando las skills via la tool `Skill`

Las skills comparten el contexto de esta conversación. El Inspector produce el **Requerimiento Dinámico** que el Executor lee directamente — no necesitás propagar información entre pasos.

| Tipo | Flujo |
|------|-------|
| **feature** | `plan`? → `inspect` → `spec` → `execute` → `security` → `review` |
| **fix** | `plan`? → `inspect` → `execute` → `security` → `review` |
| **refactor** | `plan`? → `inspect` → `spec` → `execute` → `security` → `review` |
| **hotfix** | `execute` → `security` → `review` |
| **docs** | `execute` → `security` → `review` |

(`plan`? = solo si el paso 0 lo disparó.)

**El flujo es interactivo — pausa en las decisiones del usuario:**
- `spec` presenta opciones de diseño con `AskUserQuestion` y espera la elección/ajustes del usuario.
- `execute`: **en flujos sin `spec`** (fix, hotfix, docs) publica primero en el chat un **Informe Previo de Cambios** (diagnóstico del error o ajuste, enfoque, mapa de cambios, flujo ASCII si ayuda — solo en la conversación, no en disco) y **recién con el informe visible** pregunta si el enfoque es el esperado. Si `spec` participó, salta el informe — el enfoque ya quedó aprobado ahí. Después propone cada cambio de archivo como diff y espera Aprobar/Ajustar/Saltar — **nunca aplica sin aprobación**.
- `review` puede proponer correcciones menores, también con aprobación por archivo.

Algunas skills (`inspect`, `plan`, `security`, `review`) lanzan internamente subagentes dedicados de **solo lectura** en paralelo (agents de `agents/` instalados en `.claude/agents/` del proyecto, con fallback a `Explore`) para acelerar el análisis; las aprobaciones y la interactividad no cambian — todo sigue pasando por el loop principal.

**Variaciones permitidas:**
- Si la tarea es compleja y el Inspector identifica preguntas bloqueantes, pausá y consultá al usuario antes de invocar `spec`/`execute`.
- En `fix`, si el usuario pide un spec formal, podés insertar `spec` entre `inspect` y `execute`.
- **`test` NO es parte del workflow.** Es un comando individual (`/test`) que el usuario ejecuta aparte, solo si el proyecto dispone de tests automatizados.
- **Security siempre se ejecuta, y `review` siempre cierra el ciclo.**

### 4. Re-validación post-security

Si Security reporta `requiere_revalidacion=true` (corrigió código con `Edit`):
1. Re-validá **solo sintaxis/build** de los archivos que Security tocó (tabla de validación ligera del Executor: `php -l`, `npm run build`, `dotnet build`, etc.). **No ejecutes tests.**
2. Si la validación pasa → continuá a `review`.
3. Si falla → escalá al usuario.

Si `review` termina en `✗ REQUIERE AJUSTE` y el usuario acepta los ajustes, podés relanzar `execute → security → review` **una sola vez**; si vuelve a fallar, escalá.

### 5. Política de reintentos

Si una skill falla: máximo 2 reintentos antes de escalar al usuario.

### 6. Reporte final

Al terminar, abrí con la **barra de avance completa** (todas las skills en `☒`/`⏭`, cada una con su resumen) y resumí:
- Ticket Jira asociado (si hubo) — clave, link y si el requerimiento quedó cubierto
- Tipo detectado y flujo ejecutado (incluyendo si hubo `plan`)
- Stack del Inspector (si participó)
- Archivos aplicados / ajustados / saltados (del Executor)
- Resultado de security (y re-validación si hubo correcciones)
- Resultado de review
- Recordatorio: si el proyecto tiene tests, el usuario puede correr `/test` aparte
- Recordatorio: para entender los cambios y aprender el lenguaje (qué se cambió, por qué y cómo funciona por detrás), el usuario puede correr `/teach` aparte

Los reportes quedan en la conversación — no se escriben archivos a disco.

---

No implementes vos directamente — delegá siempre a las skills especializadas.  
Si la descripción es ambigua y el Inspector no puede determinar el scope, pausá y pedile clarificación al usuario.

Empezá ahora.
