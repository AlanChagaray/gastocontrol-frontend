---
name: sp
description: Analiza un stored procedure del ecosistema (db, db-boletos, db-in-memory, etc.) — firma, lógica, callers en api y otros consumidores — y genera queries SELECT de validación antes de modificarlo. Solo lectura — nunca ejecuta escrituras.
argument-hint: <nombre del stored procedure, o descripción del cambio que se le quiere hacer>
---

# SP — Análisis de Stored Procedures

## Rol

Analizar un stored procedure **antes de tocarlo**. En este ecosistema, mucha lógica de negocio crítica vive en los SPs de SQL Server (repos `db`, `db-boletos`, `db-boletos-hist`, `db-datos-interfaces`, `db-in-memory`, `db-metabuscador`, `db_administracion`) y son invocados principalmente desde `api` — cambiar una firma o el shape del resultado rompe consumidores silenciosamente.

**No modifica ningún archivo y no ejecuta nada de escritura en DB.** Si el análisis concluye que hay que modificar el SP, el cambio se hace con `/workflow-refactor` (que va a disparar `plan` por impacto cruzado).

**SP / cambio a analizar:** $ARGUMENTS

---

## ⛔ Restricciones absolutas

- **Solo lectura en DB**: cualquier query que generes o ejecutes debe ser exclusivamente `SELECT`. Nunca `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`, `ALTER`, ni `EXEC` de SPs de escritura.
- **No modificás archivos.**
- **No accedés a `.env*` ni a `.github/`.**

---

## Proceso

### 1. Localizar el SP

- Buscá la definición con `Grep` en los repos `db*` del workspace: `CREATE PROCEDURE`, `CREATE OR ALTER PROCEDURE`, o el nombre exacto.
- Si el nombre es ambiguo o hay versiones en varios repos (`db` vs `db-boletos-hist`), listá todas y aclarálo.
- Leé la definición completa.

### 2. Analizar firma y lógica

- **Firma**: parámetros (nombre, tipo, default, OUTPUT), y qué retorna (result set con columnas, valor de retorno, parámetros OUTPUT).
- **Lógica**: qué tablas lee/escribe, qué reglas de negocio implementa, transacciones, otros SPs/UDFs que invoca (cadena de dependencias).
- **Efectos colaterales**: triggers en las tablas que toca, tablas de auditoría/historia.

### 3. Buscar los callers (impacto cruzado)

- En `api` (CodeIgniter): `Grep` por el nombre del SP en `application/` (models suelen invocar por nombre).
- En el resto del ecosistema: buscá el nombre en `viapagoapi`, `metabuscador`, y en otros SPs de los repos `db*` (un SP puede llamar a otro).
- Consultá la **matriz de consumo** del CLAUDE.md raíz: si `api` lo invoca, los consumidores indirectos son todos los frontends de `api` (`checkout`, `autogestion`, `administracion`, `appbusplus`, `ski`).
- Reportá cada caller con `archivo:línea`.

### 4. Generar queries de validación (solo SELECT)

Generá queries listas para copiar/pegar que permitan validar el estado **antes y después** de un eventual cambio:

- SELECTs sobre las tablas que el SP toca, filtradas por casos representativos.
- Si es viable, la invocación de lectura del SP con parámetros de ejemplo **solo si el SP es de solo lectura** — si escribe, NO generes el EXEC: generá SELECTs equivalentes sobre sus tablas.

---

## Output: Análisis de Stored Procedure

```markdown
# Análisis SP: {nombre}

**Repo:** {db | db-boletos | ...} — `ruta/archivo.sql`
**Tipo:** {solo lectura | escribe en N tablas}

## 1. Firma
| Parámetro | Tipo | Default | OUTPUT |
|-----------|------|---------|--------|

**Retorna:** {result set con columnas X, Y | valor | OUTPUT params}

## 2. Lógica
{Resumen de reglas de negocio, tablas leídas/escritas, SPs/UDFs invocados, transacciones, triggers}

## 3. Callers (impacto cruzado)
| Consumidor | Archivo:línea | Cómo lo usa |
|------------|---------------|-------------|
| `api` | `application/models/...:NN` | {qué hace con el resultado} |

**Consumidores indirectos:** {frontends de api según la matriz de consumo}

## 4. Queries de Validación (solo SELECT)
```sql
-- Estado previo / posterior
SELECT ... FROM ... WHERE ...;
```

## 5. Riesgos al Modificarlo
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|

## 6. Recomendación
{Cómo encarar el cambio: /workflow-refactor (dispara plan por impacto cruzado),
compatibilidad de firma (parámetros nuevos con default al final), versionado del SP, etc.}
```

---

## Reglas

- **No modifiques nada** — este es un comando de análisis; el cambio real va por `/workflow-refactor`.
- **Solo SELECT.** Si el usuario pide ejecutar algo de escritura, rechazálo y explicá la restricción.
- Si un caller no se puede confirmar con grep, marcálo como "posible — a confirmar", no lo des por hecho.
- Recomendá siempre compatibilidad hacia atrás cuando haya múltiples consumidores (parámetros nuevos con default, no renombrar columnas del result set).

## Tools

- `Read`, `Glob`, `Grep` para localizar el SP y sus callers en los repos del workspace.
- `Bash` solo para búsquedas de lectura — nunca para ejecutar SQL de escritura.
