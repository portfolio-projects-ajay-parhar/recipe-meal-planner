# 🍳 Recipe & Meal Planner

> A full-stack recipe discovery and weekly meal-planning application — search thousands of recipes, plan your week on a calendar, and auto-generate aisle-sorted shopping lists from your meal plan.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Prisma](https://img.shields.io/badge/Prisma-7-2d3748) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791) ![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38bdf8) ![NextAuth](https://img.shields.io/badge/NextAuth-v4-22c55e)

## Table of Contents

1. [Problem](#1-problem)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Database Schema](#5-database-schema)
6. [API Documentation](#6-api-documentation)
7. [Authentication Strategy](#7-authentication-strategy)
8. [Security Considerations](#8-security-considerations)
9. [Testing Strategy](#9-testing-strategy)
10. [Performance Considerations](#10-performance-considerations)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Screenshots](#12-screenshots)
13. [Demo](#13-demo)
14. [What I Learned](#14-what-i-learned)
15. [Future Improvements](#15-future-improvements)
16. [Trade-offs & Design Decisions](#16-trade-offs--design-decisions)
17. [Scaling Strategy](#17-scaling-strategy)

---

## 1. Problem

Planning meals for a week is fragmented and tedious:

- **Recipe discovery is scattered** across blogs, videos, and social media with no structured filtering by diet, cuisine, cook time, or calories.
- **Manual grocery lists are error-prone** — translating a week of planned meals into one shopping list means mentally deduplicating ingredients and summing quantities across recipes.
- **Existing meal-planner apps are paywalled or bloated**, locking basic planning features behind subscriptions.

This app solves all three: unified recipe search powered by the [Spoonacular](https://spoonacular.com/food-api) API, a weekly meal calendar, and **one-click shopping list generation** that aggregates ingredients across every meal in a plan — deduplicated by name + unit and scaled by servings.

---

## 2. Features

### 🔍 Recipe Discovery
- Full-text recipe search with rich filters: **cuisine, diet, meal type, max ready time, calorie range, intolerances**, plus sorting
- Debounced live search (400 ms) so the external API isn't hammered on every keystroke
- Offset-based pagination (12 results per page)
- Detailed recipe view: instructions, ingredients, nutrition, prep time, servings

### ❤️ Favorites
- One-click favorite toggle from search results or the recipe detail page
- Per-user favorites list, with `isFavorite` injected into search results for logged-in users

### 📅 Weekly Meal Planning
- Calendar-style week grid (Monday–Sunday × Breakfast/Lunch/Dinner/Snack)
- Multiple named meal plans, keyed by `weekStart`
- Add any recipe to any day/meal slot with custom serving counts

### 🛒 Smart Shopping Lists
- **Auto-generate** a shopping list from any meal plan
- Ingredients aggregated by `name + unit`, quantities multiplied by per-entry servings
- Items grouped/sorted by supermarket **aisle**
- Checkable items with optimistic UI updates

### 🔐 Accounts
- Email/password registration and sign-in
- Protected pages and API endpoints

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server components, file-based API routes, image optimization |
| **UI** | React 19, Tailwind CSS 4, lucide-react | Concurrent rendering, utility-first styling |
| **Language** | TypeScript 5 (strict) | End-to-end type safety, incl. augmented NextAuth session types |
| **Database** | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) | Relational data with typed queries via the driver adapter |
| **Auth** | NextAuth v4 + Prisma Adapter + bcryptjs | Battle-tested session management, JWT strategy |
| **Data fetching** | TanStack React Query 5 + Axios | Client-side caching, loading/error states, request deduplication |
| **Validation** | Zod + react-hook-form | Shared schema validation on forms *and* API routes |
| **External API** | Spoonacular Food API | Recipe database, nutrition data, ingredient metadata |
| **Utilities** | date-fns (week math), tsx (seeding) | — |

## 4. Architecture

The app follows the **Next.js full-stack pattern**: a single deployable unit containing a React frontend, a Node.js API layer (Route Handlers), and a data layer (Prisma → PostgreSQL). Third-party recipe data is proxied through the backend so the Spoonacular API key never reaches the browser, and responses are cached in PostgreSQL to reduce external API usage.

```mermaid
flowchart TD
    subgraph Browser["🌐 Browser"]
        UI["React Client Components<br/>Pages + Hooks<br/>(useDebounce, useRecipeSearch, useFavorites)"]
        RQ["TanStack React Query cache"]
    end

    subgraph NextServer["▲ Next.js Server"]
        AuthMW["NextAuth handler<br/>/api/auth/[...nextauth]"]
        API["API Route Handlers<br/>recipes · favorites ·<br/>meal-plans · shopping-lists"]
        Guards["requireAuth() / getSession()<br/>+ Zod validation"]
        SC["SpoonacularClient<br/>24h TTL read-through cache"]
    end

    PG[("PostgreSQL")]
    EXT["🍽️ Spoonacular API<br/>(server-side only)"]

    UI --> RQ --> API
    UI -- signIn / signOut --> AuthMW
    API --> Guards --> PG
    API --> SC --> EXT
    SC -. cache hit / write-back .-> PG
```

### Request-flow highlights

- **Every mutating endpoint** runs `requireAuth()` → Zod `.parse()` → user-scoped Prisma query (`where: { userId }`), so users can only touch their own rows.
- **Spoonacular caching**: search results are written to `CachedRecipe` in the background (`Promise.allSettled`, non-blocking); detail fetches use a read-through cache with a 24 h TTL.
- The Prisma client is a **singleton via a `globalThis` guard** to avoid connection exhaustion during dev hot-reload.

Full build documentation lives in [`docs/PLAN.md`](docs/PLAN.md) and [`docs/phases/`](docs/phases/) (8 implementation phases).

## 5. Database Schema

Managed with Prisma Migrate. 9 models: 4 NextAuth tables, 1 recipe-cache table, and 4 domain tables.

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : "OAuth identities"
    USER ||--o{ SESSION : ""
    USER ||--o{ FAVORITE : saves
    USER ||--o{ MEAL_PLAN : owns
    USER ||--o{ SHOPPING_LIST : owns
    CACHED_RECIPE ||--o{ FAVORITE : "favorited as"
    CACHED_RECIPE ||--o{ MEAL_PLAN_ENTRY : "planned as"
    MEAL_PLAN ||--|{ MEAL_PLAN_ENTRY : contains
    SHOPPING_LIST ||--|{ SHOPPING_LIST_ITEM : contains
```

### Key design decisions

- **`CachedRecipe` uses the Spoonacular numeric id as its primary key** — a natural-key upsert target that keeps favorites and meal entries pointing at stable ids even when cache rows refresh.
- **`@@unique([userId, recipeId])` on `Favorite`** makes toggling idempotent at the DB level, not just in application code.
- **Composite index `[userId, weekStart]` on `MealPlan`** supports the most common query ("my plan for this week"); the `[cachedAt]` index serves TTL lookups.
- **JSON columns** (`extendedIngredients`, `nutrition`) store semi-structured third-party payloads that are only ever read whole — no reason to normalize 30+ nutrition fields relationally.
- All user-owned relations **cascade on delete**, so removing a user cleans up favorites, plans, lists, entries, and items atomically.
- `dayOfWeek` intentionally uses **0 = Monday … 6 = Sunday** to match the calendar grid (not JS's `Date.getDay()` convention).
- `mealType` is a Postgres enum: `BREAKFAST | LUNCH | DINNER | SNACK`.

<details>
<summary>Full Prisma schema</summary>

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts       Account[]
  sessions       Session[]
  favorites      Favorite[]
  mealPlans      MealPlan[]
  shoppingLists  ShoppingList[]
}

model CachedRecipe {
  id                  Int      @id            // Spoonacular recipe id
  title               String
  image               String?
  servings            Int?
  readyInMinutes      Int?
  summary             String?  @db.Text
  cuisines            String[] @default([])
  dishTypes           String[] @default([])
  diets               String[] @default([])
  instructions        String?  @db.Text
  extendedIngredients Json?
  nutrition           Json?
  cachedAt            DateTime @default(now())
  favorites           Favorite[]
  mealPlanEntries     MealPlanEntry[]
  @@index([cachedAt])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  recipeId  Int
  createdAt DateTime @default(now())
  user   User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe CachedRecipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  @@unique([userId, recipeId])
}

model MealPlan {
  id        String          @id @default(cuid())
  userId    String
  name      String
  weekStart DateTime
  entries   MealPlanEntry[]
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, weekStart])
}

model MealPlanEntry {
  id         String   @id @default(cuid())
  mealPlanId String
  recipeId   Int
  dayOfWeek  Int      // 0 = Monday … 6 = Sunday
  mealType   MealType
  servings   Int      @default(1)
  mealPlan MealPlan     @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)
  recipe   CachedRecipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  @@index([mealPlanId])
}

model ShoppingList {
  id        String             @id @default(cuid())
  userId    String
  name      String
  items     ShoppingListItem[]
  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model ShoppingListItem {
  id             String  @id @default(cuid())
  shoppingListId String
  name           String
  amount         Float?
  unit           String?
  aisle          String?
  checked        Boolean @default(false)
  shoppingList ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)
  @@index([shoppingListId])
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}
// + NextAuth Account, Session, VerificationToken models
```
*(abridged — see [`prisma/schema.prisma`](prisma/schema.prisma) for the full definition)*

</details>

## 6. API Documentation

All endpoints return JSON. Errors follow `{ error: string | ZodIssue[] }` with appropriate status codes (`400` validation · `401` unauthenticated · `404` not found · `500` server error).

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register with `{ name?, email, password }`. Zod validation, bcrypt hash (12 rounds), returns `201`. |
| `*` | `/api/auth/[...nextauth]` | Public | NextAuth handler: credentials sign-in, session, sign-out. |

### Recipes (proxied to Spoonacular + cached)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/recipes/search` | Optional | Complex search. Params: `query, cuisine, diet, type, maxReadyTime, minCalories, maxCalories, intolerances (csv), sort, sortDirection, offset, number` (default 12). Injects `isFavorite` per result when logged in. |
| `GET` | `/api/recipes/[id]` | Optional | Recipe detail. Read-through cache (24 h TTL) before hitting Spoonacular. Adds `isFavorite` for logged-in users. |

### Favorites

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/favorites` | Required | Current user's favorited recipes (with full recipe data). |
| `POST` | `/api/favorites` | Required | `{ recipeId }` — creates a favorite; ensures the recipe is cached locally. |
| `DELETE` | `/api/favorites` | Required | Removes a favorite for the current user. |

### Meal Plans

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/meal-plans?weekStart=` | Required | User's plans with nested entries + recipe data, ordered by day then meal type. Filterable by week. |
| `POST` | `/api/meal-plans` | Required | `{ name, weekStart }` (ISO datetime). Normalizes `weekStart` to Monday via date-fns `startOfWeek`. Returns `201`. |
| `POST` | `/api/meal-plans/[id]/entries` | Required | Add entry `{ recipeId, dayOfWeek, mealType, servings }` to an owned plan. |
| `DELETE` | `/api/meal-plans/[id]/entries` | Required | Remove an entry by id (ownership verified through the parent plan). |

### Shopping Lists

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/shopping-lists` | Required | User's lists with items sorted by aisle then name. |
| `POST` | `/api/shopping-lists` | Required | `{ name, mealPlanId? }`. With `mealPlanId`, aggregates ingredients across all plan entries (dedupe key: `nameClean + unit`, amounts scaled by `entry.servings`). Returns `201`. |
| `PATCH` | `/api/shopping-lists/[id]/items/[itemId]` | Required | Toggle `{ checked }` on an item. |
| `DELETE` | `/api/shopping-lists/[id]/items/[itemId]` | Required | Delete an item. |

Example — generate a shopping list from a meal plan:

```bash
curl -X POST /api/shopping-lists \
  -H "Content-Type: application/json" \
  -d '{ "name": "Week 34 groceries", "mealPlanId": "clxk123..." }'
```

---

## 7. Authentication Strategy

**NextAuth v4** with a **Credentials Provider** and **JWT session strategy**, backed by the Prisma Adapter.

```mermaid
sequenceDiagram
    actor U as User
    participant C as Client (signIn)
    participant N as NextAuth Handler
    participant DB as PostgreSQL

    U->>C: Submit email + password
    C->>N: authorize(credentials)
    N->>DB: findUniqueUser({ email })
    alt user not found or bad password
        N-->>C: throw Error("Invalid credentials")
    else valid
        N->>N: bcrypt.compare(password, passwordHash)
        N->>N: jwt callback → token.id = user.id
        N-->>C: session cookie (JWT, HTTP-only)
        C->>C: session.user.id available<br/>(via next-auth.d.ts augmentation)
    end
```

Key points:

- **Passwords** are hashed with `bcryptjs` at cost factor **12** on registration (`bcrypt.hash`) and compared in constant time on sign-in (`bcrypt.compare`). Password hashes never leave the server.
- **JWT sessions** (not database sessions) keep API routes fast — no DB round-trip to resolve the session on every request.
- **Type augmentation** (`src/types/next-auth.d.ts`) adds `user.id` to `Session`/`JWT` so the whole app gets compile-time-safe access to the user id.
- **Two guard layers**: `requireAuth()` throws → caught → `401` inside API route handlers; client pages use `useSession()` and redirect unauthenticated visitors.
- The **Prisma Adapter** is wired in so OAuth providers (Google, GitHub, …) can be enabled later without schema changes — the `Account`/`Session`/`VerificationToken` tables already exist.

## 8. Security Considerations

| Concern | Mitigation |
|---|---|
| **Password storage** | bcrypt hashing, cost factor 12; hashes never returned by any API. |
| **API key exposure** | The Spoonacular key lives only in server env vars and is used exclusively inside `src/lib/spoonacular.ts` on the server — the browser only ever talks to our own API routes. |
| **Input validation** | Every request body parsed with Zod schemas before touching Prisma (`400` on failure); query params coerced/validated in route handlers. |
| **IDOR / authorization** | All queries are scoped by `session.user.id`; nested resources (plan entries, list items) verify ownership through their parent before mutating. A unique DB constraint backs favorite idempotency. |
| **SQL injection** | Prevented by design — Prisma parameterizes all queries; no raw SQL is used. |
| **Session security** | HTTP-only, same-site session cookies signed with `NEXTAUTH_SECRET`; JWT strategy avoids storing session state client-side. |
| **Error hygiene** | Catch blocks return generic messages (`"Failed to create meal plan"`) — internal errors are logged server-side, never leaked to clients. |
| **Image domains** | Next.js `images.remotePatterns` restricted to `spoonacular.com` / `img.spoonacular.com`, preventing arbitrary remote image proxying. |
| **XSS** | React escapes all rendered content by default; no `dangerouslySetInnerHTML` for third-party summaries. |

---

## 9. Testing Strategy

> ⚠️ **Status:** an automated test suite is not yet part of this repo — it's the top item in [Future Improvements](#15-future-improvements). Below is the strategy I'd apply.

**The pyramid:**

1. **Unit tests (Vitest)** — pure logic first:
   - Ingredient aggregation algorithm (dedupe key, servings scaling) — this is the most bug-prone code in the app
   - Zod schemas (valid/invalid payloads per endpoint)
   - `useDebounce` timing behavior
   - Cache TTL boundary logic in `SpoonacularClient`
2. **API integration tests (Vitest + Testcontainers Postgres + MSW)** —
   - MSW mocks Spoonacular so tests are deterministic and don't burn API quota
   - Real Postgres via containers to verify migrations, constraints (`@@unique` favorites), and cascade deletes
   - Auth matrix: every protected endpoint returns `401` without a session, `200` with one
3. **E2E tests (Playwright)** — critical user journeys only:
   - Sign up → search recipe → favorite → build a week plan → generate shopping list → check an item

CI would run lint → typecheck → unit → integration on every push via GitHub Actions.

---

## 10. Performance Considerations

### What's implemented

| Technique | Where | Effect |
|---|---|---|
| **Server-side recipe cache (24 h TTL)** | `CachedRecipe` table | Recipe detail views and favorites/meal-plan reads hit Postgres instead of Spoonacular — saves quota points and cuts detail-page latency dramatically on repeat views |
| **Background write-behind cache** | `searchRecipes()` | Search responses return immediately; caching happens async via `Promise.allSettled` so a slow write never blocks the response |
| **Debounced search input (400 ms)** | `useDebounce` | Prevents firing a request per keystroke while typing |
| **Client-side data cache** | TanStack React Query | Deduplicates requests across components; instant re-render from cache on back-navigation |
| **Optimistic updates** | Shopping-list checkboxes | UI updates before the PATCH resolves — feels instantaneous |
| **Indexed hot paths** | `[userId]`, `[userId, weekStart]`, `[cachedAt]`, `[mealPlanId]` | User-scoped list lookups stay index scans |
| **Bulk fetching** | `/recipes/informationBulk` | Favorites and plan views fetch N recipes in **one** upstream call instead of N calls |
| **Next.js Image optimization** | `next/image` + remote patterns | Responsive, lazy-loaded recipe images |

### Shopping-list generation flow

```mermaid
sequenceDiagram
    actor U as User
    participant C as Client
    participant API as POST /api/shopping-lists
    participant PG as PostgreSQL

    U->>C: "Generate list" on a meal plan
    C->>API: { name, mealPlanId }
    API->>PG: mealPlan.findFirst({ userId, include entries.recipes })
    API->>API: For each entry × ingredient:<br/>key = nameClean+unit, amount *= entry.servings
    API->>PG: shoppingList.create + items.createMany
    API-->>C: 201 shoppingList (aisle-sorted)
```

### Performance metrics

Measured targets for this codebase (to be filled with numbers from load testing):

| Metric | Target | Measured |
|---|---|---|
| Recipe search p95 (cache warm/cold) | < 800 ms / < 1.5 s | _TBD_ |
| Recipe detail p95 (cached) | < 150 ms | _TBD_ |
| Shopping-list generation (7-day plan) | < 300 ms | _TBD_ |
| Lighthouse (Performance / Accessibility) | ≥ 90 / ≥ 95 | _TBD_ |
| Upstream Spoonacular calls saved by cache | ~70 % of detail views | _TBD_ |

## 11. Deployment Architecture

Target deployment: **Vercel** (Next.js) + a managed **PostgreSQL** (Neon / Supabase / RDS).

```mermaid
flowchart LR
    subgraph Vercel["▲ Vercel"]
        Edge["Edge Network<br/>static assets + ISR cache"]
        SSR["Serverless Functions<br/>SSR pages + API routes"]
    end
    NEON[("Managed PostgreSQL<br/>(Neon / Supabase)")]
    SPOON["Spoonacular API"]

    User(["👤 Browser"]) --> Edge
    Edge --> SSR
    SSR --> NEON
    SSR --> SPOON
```

- **Migrations** run in CI/CD (`prisma migrate deploy`) before a new release serves traffic — never `db push` in production.
- **Secrets** (`DATABASE_URL`, `NEXTAUTH_SECRET`, `SPOONACULAR_API_KEY`) are injected as environment variables; `.env` is gitignored.
- **Connection pooling**: serverless functions scale to many instances, so `DATABASE_URL` points through a pooled endpoint (e.g., Neon pooler / PgBouncer) rather than direct connections.

### Local development

```bash
git clone <repo> && cd recipe-meal-planner
npm install

# .env
# DATABASE_URL="postgresql://user:pass@localhost:5432/recipe_planner"
# NEXTAUTH_SECRET="..."
# NEXTAUTH_URL="http://localhost:3000"
# SPOONACULAR_API_KEY="..."

npm run db:migrate:new   # preview migration SQL from schema changes
npm run db:generate      # prisma generate
npm run db:migrate       # apply migrations
npm run db:seed          # optional seed data
npm run dev              # http://localhost:3000 (Turbopack)
```

---

## 12. Screenshots

> 📸 *Placeholders — drop images into `/public/screenshots` and they'll render here.*

| Home / Search | Recipe Detail |
|---|---|
| ![Search](public/screenshots/search.png) | ![Detail](public/screenshots/detail.png) |

| Weekly Meal Planner | Shopping List |
|---|---|
| ![Planner](public/screenshots/planner.png) | ![List](public/screenshots/shopping-list.png) |

---

## 13. Demo

> 🔗 **Live demo:** _coming soon_ — will be hosted on Vercel.
>
> Demo account: `demo@example.com` / seeded via `npm run db:seed`.

Until then, run it locally with the instructions in [Deployment Architecture](#11-deployment-architecture) — you only need a free [Spoonacular API key](https://spoonacular.com/food-api).

## 14. What I Learned

- **Designing a cache as a first-class domain table.** Making `CachedRecipe` the relational anchor for favorites and meal entries taught me how to model third-party data you don't control — natural keys, TTL columns, upserts, and write-behind population all had to fit together.
- **The NextAuth adapter/JWT tension.** Credentials auth doesn't issue database sessions, so I learned why JWT strategy is required with credentials providers, and how module augmentation makes session payloads type-safe across the app.
- **Authorization is a query-shape problem.** Scoping every Prisma `where` by `userId` — and verifying ownership of nested resources through their parents — is simpler and safer than post-hoc checks.
- **Zod at both ends of the wire.** Reusing validation schemas for react-hook-form on the client and route handlers on the server eliminated an entire class of "trusted client input" bugs.
- **Async caching without blocking responses.** `Promise.allSettled` background writes keep search snappy while still warming the cache, and tolerate individual cache-write failures gracefully.
- **Week/timezone math is genuinely hard.** Normalizing `weekStart` to Monday with date-fns and choosing an explicit `dayOfWeek` convention avoided a whole family of off-by-one calendar bugs.

---

## 15. Future Improvements

- [ ] **Automated tests** — Vitest unit suite + MSW-mocked API integration tests + Playwright E2E journeys, wired into GitHub Actions CI
- [ ] **OAuth providers** (Google/GitHub) — schema already supports it via the Prisma Adapter
- [ ] **Drag-and-drop meal entries** between day/meal slots
- [ ] **Rate limiting + upstream quota dashboard** (per-user and global token buckets)
- [ ] **Redis cache layer** in front of Postgres for hot recipe reads
- [ ] **Nutrition rollups per day** — sum calories/macros across a planned week
- [ ] **PWA + offline shopping lists** for use in-store
- [ ] **Recipe import** — paste any recipe URL and parse it via Spoonacular's extract endpoint
- [ ] **Structured error handling** — shared error classes mapped to HTTP codes instead of ad-hoc try/catch strings
- [ ] **Observability** — request tracing and p95 latency dashboards (e.g., Axiom/Sentry)

---

## 16. Trade-offs & Design Decisions

| Decision | Alternative considered | Why this way |
|---|---|---|
| **Postgres-backed recipe cache** | Redis / in-memory LRU | Favorites and meal plans need durable references to recipes anyway; one source of truth beats syncing two stores. Redis becomes worthwhile only at much higher read volume. |
| **JWT sessions over DB sessions** | Database sessions | Every API route resolves the session; dropping a round-trip per request matters more than instant credential revocation for this app's threat model. |
| **Offset pagination** | Cursor pagination | Spoonacular's own API is offset-based — mirroring it keeps proxying simple. Cursor pagination would require state the upstream API doesn't expose. |
| **JSON columns for ingredients/nutrition** | Fully normalized tables | The data is write-once/read-whole from a third party; normalizing 30+ nutrition fields buys nothing today. Accepted trade-off: no SQL-level queries into nutrition. |
| **Background cache writes (`allSettled`)** | Await-and-block, or pure fire-and-forget | Blocking search on N upserts adds latency; fire-and-forget loses error visibility. `allSettled` is the middle ground. |
| **Client components + React Query** | Full RSC data fetching with server mutations | Search filters, debounce, and optimistic toggles are highly interactive; React Query's cache semantics fit better than hand-rolled RSC revalidation here. |
| **Credentials-only auth at launch** | OAuth-first | Zero external setup for reviewers/demo; the adapter leaves the OAuth door open. |

---

## 17. Scaling Strategy

**Vertical first, then targeted horizontal moves — driven by metrics, not speculation.**

| Stage | Bottleneck signal | Move |
|---|---|---|
| **1. Now** — single Next.js + managed PG | — | Serverless already scales compute horizontally per request. |
| **2. Read-heavy recipe traffic** | Cache-hit p95 climbing, DB CPU up | Add **Redis** in front of `CachedRecipe` reads; ISR/fetch caching for popular recipe pages. |
| **3. Connection pressure** | Pooler saturation from many lambdas | Route through **PgBouncer/Neon pooler**, tune Prisma statement cache, consider Prisma Accelerate. |
| **4. Write-heavy cache population** | Background write lag | Move cache writes to a **queue** (e.g., Upstash QStash) with per-recipe-id batching/deduplication. |
| **5. Data growth** | Table bloat on `CachedRecipe` | Scheduled job evicts rows older than TTL; partition or archive cold recipes. |
| **6. Multi-region users** | Latency to single-region PG | **Read replicas** + regional edge caching for recipe reads; user data stays primary-region. |
| **7. Team/org features** | Cross-user queries appear | Row-level security policies or service-layer authorization boundaries *before* feature code needs them. |

The architecture deliberately isolates the seams where these moves happen: all external calls funnel through `SpoonacularClient`, and all persistence goes through Prisma models — so swapping a cache layer or adding a queue touches one module, not every route.

---

## 📄 License

MIT

<p align="center">Built with ☕ and Next.js · <a href="#-recipe--meal-planner">back to top</a></p>
