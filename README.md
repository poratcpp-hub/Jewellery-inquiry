# PORAT Private Jeweler — CRM

מערכת ניהול לעסק תכשיטים: לידים ← הצעות מחיר ← הזמנות, כולל תשלומים, הוצאות, לקוחות, ספקים, יומן ודשבורד.

Built with **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4**, and **Supabase** (Postgres + Auth).

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000
```

Configure `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (JWT) key |
| `NEXT_PUBLIC_DEMO_MODE` | `true` → run entirely on in-memory demo data, no Supabase needed |

The database schema lives in `supabase/schema.sql` (plus follow-up migration scripts in the same folder).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint over the whole repo |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |
| `npm test` | Unit tests (Vitest) for the business logic in `lib/` |

CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build (in demo mode) on every push to `main` and every pull request.

## Architecture

- **`app/`** — one route per screen. All pages are client components; data is fetched from the browser through the shared data layer.
- **`lib/data.ts`** — the single data-access layer. Every read/write goes through here; each writer builds an explicit column payload (relations stripped, `''` → `null`, partial updates never overwrite fields they don't mention). When `NEXT_PUBLIC_DEMO_MODE=true`, every function serves in-memory data from `lib/demo-data.ts` instead.
- **`lib/workflow.ts`** — pure business rules: jewelry-type detection, missing-detail checklists per jewelry type, auto lead status, WhatsApp message templates, deal-quality scoring.
- **`lib/hooks.ts`** — shared UI hooks (`useUnsavedChanges`, `useResetOnOpen`, `useDebounce`, `useTableSort`).
- **`components/`** — form dialogs per entity + reusable UI kit under `components/ui/`.
- **`proxy.ts`** — Supabase-session auth gate for every non-public route (Next.js proxy).

## Built-in automations

The pipeline maintains itself; these rules run inside `lib/data.ts` so every page behaves the same:

- **New lead → customer**: creating a lead auto-links it to an existing customer by phone/email, or creates one.
- **Lead closed → order**: setting a lead to «נסגר להזמנה» auto-creates the order (idempotent — an existing linked order is reused, never duplicated).
- **Quote → order** (`createOrderFromLeadOrQuote`): one conversion path for both the leads flow and the quotes flow. Copies specs and pricing, links quote + lead + customer, marks the quote approved.
- **Quote sent → follow-up** (`changeQuoteStatus`): marking a quote «נשלחה ללקוח» moves the linked lead to «נשלחה הצעת מחיר» and schedules a follow-up reminder 3 days out.
- **Quote expiry** (`autoExpireQuotes`): sent quotes past their `valid_until` date are marked «פג תוקף» automatically when the quotes page loads.
- **Payments → order state** (`syncOrderPaymentState`): recording, editing, or deleting a payment — from the order page **or** the financials page — recalculates the order's balance and payment status, advances «מחכה למקדמה» → «מקדמה התקבלה» when money arrives, and refreshes the customer's aggregate stats (revenue, profit, VIP tier).
- **Customer tiers** (`refreshCustomerStats`): orders count / revenue drive the status automatically (פוטנציאלי → חדש → חוזר → VIP).
