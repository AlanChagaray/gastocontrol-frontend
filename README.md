# GastoControl — Frontend MVP

## Instalación
```bash
pnpm install
pnpm dev   # → http://localhost:3000
```

## Variables de entorno (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## Estructura
```
app/
  page.tsx              → Landing (/)
  login/page.tsx        → POST /auth/login
  register/page.tsx     → POST /auth/register
  confirm/page.tsx      → confirmación email
  dashboard/
    layout.tsx          → Shell autenticado (Header+Nav+Context)
    page.tsx            → GET /expenses/byMonth?date=
  historial/page.tsx    → GET /expenses/byMonth?date=
  agregar/page.tsx      → POST /expenses
  perfil/page.tsx       → GET|PATCH /user/me

lib/
  api.ts                → fetch wrapper (lee NEXT_PUBLIC_API_URL)
  constants.ts          → categorías, temas, helpers
  services/
    auth.service.ts     → /auth/login|register|logout
    expenses.service.ts → /expenses/byMonth | /expenses/summary | POST | DELETE
    users.service.ts    → /user/me

types/api.ts            → tipos Laravel request/response
```

## Endpoints
| Endpoint | Pantalla |
|---|---|
| POST /auth/login | Login |
| POST /auth/register | Registro |
| POST /auth/logout | Perfil |
| GET /expenses/byMonth?date=YYYY-MM | Dashboard + Historial |
| GET /expenses/summary?date=YYYY-MM | Dashboard KPIs |
| POST /expenses | Agregar |
| DELETE /expenses/:id | Historial |
| GET /user/me | Perfil |
| PATCH /user/me | Perfil — nombre |
| PATCH /user/me/password | Perfil — contraseña |
| GET /user/me/income?date=YYYY-MM | Dashboard — ingreso |
| PUT /user/me/income?date=YYYY-MM | Dashboard — editar ingreso |

Proyecto independiente · Alan Chagaray · 2025
