# WedPlan — Frontend Plan (Next.js + TypeScript + ShadCN + Better Auth client)

## 1. Key architecture decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js App Router, TypeScript | Layout nesting for dashboards, server-side guards |
| UI | ShadCN + Tailwind, Framer Motion (`motion`) on home only | Spec requirement; avoids animation clutter |
| API access | `next.config` **rewrites** `/api/:path*` → Express server | Same-origin → no CORS, cookies work after refresh |
| Auth | `better-auth/react` client pointed at same origin; session via cookie | Navbar reacts instantly via `useSession()` |
| Route guarding | (1) `middleware.ts`: optimistic cookie check → redirect to `/signin?redirect=…`. (2) Dashboard `layout.tsx`: server-side fetch of session/role → `redirect()` if wrong role. (3) Backend remains the real authority | Manual URL changes can't expose another role's dashboard |
| Data fetching | TanStack Query (cache, loading/error states, invalidation after mutations) | Consistent loaders, no stale lists |
| Forms | react-hook-form + zod (mirrors server rules) | Inline validation + toast on server errors |
| Toasts | `sonner` (no `alert()`) | Spec |
| Images | Upload via backend `/api/uploads` (no ImgBB key in client) | Secret safety |
| Hosting | Vercel; verify refresh on every route and `not-found.tsx` | "No reload issues" requirement |

## 2. Route map

```
app/
  (public)/
    page.tsx                    Home
    services/page.tsx           Browse (search, category, location, sort)
    signin/  signup/
  services/[id]/page.tsx        Details (private → redirect to /signin)
  onboarding/page.tsx           Role pick for first-time Google users
  payment/success/  payment/cancel/   (private)
  dashboard/
    layout.tsx                  sidebar shell + role guard
    page.tsx                    redirects to role home
    vendor/   overview · services · services/new · services/[id]/edit · bookings · subscription · profile
    customer/ overview · bookings · profile
    admin/    overview · users · services · transactions
  not-found.tsx  error.tsx  loading.tsx
middleware.ts
```

Post-login redirect: admin → `/dashboard/admin`, vendor → `/dashboard/vendor`, customer → `/dashboard/customer` (or the `?redirect=` target if present and allowed).

## 3. Component plan

- **Layout:** `Navbar` (public vs authed; avatar dropdown: name + image, Dashboard, Profile Settings, Logout), `Footer` (logo + blurb, links, contact, socials, copyright), `DashboardShell` (responsive sidebar → sheet on mobile, role-based nav config)
- **Shared:** `ServiceCard`, `ServiceGrid`, `CategoryCard`, `StatCard`, `StatusBadge`, `DataTable`, `ConfirmDialog`, `ImageUploader`, `EmptyState`, `Loader/Skeletons`, `PremiumBadge`, `PasswordField`
- **Forms:** `SignUpForm`, `SignInForm`, `ServiceForm` (add/edit), `BookingForm` (dialog), `ProfileForm`
- **Hooks:** `useAuth/useRole`, `useServices`, `useBookings`, `useSubscription`, `useUpload`
- **lib:** `api.ts` (fetch wrapper → normalises errors, handles 401 → signin, 403 → toast), `auth-client.ts`, `constants.ts` (categories, statuses), `schemas.ts` (zod)

## 4. Page requirements checklist

**Home:** banner (headline, description, "Explore Wedding Services" CTA, wedding background) · Featured Services (≥ 6 from `/services/featured`) · Categories (6, each links to `/services?category=…`) · "Why Choose WedPlan?" · one extra (How It Works / Testimonials) · motion: fade/slide-in on scroll via `whileInView` (once), staggered card entrance; respect `prefers-reduced-motion`.

**Browse:** debounced search (name), category + location filters, price sort asc/desc, params stored in URL (shareable, survives reload), skeleton loading, empty state, pagination. "View Details" for guests → `/signin?redirect=/services/:id`.

**Details:** image gallery, category, description, price, location, vendor info, **Book** button. Disabled/hidden with explanation for vendors and admins; guests redirected; invalid ID → friendly error/404 state. Booking dialog: event date (future only), event location, message → success/409 duplicate toasts.

**Sign up:** name, email, password (≥ 6, upper + lower, live hints), optional image, role (Vendor/Customer only), Google button. Flow: create account → upload image → update profile → redirect by role.
**Sign in:** credentials + Google, toasts, role-based redirect, blocked-user message.

**Vendor:** Overview (total, active, pending requests, accepted, current plan) · My Services (table: status badge, edit/delete with confirm, availability switch; rejected shown but flagged) · Add Service (all fields + file upload, shows free-limit error with upgrade CTA) · Booking Requests (customer, service, date, location, message, status; Accept/Reject only enabled while pending) · Subscription (Free vs Premium cards, "Upgrade to Premium" → backend session → `window.location = session.url`, shows premium status/expiry) · Profile.

**Customer:** Overview (total/pending/accepted/rejected) · My Bookings (service image/name, vendor, date, location, status, requested-on; details dialog; Cancel only while pending) · Profile.

**Admin:** Overview (6 stats) · Users (search name/email, role filter, details drawer, block/unblock) · Services (search/filter, approve/reject/change status/delete) · Transactions (vendor, plan, amount, status, date — **read-only, no edit actions**).

**Profile settings:** name, image, business name (vendor). Role and plan shown read-only.

**Payment success:** "Confirming payment…" state polling `/subscriptions/me` (every 2 s, ~30 s max) → shows confirmed or "still processing" message. Never grants anything itself. **Cancel:** friendly message + back to subscription.

