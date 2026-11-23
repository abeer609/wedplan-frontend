# WedPlan — Frontend Integration Guide

Everything the Next.js frontend needs to talk to `wedplan-server`.
Backend base URL (dev): `http://localhost:8000`. All endpoints below are prefixed with `/api`.

> Recommended setup: add a Next.js rewrite so the browser calls same-origin
> `/api/*` and never touches the backend host directly (avoids CORS/cookie
> issues and keeps the backend URL out of the client):
>
> ```js
> // next.config.js
> async rewrites() {
>   return [{ source: "/api/:path*", destination: `${process.env.BACKEND_URL}/api/:path*` }];
> }
> // BACKEND_URL=http://localhost:8000 (server-only env var)
> ```

---

## 1. Auth model (read this first)

- **Auth lives 100% on the frontend (Better Auth).** The backend never serves
  login/signup pages and hosts no Better Auth handler.
- Enable the **Better Auth `jwt()` plugin** on the frontend auth config — the
  backend verifies those JWTs.
- Same MongoDB database as the frontend auth (set the backend `MONGODB_URI`
  to the same Atlas DB). The backend reads the Better Auth `user` collection
  (collection name: `user`, string `_id`) to resolve role / blocked / plan.
- On **every protected request** send:
  `Authorization: Bearer <jwt>`. No cookies are required by the backend.
- Get the JWT on the client via (pick one):
  ```js
  import { authClient } from "@/lib/auth-client";
  import { jwtClient } from "better-auth/client/plugins";

  // 1) recommended: jwt plugin client
  const { data, error } = await authClient.token();
  const jwt = data?.token;

  // 2) or read the `set-auth-jwt` response header from getSession()
  await authClient.getSession({
    fetchOptions: { onSuccess: (ctx) => {
      const jwt = ctx.response.headers.get("set-auth-jwt");
    }},
  });
  ```
- Backend verification order: JWKS at
  `<BETTER_AUTH_URL>/api/auth/jwks` (override with backend env
  `BETTER_AUTH_JWKS_URL`) → HS256 fallback with `BETTER_AUTH_SECRET`.
  User id is taken from `sub` (fallback: `id`, `userId`). If the JWT's user
  has no row in the shared `user` collection you get `401 User not found` —
  this means the DBs are not shared.
- `role`, `isBlocked`, `subscriptionPlan` are **re-read from the DB per
  request**. Never trust (or send) them from the client; sending `role` in a
  profile update is ignored.
- New users default to `role: "customer"`, `roleSelected: false` (Google
  signups included). If `roleSelected === false`, show the role picker and
  call `PATCH /users/me/onboarding-role` **once** (`customer` | `vendor`).
  A second call returns `409 ALREADY_SELECTED`.
- Blocked users: backend returns `403 ACCOUNT_BLOCKED` on every protected
  call. Frontend should also block sign-in (Better Auth `databaseHooks` /
  sign-in guard) and force-logout on this code.

## 2. Request/response conventions

- JSON everywhere except `POST /uploads` (multipart, field name `image`).
- Success: `{ "success": true, "data": ... }`.
  List endpoints add `"pagination": { page, limit, total, pages }`.
- Errors: `{ "success": false, "message", "code?", "details?[]?" }`.
  `details` (422 only) = `[{ path, message }]`.
- Status codes you must handle:
  | Status | Meaning | `code` values |
  |---|---|---|
  | 400 | bad ObjectId / upload problem | `BAD_ID`, `NO_FILE`, `UPLOAD_ERROR` |
  | 401 | missing/invalid/expired JWT, or user row missing | `UNAUTHORIZED` |
  | 403 | wrong role, blocked, non-owner, free-limit | `FORBIDDEN`, `ACCOUNT_BLOCKED`, `UPGRADE_REQUIRED` |
  | 404 | record missing **or hidden from you** | `NOT_FOUND` |
  | 409 | duplicate / already-processed / one-time action done | `DUPLICATE`, `ALREADY_PROCESSED`, `ALREADY_SELECTED` |
  | 422 | zod validation failed | `VALIDATION_ERROR` (+`details`) |
  | 429 | rate limited (uploads/auth-adjacent) | `RATE_LIMITED` |
  | 503 | Stripe/ImgBB not configured on backend | `NOT_CONFIGURED` |

