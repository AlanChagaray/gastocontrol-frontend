# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción general

GastoControl es el frontend (MVP) de una app de control de gastos personales. Es un
cliente **Next.js 14 (App Router)** en TypeScript que consume una **API Laravel** externa.
No hay backend en este repo: todo se comunica con la API vía HTTP.

## Comandos

```bash
pnpm install      # instalar dependencias (el repo usa pnpm-lock.yaml)
pnpm dev          # servidor de desarrollo → http://localhost:3000
pnpm build        # build de producción
pnpm start        # servir el build de producción
```

- **No hay suite de tests** ni script de lint configurado en `package.json`. `eslint` y
  `eslint-config-next` están instalados, así que se puede correr lint con `npx next lint`.
- Requiere un archivo `.env.local` (ver `.env.example`). La variable clave es
  `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api`). Las variables de
  NextAuth/Google están en el ejemplo pero **NextAuth no está implementado todavía**;
  la autenticación es manual con token (ver abajo).

## Arquitectura

### Capa de datos: `api.ts` → `services/` → páginas

- `lib/api.ts` — wrapper delgado sobre `fetch`. Expone `api.get/post/put/patch/delete`.
  Inyecta `Content-Type`/`Accept` JSON y, si se le pasa `token`, el header
  `Authorization: Bearer`. Lanza un `ApiError` (`{ message, status, errors }`) en respuestas
  no-OK, replicando la forma de errores de validación de Laravel (`errors` = mapa de campo→mensajes).
- `lib/services/*.service.ts` — un servicio por recurso (`auth`, `expenses`, `categories`,
  `users`). Cada método es una línea que arma el endpoint y **recibe el `token` explícitamente
  como argumento**. Reexportados desde `lib/services/index.ts`.
- `types/api.ts` — tipos que reflejan exactamente los request/response de Laravel.
  Nota: los montos (`amount`, `total`, `income`, `balance`) llegan como **string**, no number,
  y hay que convertirlos con `Number(...)` en el cliente.

### Autenticación (manual, sin librería)

- El login (`app/login/page.tsx`) guarda `token` y `user` en `localStorage`.
- El guard de rutas vive en `app/dashboard/layout.tsx`: en `useEffect` lee el token de
  `localStorage` y redirige a `/login` si no existe. Todas las páginas autenticadas cuelgan
  de este layout, así que heredan el guard.
- El token se lee del contexto (`useApp()`) y se pasa a mano a cada llamada de servicio.

### Estado compartido: `AppContext` en `dashboard/layout.tsx`

`app/dashboard/layout.tsx` es el **shell autenticado** y el corazón de la app. Además de
renderizar Header + SideNav (desktop ≥768px) / BottomNav (mobile) + modal de ingresos,
define y provee `AppContext`. Las páginas consumen ese estado con el hook `useApp()`:

- `token`, `dark` (tema, persistido en `localStorage`), `wide` (breakpoint ≥860px)
- `selectedMonth` / `setSelectedMonth` — mes activo en formato `YYYY-MM`; **casi todos los
  fetches se re-disparan cuando cambia**
- `expenses` / `setExpenses` / `refetchExp` — la lista de gastos del mes, cargada centralmente
  en el layout (no en cada página). `refetchExp` hace merge por `id` en un `Map`.
- `income` / `setIncome`, `showIncModal` / `setShowIncModal`

Importar el hook desde el layout: `import { useApp } from "../dashboard/layout"` (o la ruta
relativa equivalente).

### Estilos y tema

- **No se usan clases de Tailwind** a pesar de que `tailwind.config.js` existe. Todo el
  estilado es **inline `style={{...}}`**.
- El tema (claro/oscuro) se maneja con los objetos `DARK` y `LIGHT` de `lib/constants.ts`.
  Patrón habitual en cada componente: `const t = dark ? DARK : LIGHT;` y luego `t.bg`,
  `t.card`, `t.text`, `t.muted`, etc.
- Los íconos vienen de dos fuentes: SVGs inline definidos en un componente local `Ico`
  (repetido en varias páginas para íconos de UI) y **lucide-react** para íconos de categoría
  (`lib/lucide-icons.ts`, mapa `LUCIDE_CATEGORY_ICONS` + helper `getLucideIcon`).

### Constantes y helpers (`lib/constants.ts`)

Contiene las categorías hardcodeadas del demo (`CATEGORIES`), meses/días en español, los
temas `DARK`/`LIGHT`, y helpers de formato/fecha que se usan por todos lados: `fmt` (moneda
`es-AR`), `fmtDate`, `toYMD`, `monthKey`, `keyToDate`, `keyLabel`, `currentMonthKey`.
El `DatePicker` está en `lib/helpers/datePicker.tsx` (reexportado desde `lib/helpers`).

## Convenciones

- Alias de imports: `@/*` mapea a la raíz del proyecto (ej. `@/lib/services`, `@/types/api`).
- Las páginas interactivas son Client Components (`"use client"` al inicio).
- UI y textos en **español** (locale `es-AR` para números y fechas).

## Endpoints de la API

Las rutas viven en los servicios (`lib/services/`), que son la fuente de verdad. El README
tiene una tabla de endpoints, pero **está desactualizado en las rutas de ingresos**: el
`README` dice `/user/me/income`, mientras que `users.service.ts` usa `/user/income`. Ante
una discrepancia, confiar en el servicio.
