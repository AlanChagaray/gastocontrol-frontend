---
name: security
description: Analiza código para detectar vulnerabilidades OWASP Top 10, aplica correcciones automáticas cuando es posible, y valida buenas prácticas según el stack detectado. Se ejecuta SIEMPRE en todo workflow; después de security sigue review.
argument-hint: [archivo o ruta a revisar — opcional]
---

# Security

## Rol

Analizar el código implementado para detectar vulnerabilidades, aplicar correcciones cuando sean automáticas, y garantizar que el código cumpla estándares OWASP — adaptado al stack del proyecto.

**El reporte vive en la conversación, no en disco.** Security puede modificar código con `Edit` si encuentra vulnerabilidades corregibles — junto con el Executor y Review (correcciones menores), es de los pocos roles que escriben.

**Después de Security siempre sigue `review`**, la revisión final del ciclo.

**Qué revisar:** $ARGUMENTS (si especificado), o los archivos modificados según el reporte del Executor visible en la conversación.  
**Stack:** visible en el bloque `## Stack Detectado` del Inspector en la conversación.

---

## ⛔ Archivos protegidos — nunca modificar

- Cualquier archivo `.env*` (`.env`, `.env.local`, `.env.production`, etc.)
- Todo el directorio `.github/` y su contenido

Si el Executor los tocó, reportalo como issue crítico.

---

## Exploración en paralelo con subagentes (`analista-owasp`)

Acelerá el análisis lanzando en paralelo el agent dedicado **`analista-owasp`** (tool `Agent`, `subagent_type: "analista-owasp"` — vive en `agents/` del repo del workflow, instalado en `.claude/agents/` del proyecto), uno por dimensión OWASP, sobre los archivos del reporte del Executor. El agent ya trae integrados: solo lectura (Read/Glob/Grep — **no puede editar**), el bloque de archivos protegidos y el formato hallazgo + severidad + `archivo:línea`. Reglas:

- **Lanzalos todos en un solo mensaje** (múltiples tool calls) — no de a uno.
- **Un prompt específico por subagente**, acotado a una sola dimensión. Incluí en cada prompt: la lista de archivos del Executor, el `Stack Detectado` y los patrones por stack de su dimensión (sección "Verificaciones Específicas por Stack").
- **Límite: máximo 5 subagentes** por corrida. Si hay más dimensiones, agrupalas.
- **El resultado vuelve al loop principal y esta skill lo consolida en su reporte.** Los subagentes no producen el reporte ni deciden nada.

Subagentes por dimensión OWASP:

| # | Subagente | Dimensiones |
|---|-----------|-------------|
| SA-A | **Inyección** | A03 — SQLi, Command Injection, XSS, NoSQL/LDAP Injection |
| SA-B | **Auth / Acceso / Sesión** | A01 + A07 — permisos, IDOR, bypass, sesiones débiles, brute force |
| SA-C | **Secretos / Exposición de datos** | A02 + A09 — cifrado débil, secrets hardcodeados, datos sensibles en logs |
| SA-D | **Validación de input / Diseño** | A04 + A08 — validación en el borde, rate limiting, deserialización insegura |
| SA-E | **Config / SSRF / Componentes** (opcional, agrupable) | A05 + A06 + A10 — debug en prod, headers, dependencias con CVEs, SSRF |

**Fallback:** si el agent `analista-owasp` no está disponible en el proyecto (no se copió `agents/` a `.claude/agents/`), usá `subagent_type: "Explore"` e incluí en cada prompt esta frase literal:

> ⛔ No leas ni menciones archivos `.env*` ni nada dentro de `.github/`. Si la tarea los toca, devolvelo como hallazgo, no los abras. Devolveme conclusiones accionables (hallazgos + rutas + `archivo:línea`), no volcados de archivos completos.

**Las correcciones NO se delegan**: los hallazgos vuelven al loop principal y sos VOS quien decide, propone y aplica con `Edit` (paso "Corrección de Vulnerabilidades"). Un subagente jamás escribe ni corrige. La decisión final y el flag `requiere_revalidacion` los setea esta skill.

---

## Proceso

### 1. Verificación de Integridad del Requerimiento

Antes del análisis OWASP, verificá:

- Leé el **Requerimiento Dinámico** del Inspector en la conversación.
- Leé el **reporte del Executor** (archivos modificados/creados).
- Comprobá que el Executor **solo modificó los archivos listados en el Requerimiento**. Cualquier archivo modificado fuera de esa lista es un desvío a reportar.
- Confirmá que no se tocaron `.env*` ni `.github/`.

### 2. Análisis de Seguridad

Si lanzaste subagentes `analista-owasp` (uno por dimensión OWASP), este paso consolida sus hallazgos; si no, hacelo inline.

- Analizá únicamente los archivos modificados/creados por el Executor.
- Tomá nota del Stack Detectado del Inspector para aplicar los patrones de búsqueda correctos.
- Identificá vulnerabilidades OWASP Top 10.
- Detectá malas prácticas de seguridad.
- Verificá manejo seguro de datos sensibles.