- Suggested fetch wrapper:
  ```js
  export class ApiError extends Error {
    constructor(status, code, message, details) {
      super(message);
      this.status = status; this.code = code; this.details = details;
    }
  }
  export async function api(path, { token, ...init } = {}) {
    const res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false)
      throw new ApiError(res.status, json?.code, json?.message || `HTTP ${res.status}`, json?.details);
    return json;
  }
  // usage: api("/vendor/services", { token, method: "POST", body: JSON.stringify({...}) })
  ```
- Role guard pattern (Next.js): after `GET /users/me`, route by
  `data.role` (`customer` | `vendor` | `admin`). Treat 401 as logged-out,
  403 `ACCOUNT_BLOCKED` as force-logout + "account blocked" screen.

## 3. Public endpoints (no token)

### `GET /services` — browse services
Only `status: "approved"` **and** `isActive: true` are ever returned.
```
GET /api/services?search=hall&category=venue&location=dhaka&sort=price_asc&page=1&limit=12
```
| Query | Rules |
|---|---|
| `search` | ≤100 chars, matches name/description/location (case-insensitive) |
| `category` | one of `venue, catering, photography, decoration, music, makeup` |
| `location` | ≤100 chars, substring match |
| `sort` | `price_asc` \| `price_desc` \| `newest` (default) |
| `page` / `limit` | ≥1; `limit` ≤ 50 (default 12) |
→ `{ success, data: Service[], pagination }`

### `GET /services/featured`
`GET /api/services/featured?limit=8` (limit ≤ 20). Newest public services.
### `GET /categories`
`GET /api/categories` (alias: `GET /api/services/categories`) →
`{ success, data: ["venue","catering","photography","decoration","music","makeup"] }`.
Use for filter dropdowns — hardcode is fine too, values are stable.

### Service object
```jsonc
{
  "_id": "507f1f77bcf86cd799439011",
  "vendorId": "abc123",            // Better Auth user id (string)
  "serviceName": "Grand Palace Hall",
  "category": "venue",             // enum above
  "description": "...",
  "price": 50000,
  "location": "Dhaka",
  "images": ["https://..."],      // ImgBB URLs, max 10
  "status": "approved",            // pending | approved | rejected
  "isActive": true,                // vendor availability toggle
  "createdAt": "...", "updatedAt": "..."
}
```

## 4. Service detail (token REQUIRED)

```
GET /api/services/:id        Authorization: Bearer <jwt>
```
- `:id` must be a 24-hex ObjectId or you get `400 BAD_ID`.
- Private services (`pending`/`rejected`/inactive) return `404` unless the
  caller **owns** them (vendor) or is **admin**. Design the detail page as a
  **logged-in page**; logged-out visitors get 401 — redirect them to login
  with a return URL.
- Owners see their own non-public services (useful for "my listing preview").

## 5. Vendor — services (`vendor` or `admin` token)

### `POST /vendor/services` — create (201)
```jsonc
{
  "serviceName": "Grand Palace Hall",   // 3–120 chars (required)
  "category": "venue",                  // enum (required)
  "description": "Spacious hall ...",   // 10–5000 chars (required)
  "price": 50000,                       // ≥ 0 (required)
  "location": "Dhaka",                  // 2–200 chars (required)
  "images": ["https://..."]             // optional, ≤ 10 http(s) URLs
}
```
- New services start as `status: "pending"`, `isActive: true`. **Not public
  until an admin approves.** Show a "pending review" state in the UI.
