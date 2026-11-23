# WedPlan — Client

Next.js frontend for WedPlan, a wedding service marketplace connecting customers with vendors (venues, catering, photography, decoration, music, makeup).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4, Radix UI primitives, lucide-react icons
- Better Auth (email/password + Google OAuth, JWT plugin) with MongoDB adapter
- TanStack React Query, React Hook Form + Zod, Stripe.js, Sonner toasts

## Prerequisites

- Node.js 20+
- MongoDB database (shared with `wedplan-server` — the backend reads the same Better Auth `user` collection)
- Backend running at `http://localhost:8000` (see `FRONTEND.md` for the full API contract)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                  # http://localhost:3000
```

Required env vars (see `.env.example`):

| Var | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | public | Canonical app URL |
| `BETTER_AUTH_URL` | server | Base URL for auth handler + JWKS |
| `BETTER_AUTH_SECRET` | server | HS256 fallback secret (min 32 chars) |
| `BACKEND_URL` | server | Backend base URL used by the `/api` rewrite |
| `MONGODB_URI` | server | Shared MongoDB connection string |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | server | Optional Google OAuth |

`next.config.ts` rewrites same-origin `/api/:path*` to `${BACKEND_URL}/api/:path*` so the browser never calls the backend host directly (avoids CORS/cookie issues).

## Scripts

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # serve production build
npm run lint   # eslint
```

## Routes

| Area | Pages |
|---|---|
| Public | `/`, `/services`, `/services/:id` (login required for detail), `/signin`, `/signup` |
| Onboarding | `/onboarding` (one-time role picker: customer \| vendor) |
| Customer | `/dashboard/customer`, `/dashboard/customer/bookings`, `/dashboard/customer/profile`, `/profile` |
| Vendor | `/dashboard/vendor`, `/dashboard/vendor/services`, `/dashboard/vendor/services/new`, `/dashboard/vendor/services/:id/edit`, `/dashboard/vendor/bookings`, `/dashboard/vendor/subscription`, `/dashboard/vendor/profile` |
| Admin | `/dashboard/admin`, `/dashboard/admin/users`, `/dashboard/admin/services`, `/dashboard/admin/transactions` |
| Payments | `/payment/success` (polls subscription status until premium), `/payment/cancel` |

Auth model: all auth lives on this frontend via Better Auth with the `jwt()` plugin. Every protected backend request sends `Authorization: Bearer <jwt>`. New users default to `roleSelected: false` and must pick a role once. See `FRONTEND.md` for endpoint details, status-code handling (`ACCOUNT_BLOCKED`, `UPGRADE_REQUIRED`, `ALREADY_PROCESSED`, …) and edge cases.

## Docs

- `FRONTEND.md` — full backend API integration guide (source of truth for wiring)
- `frontend-plan.md` — build plan
- `AGENTS.md` — agent working rules for this repo
