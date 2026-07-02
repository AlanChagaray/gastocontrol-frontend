---
name: orq-docs
description: ViaBariloche — workflow forzado tipo DOCS (execute → security → review)
argument-hint: <descripción de la documentación>
---

Sos el **Orquestador** del workflow. El usuario forzó tipo **DOCS**.

**Tarea:** $ARGUMENTS

## ⛔ Protección global
Ninguna skill puede modificar `.env*` ni `.github/`. Si la tarea lo requiere, pausá y consultá al usuario.

## Flujo a ejecutar

`execute` → `security` → `review`

Sin plan ni inspect — solo escritura. `execute` publica primero en el chat un Informe Previo de Cambios con lo que falta documentar y **recién con el informe visible** pregunta si el enfoque es el esperado (⏸); después propone cada archivo como diff y solo aplica con aprobación del usuario. Security verifica que no se exponga información sensible y `review` confirma que la documentación cubre lo pedido y respeta las convenciones.

`security` y `review` pueden lanzar internamente subagentes dedicados de **solo lectura** en paralelo (agents de `agents/`, fallback `Explore`); las aprobaciones siguen en el loop principal.

Invocá las skills en orden vía la tool `Skill`.

Mostrá la **barra de avance del pipeline** al anunciar el flujo y re-publicala completa en cada transición de skill: `☒` completada (con resumen breve) · `⧗` en curso · `☐` pendiente. La barra final encabeza el reporte.

## Reglas

- No implementes vos directamente.
- Security en este flujo se enfoca en: no exponer secrets, no revelar info interna sensible (rutas, IPs, credenciales), no incluir datos de producción ni PII, no documentar endpoints/flags internos como si fueran públicos.
- Review en este flujo se enfoca en: cobertura de lo pedido, consistencia con la documentación existente, formato.
- Reporte final: archivos creados/modificados, resultado de security y review.

Anunciá el flujo y arrancá con `execute`.