- **Free-plan limit:** vendors on `free` may have at most **3** services
  where `status != "rejected"` **and** `isActive: true`. Exceeding returns
  `403 UPGRADE_REQUIRED` → show an Upgrade CTA (see §8). Count includes
  pending services, so vendors can't stockpile unapproved listings.
- Upload images **first** via `POST /uploads`, then put the returned URLs in
  `images`.

### `GET /vendor/services` — my listings (all statuses)
`GET /api/vendor/services?status=pending&page=1&limit=20`
`status` filter is optional (`pending|approved|rejected`). Vendors always see
their own `rejected` items — render them with a "rejected" badge (they never
appear publicly).

### `PATCH /vendor/services/:id` — edit
Partial body, at least one field; same length rules as create.
**Important:** editing any of `serviceName, category, description, price,
location` resets `status` back to `"pending"` (re-moderation). Warn the
vendor in the UI ("edits send the listing back for review"). Editing only
`images` does not reset status.
- `403` = not your service. `404` = doesn't exist.

### `DELETE /vendor/services/:id` — delete → `{ success, message }`

### `PATCH /vendor/services/:id/availability` — active toggle
Flips `isActive`. **Reactivating counts toward the free limit**: a free
vendor at 3/3 active gets `403 UPGRADE_REQUIRED` when toggling back on.
Disable/guard the toggle in the UI when the vendor is at the limit.
New services should show an "Active / Paused" switch bound to this endpoint.

## 6. Customer — bookings (`customer` token)

> Only `customer` role can use these three endpoints (plus admins).
> Vendors book nothing; `POST /bookings` as a vendor → `403`.

### `POST /bookings` — create (201)
```jsonc
{ "serviceId": "507f...", "eventDate": "<ISO datetime>", "eventLocation": "Dhaka Hall", "message": "optional ≤1000 chars" }
```
Rules the UI must enforce pre-submit (server re-checks all):
- Service must be **public** (approved + active) or `404`.
- **No self-booking**: the service's vendor can't be you (`403`).
- `eventDate` must be **in the future** — send a full ISO datetime, not a
  bare date. Pitfall: `new Date("2026-12-01")` is midnight and may already
  be past; combine the date picker with a time or default to noon.
- **Duplicates:** same `(serviceId, customer, eventDate)` with status
  pending/accepted → `409 DUPLICATE`. Disable double-submit; on 409 show
  "you already requested this service for that date" and link to My Bookings.

### `GET /bookings/mine` — my bookings
`GET /api/bookings/mine?status=pending&page=1&limit=20`. `serviceId` is
populated (`serviceName, images, price, location`).

### Booking object & `PATCH /bookings/:id/cancel`
```jsonc
{ "_id": "...", "serviceId": {...populated...}, "vendorId": "abc", "customerId": "xyz",
  "eventDate": "...", "eventLocation": "...", "message": "...",
  "status": "pending", "createdAt": "...", "updatedAt": "..." }
// status: pending | accepted | rejected | cancelled
```
- Cancel works **only from `pending`** and only by the owner. Otherwise
  `409 ALREADY_PROCESSED` ("too late to cancel") — refresh the row.
- Show cancel button only when `status === "pending"`.
- Allowed transitions: `pending → accepted | rejected` (vendor),
  `pending → cancelled` (customer). Nothing else is possible — don't render
  other actions.

## 7. Vendor — incoming bookings (`vendor` or `admin` token)

- `GET /api/vendor/bookings?status=&page=&limit=` — requests for my services
  (populated service). Filter tabs: pending / accepted / rejected / cancelled.
- `PATCH /api/vendor/bookings/:id/accept` → `accepted`
- `PATCH /api/vendor/bookings/:id/reject` → `rejected`
- Both are **atomic**: only `pending` rows owned by me transition; anything
  else → `409 ALREADY_PROCESSED`. On 409, re-fetch the list (another tab or
  the admin may have acted). Optimistic UI must roll back on 409.

## 8. Profile & onboarding (any logged-in token)