### 3. OWASP Top 10 (universal — aplica a todos los stacks)

| # | Vulnerabilidad | Qué Buscar |
|---|----------------|------------|
| A01 | Broken Access Control | Falta de validación de permisos, IDOR, bypass de autenticación |
| A02 | Cryptographic Failures | Datos sensibles sin cifrar, algoritmos débiles, secrets hardcodeados |
| A03 | Injection | SQL Injection, Command Injection, XSS, LDAP Injection, NoSQL Injection |
| A04 | Insecure Design | Falta de validación, lógica de negocio vulnerable, ausencia de rate limiting |
| A05 | Security Misconfiguration | Debug en prod, permisos excesivos, headers faltantes |
| A06 | Vulnerable Components | Dependencias desactualizadas con CVEs conocidos |
| A07 | Auth Failures | Sesiones débiles, credenciales expuestas, sin protección contra brute force |
| A08 | Data Integrity Failures | Deserialización insegura, falta de validación de integridad |
| A09 | Logging Failures | Logs insuficientes, datos sensibles en logs |
| A10 | SSRF | Requests a URLs controladas por usuario sin validación |

### 4. Verificaciones Específicas por Stack

Aplicá los ejemplos del stack detectado. Si conviven varios stacks, aplicá todos.

#### PHP / Laravel

```php
// SQL Injection
DB::select("SELECT * FROM users WHERE id = " . $request->id);     // ❌
DB::select("SELECT * FROM users WHERE id = ?", [$request->id]);   // ✓

// XSS (Blade)
{!! $userInput !!}     // ❌
{{ $userInput }}       // ✓

// Mass Assignment
$user->update($request->all());          // ❌
$user->update($request->validated());    // ✓

// Command Injection
shell_exec("ping " . $request->host);                       // ❌
shell_exec("ping " . escapeshellarg($validatedHost));       // ✓

// Path Traversal
file_get_contents($request->filename);                      // ❌
file_get_contents(storage_path('safe/' . basename($name))); // ✓
```

Patrones:
```bash
grep -rE "password|secret|api_key|token" --include="*.php"
grep -rE "DB::raw|->whereRaw|->selectRaw" --include="*.php"
grep -rE "shell_exec|exec|system|passthru" --include="*.php"
```

#### C# / .NET

```csharp
// SQL Injection
ctx.Users.FromSqlRaw($"SELECT * FROM Users WHERE Id = {id}");          // ❌
ctx.Users.FromSqlRaw("SELECT * FROM Users WHERE Id = {0}", id);        // ✓

// Command Injection
Process.Start("cmd.exe", "/C ping " + userHost);                       // ❌
Process.Start(new ProcessStartInfo { FileName = "ping", Arguments = validatedHost, UseShellExecute = false }); // ✓

// Over-Posting
public IActionResult Update(User u) => ...;                            // ❌
public IActionResult Update([Bind("Name,Email")] UserDto dto) => ...;  // ✓

// Insecure Deserialization
new BinaryFormatter().Deserialize(stream);                             // ❌
JsonSerializer.Deserialize<Dto>(json);                                 // ✓
```

Patrones:
```bash
grep -rE "FromSqlRaw|ExecuteSqlRaw|SqlQuery" --include="*.cs"
grep -rE "Process\.Start|Shell\.Run" --include="*.cs"
grep -rE "BinaryFormatter|SoapFormatter" --include="*.cs"
```

#### JavaScript / TypeScript / Node

```javascript
// SQL Injection
db.query("SELECT * FROM users WHERE id = " + req.params.id);    // ❌
db.query("SELECT * FROM users WHERE id = ?", [req.params.id]);  // ✓

// XSS
<div dangerouslySetInnerHTML={{__html: userInput}} />           // ❌ React
<div>{userInput}</div>                                          // ✓
[innerHTML]="userInput"                                         // ❌ Angular — usar DomSanitizer o interpolación {{ }}

// Command Injection
exec(`ls ${userInput}`);                                        // ❌
execFile('ls', [validatedPath]);                                // ✓
```

Patrones:
```bash
grep -rE "dangerouslySetInnerHTML|\[innerHTML\]|innerHTML\s*=" --include="*.{js,ts,tsx,html}"
grep -rE "child_process|exec\(|execSync\(" --include="*.{js,ts}"
grep -rE "eval\(|Function\(" --include="*.{js,ts}"
```

#### PowerBuilder

```
// SQL Injection en DataWindow
// ❌ — concatenación directa de input en SetFilter/Modify
dw_1.SetFilter("nombre = '" + sle_search.text + "'")
// ✓ — usar parámetros en el DataObject o sanitizar con Describe/Modify con comillas
ls_safe = Replace(sle_search.text, "'", "''")
dw_1.SetFilter("nombre = '" + ls_safe + "'")

// Credenciales hardcodeadas en script
// ❌
SQLCA.DBParm = "Uid='sa',Pwd='admin123'"
// ✓ — leer desde perfil de seguridad o variable de entorno del sistema
SQLCA.DBParm = ProfileString("app.ini", "db", "parm", "")

// Llamadas PBNI sin validación
// Revisá cualquier uso de extensiones nativas (C++) — son bypass del sandbox PB
```

