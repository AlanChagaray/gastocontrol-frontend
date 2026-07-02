---
name: test
description: Comando individual — ejecuta los tests automatizados del proyecto SI existen. No es parte del workflow orquestado. Si el proyecto no dispone de tests, lo informa y termina. Solo lectura en DB.
argument-hint: [qué validar o filtro de tests, o vacío para correr la suite completa]
---

# Testing

## Rol

Ejecutar los tests automatizados del proyecto y reportar resultados. **Es un comando individual, fuera del workflow orquestado** — se usa solo cuando el proyecto dispone de tests unitarios/automatizados.

**No modifica archivos del proyecto. No ejecuta queries de escritura.**

**Qué validar:** $ARGUMENTS  
(Si hay un Requerimiento Dinámico o un reporte del Executor en la conversación, usalos como referencia de qué criterios verificar.)

---

## ⛔ Restricciones absolutas

- **Solo lectura en DB**: cualquier consulta debe ser exclusivamente `SELECT`. Nunca `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`, `EXEC` ni equivalentes.
- **No modificás archivos del proyecto.**
- **No accedés a `.env*` ni a `.github/`.**

---

## Proceso

### 1. Detección de tests (paso obligatorio — primero siempre)

Verificá si el proyecto dispone de tests automatizados, en este orden:

1. **CLAUDE.md del proyecto** — suele declarar el comando de test.
2. **Reporte del Inspector** en la conversación (campo `Test runner`), si existe.
3. **Manifests y configs**: scripts `test` en `package.json`, `phpunit.xml`/`phpunit.xml.dist`, `jest.config.*`, `vitest.config.*`, `karma.conf.*`, proyectos `*Tests.csproj`, carpeta `tests/` o `__tests__/` con archivos de test reales.

**Si NO hay test runner ni tests** → informá:

> ⚠ Este proyecto no dispone de tests automatizados. `/test` no tiene nada que ejecutar — terminando sin acciones.

y **terminá la skill ahí**. No generes checklists ni validaciones alternativas.

### 2. Ejecución del runner

1. Ejecutá el runner según el stack detectado:
   - PHP / Laravel: `php artisan test` o `vendor/bin/phpunit`
   - PHP / CodeIgniter: `vendor/bin/phpunit` (si configurado)
   - React / Next.js: `npm test` o `npx jest` o `npx vitest`
   - React Native: `npm test` o `npx jest`
   - Angular: `ng test` o `npx jest`
   - Node.js / Express / NestJS: `npm test` o `npx jest` o `npx mocha`
   - C# / .NET: `dotnet test`
2. Si `$ARGUMENTS` o el Requerimiento definen tests específicos, ejecutá subset filtrado:
   - PHPUnit: `--filter NombreTest`
   - Jest: `--testNamePattern="NombreTest"` o `--testPathPattern="archivo"`
   - dotnet: `--filter "FullyQualifiedName~NombreTest"`
   - Angular (Karma/Jest): `--include="**/nombre.spec.ts"`
3. Reportá pass / fail / skip y detectá regresiones.

### 3. Revisión contra criterios (si hay ciclo previo en el chat)

- Si hay Requerimiento Dinámico del Inspector: mapeá cada Criterio de Aceptación contra los tests ejecutados.
- Si hay reporte del Executor: verificá que los archivos aplicados estén cubiertos por los tests que corren.

---

## Output: Reporte de Testing

```markdown
# Reporte de Testing: {TÍTULO}

**Test runner:** {comando ejecutado}
**Stack:** {detectado}
**Resultado:** ✓ APROBADO | ⚠ APROBADO CON OBSERVACIONES | ✗ RECHAZADO

## 1. Resumen

| Suite / Criterio | Estado | Evidencia |
|------------------|--------|-----------|
| {suite o CA-XX} | ✓/✗ | {tests pass/fail} |

**Veredicto:** {una línea}

## 2. Output del test runner
```
{output literal: totales pass/fail/skip}
```
Regresiones: {ninguna | lista}

## 3. Issues

| # | Descripción | Archivo | Línea |
|---|-------------|---------|-------|

## 4. Conclusión

**Decisión:** {✓ APROBADO | ⚠ APROBADO CON OBSERVACIONES | ✗ RECHAZADO}
**Razón:** {justificación}
```

---

## Criterios de Decisión

### ✓ APROBADO
- Todos los tests pasan. Sin regresiones.

### ⚠ APROBADO CON OBSERVACIONES
- Tests pasan pero hay skips relevantes, cobertura insuficiente de los criterios, o issues menores documentados.

### ✗ RECHAZADO
- Tests fallan o hay regresiones.

---

## Reglas

- **Si no hay tests, informás y terminás.** No inventes validaciones alternativas ni propongas crear un framework de testing.
- **No modificás archivos del proyecto.**
- **Solo SELECT en cualquier consulta de DB.**
- **No accedés a `.env*` ni a `.github/`.**
- Si el runner falla por problema de entorno (dependencias sin instalar, servicio caído), reportá el problema de entorno — no lo confundas con tests que fallan.

## Tools

- `Read`, `Glob`, `Grep` para detectar el runner y revisar archivos.
- `Bash` para ejecutar el test runner.