- `GET /api/users/me` → full user doc **plus `effectivePlan`**
  (`"free"` | `"premium"` — expiry-aware). **Display `effectivePlan`, not
  `subscriptionPlan`**, for gating/limit UI.
  ```jsonc
  { "_id": "...", "name": "", "email": "...", "image": "", "phone": "",
    "role": "customer", "isBlocked": false, "roleSelected": false,
    "businessName": "", "subscriptionPlan": "free",
    "subscriptionExpiresAt": null, "stripeCustomerId": null,
    "effectivePlan": "free", "createdAt": "...", "updatedAt": "..." }
  ```
- `PATCH /api/users/me` — whitelist only:
  `{ name (1–100), image (http(s) URL, ≤2048, "" allowed), businessName (≤150), phone (≤30) }`,
  at least one field. Extra fields (`role`, `subscriptionPlan`, …) are
  silently dropped — don't build UI that posts them.
- `PATCH /api/users/me/onboarding-role` — `{ "role": "customer" | "vendor" }`,
  one-time. Flow: after signup/Google login, if `roleSelected === false`,
  show role picker → call once → route to `/` or `/vendor`. Second call →
  `409 ALREADY_SELECTED` (treat as success, continue routing).
- Avatar/profile image: upload via `POST /uploads` first, then save the URL
  with `PATCH /me`. (Signup image is uploaded **after** the account exists.)

## 9. Subscriptions / premium (`vendor` or `admin` token)

- `GET /api/subscriptions/me` → poll this for plan state:
  ```jsonc
  { "plan": "free",                 // effective: free | premium (USE THIS)
    "subscriptionPlan": "free",     // raw stored value
    "subscriptionExpiresAt": null,  // ISO or null
    "stripeCustomerId": "cus_..." }  // null until first checkout
  ```