## 5. UI/UX design direction

### 5.1 Visual identity: "modern romantic," not "frilly"
- **Palette (define as ShadCN CSS variables first):** ivory background `#FBF8F4`, blush/dusty-rose primary, muted gold accent used sparingly (CTAs, Premium badge), warm charcoal text. No pure white or pure black.
- **Type:** Playfair Display or Cormorant for hero, section titles and prices; Inter or DM Sans for body and all dashboard UI. Serif only where there is emotion; dashboards stay sans for readable tables.
- **Shape:** `rounded-2xl` cards, soft shadows, generous whitespace; photography carries the visual weight.
- **Design tokens:** one theme file (colors, radii, fonts, spacing scale) so every component stays consistent.

### 5.2 Public pages
- **Home hero:** full-bleed wedding photo with soft gradient overlay, two-line headline, a single gold CTA ("Explore Wedding Services"), optional subtle search bar below. One clear action only.
- **Categories:** 6 image tiles with hover zoom; 2 columns on mobile, 3 on desktop.
- **Service card:** 4:3 image, category chip, name, location, price (serif, gold), vendor avatar + name; Premium badge on Premium vendors.
- **Browse:** sticky filter bar on desktop → "Filters" bottom sheet on mobile; skeleton cards while loading; illustrated empty state with a "Clear filters" button.
- **Details:** gallery with thumbnails on the left, sticky booking card on the right. On mobile the booking card becomes a fixed bottom bar (price + "Request Booking").

### 5.3 Dashboards
- **Shell:** collapsible left sidebar (slide-in sheet on mobile), top bar with breadcrumbs and profile menu.
- **Role accent colors:** rose for customer, gold for vendor, slate for admin, so the current dashboard is obvious at a glance.
- **Stat cards:** icon, large number, label.
- **Tables:** consistent status badge colors everywhere — amber = pending, green = accepted/approved, red = rejected, grey = cancelled. On mobile, tables become stacked cards.
- **Subscription page:** Free vs Premium side by side, current plan highlighted, Premium card with gold border.
- **Destructive actions** (delete, reject, block) always use a confirm dialog.

### 5.4 Motion (home page only)
- `whileInView` fade/slide-up with `once: true`, staggered card entrances (~0.08s), gentle hero text reveal.
- Each animation under 0.6s; respect `prefers-reduced-motion`.
- No animation inside dashboards.

### 5.5 Feedback states
- **Loading:** skeletons for lists/cards; spinner inside buttons while a form submits (button disabled).
- **Success/errors:** `sonner` toasts; inline field errors; live password-rule checklist on sign-up.
- **Empty states:** every list has an icon, one-line explanation and an action.
- **Errors:** error boundaries + `not-found.tsx`; 401 → sign-in, 403 → "not allowed" page; failed image upload handled explicitly.

### 5.6 Responsive and accessibility
- Breakpoints: mobile (<640), tablet (640–1024), desktop (>1024); mobile nav sheet; touch targets ≥ 44px.
- Visible focus rings, real form labels, image alt text, AA contrast. Check gold on ivory (often fails) and use a darker gold for text.

### 5.7 Optional next step
Before coding, mock up the Home and Service Details pages to lock the look, then build the ShadCN theme from those tokens.

## 6. Environment & security

- Client `.env.example`: `NEXT_PUBLIC_APP_URL`, `API_URL` (server origin for rewrites). **No secrets in client** — Stripe/ImgBB/Google secrets live only on the server.
- `.env*` git-ignored. Don't expose anything via `NEXT_PUBLIC_` that isn't public.
- Never trust UI role checks; hide links for UX only.

## 7. Commit plan (≥ 20 meaningful commits)

1. `initialize Next.js TypeScript project with Tailwind`
2. `set up ShadCN, theme tokens, fonts and global styles`
3. `add API rewrites, fetch wrapper and error normalisation`
4. `build responsive Navbar and Footer`
5. `integrate Better Auth client and session provider`
6. `sign-up page with validation, role select and image upload`
7. `sign-in page with Google login and role-based redirect`
8. `route middleware and role guard for protected pages`
9. `home banner and Why Choose WedPlan section`
10. `featured services and categories sections`
11. `add Framer Motion animations to home sections`
12. `browse services page with search, filters and price sorting`
13. `reusable ServiceCard, skeleton loaders and empty states`
14. `service details page with gallery and error handling`
15. `booking form dialog with validation and toasts`
16. `dashboard layout with role-based sidebar`
17. `customer overview and my bookings with cancel`
18. `vendor overview and my services management`
19. `add/edit service form with ImgBB upload`
20. `vendor booking requests with accept/reject`
21. `vendor subscription page and Stripe checkout redirect`
22. `payment success and cancel pages with status polling`
23. `profile settings page for vendor and customer`
24. `admin overview and manage users`
25. `admin service moderation and transactions table`
26. `responsive polish, not-found/error pages, reload checks`
27. `README with features, setup, live and repo links`

## 8. Build order & pre-submit checks

Order: setup/theme → navbar/footer → auth + guards → public pages → details/booking → dashboards (customer → vendor → admin) → payments → polish → deploy early and keep redeploying.

Verify on the **live site**: hard-refresh on every route (incl. dashboards and `/services/[id]`), stay logged in after refresh, wrong-role URL → redirected, Google login works with production redirect URI, Stripe test checkout → premium appears only after webhook, mobile/tablet/desktop layouts, no console secrets, README has live + both repo links, admin credentials work.