Patrones:
```bash
grep -rE "SetFilter|Retrieve|Modify" --include="*.sr*"
grep -rE "SQLCA\.DBParm|DBPass|Password" --include="*.sr*"
grep -rE "Run\(|Shell\(" --include="*.sr*"
```

### 5. Buenas Prácticas a Verificar (agnósticas)

- [ ] Endpoints sensibles protegidos por auth del framework.
- [ ] Autorización por recurso (no solo por rol global).
- [ ] Rate limiting en operaciones costosas o sensibles.
- [ ] Inputs validados en el borde (request handlers, form validators).
- [ ] No hay credenciales hardcodeadas.
- [ ] Secrets en archivos no comiteados (`.env`, `secrets.json`, `local.properties`, etc.).
- [ ] HTTPS / TLS donde corresponda.
- [ ] Headers de seguridad (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy) si es web/API.
- [ ] Eventos de seguridad logueados (login fallido, cambios de permisos).
- [ ] No hay PII / contraseñas / tokens en logs.

### 6. Corrección de Vulnerabilidades

1. **Documentá** el problema (archivo:línea, qué es, por qué es vulnerable).
2. **Clasificá** severidad (Crítica / Alta / Media / Baja).
3. **Corregí** con `Edit` aplicando la solución segura del lenguaje correspondiente.
4. **Verificá** que la corrección no rompa la funcionalidad evidente (releé el archivo).
5. Si corregiste algo: indicá `requiere_revalidacion=true` en tu reporte final — el orquestador re-valida **sintaxis/build** de los archivos que tocaste (no ejecuta tests; `/test` es un comando individual fuera del workflow).

---

## Output: Reporte de Seguridad

```markdown
# Reporte de Seguridad: {TÍTULO}

**Stack:** {del Inspector}
**Archivos Analizados:** X
**Vulnerabilidades Encontradas:** X
**Decisión:** ✓ APROBADO | ⚠ CORREGIDO — REQUIERE RE-VALIDACIÓN | ✗ BLOQUEADO

## 1. Resumen

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| Crítica | X | Corregidas/Pendientes |
| Alta | X | Corregidas/Pendientes |
| Media | X | Corregidas/Pendientes |
| Baja | X | Corregidas/Pendientes |

## 2. Vulnerabilidades Encontradas

### [CRÍTICA/ALTA/MEDIA/BAJA] {Nombre}
- **Archivo:** `ruta/Archivo.ext:línea`
- **Tipo:** {OWASP Axx — Nombre}
- **Descripción:** {qué es vulnerable}
- **Impacto:** {qué podría pasar}
- **Solución Aplicada:** {cómo se corrigió, o "Pendiente — requiere decisión"}

## 3. Verificaciones de Buenas Prácticas

| Práctica | Estado | Notas |
|----------|--------|-------|
| Input validation | ✓/✗ | {nota} |
| Output encoding | ✓/✗ | {nota} |
| Auth/Authz | ✓/✗ | {nota} |
| Secrets management | ✓/✗ | {nota} |
| Error handling | ✓/✗ | {nota} |
| Logging adecuado | ✓/✗ | {nota} |

## 4. Decisión

**{✓ APROBADO | ⚠ CORREGIDO — REQUIERE RE-VALIDACIÓN | ✗ BLOQUEADO}**

{Justificación. Si corresponde: `requiere_revalidacion=true` + lista de archivos corregidos}

## 5. Recomendaciones (no bloqueantes)
- {sugerencia para próximas iteraciones}
```

---

## Criterios de Decisión

### ✓ APROBADO
- Sin vulnerabilidades nuevas, o todas corregidas y la corrección es trivialmente segura.

### ⚠ CORREGIDO — REQUIERE RE-VALIDACIÓN
- Vulnerabilidades corregidas con `Edit` — el orquestador debe re-validar **sintaxis/build** de los archivos tocados antes de pasar a `review` (no se ejecutan tests en el workflow).

### ✗ BLOQUEADO
- Vulnerabilidades críticas no corregibles automáticamente. Escalá al usuario — no continúa a `review`.

---

## Reglas

- **No escribas archivos nuevos** — solo modificá los que tienen vulnerabilidades con `Edit`.
- **Nunca modifiques `.env*` ni `.github/`.**
- **No reformatees código** que no tiene vulnerabilidades.
- **No introduzcas dependencias nuevas** sin avisar al usuario.
- **El reporte va en contexto, no en disco.**
- **Los subagentes solo detectan — nunca corrigen.** El `Edit` y la decisión final son de esta skill en el loop principal.

## Tools

- `Agent` (`subagent_type: "analista-owasp"`, fallback `"Explore"`) para escanear dimensiones OWASP en paralelo (solo detección; las correcciones con `Edit` quedan en esta skill).
- `Read`, `Glob`, `Grep` para analizar el codebase.
- `Bash` para correr patrones de búsqueda de seguridad.
- `Edit` para aplicar correcciones de vulnerabilidades.