- `POST /api/subscriptions/checkout` (201) → `{ url, sessionId }`.
  Redirect the browser to `url` (Stripe Checkout, subscription mode).
  Success lands on `/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  cancelled lands on `/payment/cancelled`.
- **Success page must ONLY poll `GET /subscriptions/me`** until `plan`
  becomes `"premium"` (e.g. every 2–3s, timeout ~60–90s with a "still
  processing — webhooks can lag, check Stripe CLI in dev" state). **Never
  set premium client-side** — premium is granted exclusively by the Stripe
  webhook. If polling times out, show "payment received, activation pending"
  and let them retry polling later.
- `POST /api/subscriptions/portal` → `{ url }` (Stripe billing portal:
  manage/cancel). Show only when `stripeCustomerId` is set; otherwise the
  endpoint 404s — hide the button.
- Downgrade semantics for the UI: when premium lapses, existing services
  **stay**, but creating/reactivating beyond the free limit is blocked
  (`UPGRADE_REQUIRED`). Show a persistent "Free plan (3 active listings)"
  meter from `GET /vendor/stats` + `plan`.
- Dev testing: `stripe listen --forward-to localhost:8000/api/webhooks/stripe`.

## 10. Stats dashboards (token)

- `GET /api/vendor/stats` (vendor/admin) →
  ```jsonc
  { "services": { "total": 0, "active": 0, "pending": 0 },
    "bookings": { "total": 0, "pending": 0, "accepted": 0 },
    "plan": "free" }
  ```
  Use `services.active` for the "2 / 3 free listings used" meter.
- `GET /api/customer/stats` (any role) →
  `{ "bookings": { "total": 0, "pending": 0, "accepted": 0, "cancelled": 0 } }`
- Admin overview: `GET /api/admin/stats` (users/services/bookings/revenue —
  revenue sums `paid` transactions only) and
  `GET /api/admin/subscriptions/overview` (`{ premium, free }`).

## 11. Image upload (token)

```
POST /api/uploads     Content-Type: multipart/form-data, field: image
```
- Constraints: single file, ≤ 2MB, `jpg/png/webp` only (else 400).
  Rate-limited — don't retry in a tight loop.
- 201 → `{ success, data: { url, displayUrl, deleteUrl } }`. Store **`url`**
  in service `images[]` / profile `image`. Secret key stays server-side;
  the client never sees it.
- 503 `NOT_CONFIGURED` = backend missing `IMGBB_API_KEY` — surface as
  "uploads temporarily unavailable".

## 12. Admin panel (`admin` token; everything under `/api/admin`)

| Endpoint | Use |
|---|---|
| `GET /admin/users?search=&role=&page=&limit=` | user table; search matches name/email |
| `GET /admin/users/:id` | user detail |
| `PATCH /admin/users/:id/block` / `.../unblock` | block toggle. Cannot block self or other admins (`403`) — disable those buttons |
| `GET /admin/services?status=&category=&page=&limit=` | moderation queue (all statuses) |
| `PATCH /admin/services/:id/approve` | shortcut → approved |
| `PATCH /admin/services/:id/reject` | shortcut → rejected |
| `PATCH /admin/services/:id/status` `{ status: approved\|rejected\|pending }` or `{ action: approve\|reject }` | generic moderation (one of the two keys required) |
| `DELETE /admin/services/:id` | hard delete |
| `GET /admin/transactions?status=&page=&limit=` | **read-only** ledger (`paid\|failed\|refunded\|expired`); no create/edit endpoints exist |
| `GET /admin/stats`, `GET /admin/subscriptions/overview` | dashboard cards |

After approve/reject, the service appears/disappears from public listing
immediately (public = approved + active).

## 13. Suggested pages & wiring

| Page | Calls |
|---|---|
| `/` (browse) | `GET /categories` + `GET /services?...` (no token) |
| `/services/:id` | requires login → `GET /services/:id` with token; customer sees Book CTA |
| Book dialog (customer) | date/time + location form → `POST /bookings`; handle 409 duplicate; invalid service → 404 "no longer available" |
| `/bookings` (customer) | `GET /bookings/mine?status=` + cancel buttons (pending only) |
| `/vendor` dashboard | `GET /vendor/stats` (meter, plan badge) + `GET /vendor/services` |
| `/vendor/services/new` | upload images → `POST /uploads`, then `POST /vendor/services`; catch `UPGRADE_REQUIRED` → upgrade modal |
| `/vendor/services/:id/edit` | `PATCH ...`; warn that key-field edits → re-review |
| `/vendor/bookings` | `GET /vendor/bookings?status=pending` + accept/reject; rollback UI on 409 |
| `/vendor/premium` | `GET /subscriptions/me` → checkout button → `POST /subscriptions/checkout` → redirect; portal button when `stripeCustomerId` set |
| `/payment/success` | read `session_id` (display only) → poll `GET /subscriptions/me` → premium |
| `/profile` | `GET /users/me`, `PATCH /users/me` (upload avatar first if changed) |
| onboarding modal | if `!roleSelected` → `PATCH /users/me/onboarding-role` → route by role |
| `/admin/*` | tables per §12; block/approve/reject with 403 handling |

## 14. Edge cases checklist

- [ ] No token on protected route → 401 → login redirect (preserve return URL).
- [ ] `ACCOUNT_BLOCKED` anywhere → logout + blocked notice.
- [ ] `UPGRADE_REQUIRED` on create/reactivate → upgrade modal (never silently fail).
- [ ] `ALREADY_PROCESSED` on booking actions → re-fetch, show current status.
- [ ] `ALREADY_SELECTED` on onboarding → treat as done, continue routing.
- [ ] Poll timeout on `/payment/success` → "activation pending" state, allow re-poll.
- [ ] Past-date booking → validate client-side before POST (server 422s).
- [ ] Detail page for pending/rejected service as non-owner → 404 → "not found" page (expected, not a bug).
- [ ] Vendor viewing own pending service → visible with "pending review" banner.
- [ ] Empty `images: []` is valid; max 10 URLs.
- [ ] Query `limit` > 50 → 422; clamp pagination controls client-side.
