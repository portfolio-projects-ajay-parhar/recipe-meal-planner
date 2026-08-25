# Recipe & Meal Planner — Agent Task List

> Derived from [`PLAN.md`](./PLAN.md) and the individual files in the [`phases/`](./phases/) directory. Work through phases **in order** — each phase depends on the previous one being complete. Mark tasks `[/]` when in progress and `[x]` when done.

---

## Prerequisites & Environment

- [ ] Obtain a **Spoonacular API key** from [spoonacular.com/food-api](https://spoonacular.com/food-api)
- [ ] Ensure **PostgreSQL** is running and a database `recipe_planner` is accessible
- [ ] Node.js >= 18 and npm available in PATH

---

## Phase 1 — Project Setup & Database

### 1.1 Scaffold Next.js App

- [ ] Run scaffold command:
  ```bash
  npx create-next-app@latest recipe-planner --typescript --tailwind --eslint --app --src-dir
  cd recipe-planner
  ```
- [ ] Install all dependencies:
  ```bash
  npm install prisma @prisma/client
  npm install @tanstack/react-query axios
  npm install next-auth @auth/prisma-adapter bcryptjs
  npm install zod react-hook-form @hookform/resolvers
  npm install date-fns lucide-react
  npm install -D @types/bcryptjs
  ```

### 1.2 Environment Variables

- [ ] Create `.env.local` at project root with:
  - `DATABASE_URL` — PostgreSQL connection string
  - `NEXTAUTH_SECRET` — random secret (use `openssl rand -base64 32`)
  - `NEXTAUTH_URL` — `http://localhost:3000`
  - `SPOONACULAR_API_KEY` — from Spoonacular dashboard

### 1.3 Prisma Schema

- [ ] Create `prisma/schema.prisma` with **all** models from PLAN.md:
  - `User` (with `passwordHash`, relations to accounts/sessions/favorites/mealPlans/shoppingLists)
  - `Account` (NextAuth OAuth accounts)
  - `Session` (NextAuth sessions)
  - `VerificationToken`
  - `CachedRecipe` (id is Int, stores full recipe JSON fields, `cachedAt` for TTL)
  - `Favorite` (userId + recipeId unique composite, indexes on userId)
  - `MealPlan` (userId, name, weekStart, composite index)
  - `MealPlanEntry` (mealPlanId, recipeId, dayOfWeek 0-6, MealType enum, servings)
  - `ShoppingList` (userId, name)
  - `ShoppingListItem` (name, amount, unit, aisle, checked bool)
  - `MealType` enum: `BREAKFAST | LUNCH | DINNER | SNACK`
- [ ] Run migrations and generate Prisma client:
  ```bash
  npx prisma migrate dev --name init
  npx prisma generate
  ```

### 1.4 Database Client

- [ ] Create `src/lib/prisma.ts`
  - Singleton PrismaClient using `globalThis` guard (avoids hot-reload connection exhaustion)
  - Enable query logging in development only

---

## Phase 2 — External API Integration (Spoonacular)

### 2.1 Type Definitions

- [ ] Create `src/types/recipe.ts` with all interfaces:
  - `SpoonacularRecipe`
  - `ExtendedIngredient` (with nested `measures.us` / `measures.metric`)
  - `NutritionInfo` + `Nutrient`
  - `SearchFilters` (query, cuisine, diet, type, maxReadyTime, calorie range, intolerances, sort/direction, offset, number)
  - `SearchResult` (results array, offset, number, totalResults)
  - `RecipeCardData` (lightweight card shape with optional `isFavorite`)

### 2.2 Spoonacular API Client

- [ ] Create `src/lib/spoonacular.ts` — `SpoonacularClient` class (exported as singleton `spoonacular`):
  - Constructor creates Axios instance with `baseURL` and `apiKey` default param
  - `CACHE_DURATION_HOURS = 24`
  - `searchRecipes(filters)` — calls `/recipes/complexSearch` with all filter params; caches results in background via `cacheRecipes()`; adds recipe info + nutrition + ingredients
  - `getRecipeById(id)` — checks cache first (within TTL); fetches `/recipes/{id}/information?includeNutrition=true`; caches result
  - `getRecipesBulk(ids[])` — splits cached vs uncached; bulk fetches uncached via `/recipes/informationBulk`
  - `getRandomRecipes(number, tags?)` — fetches `/recipes/random`; caches in background
  - `getAutocomplete(query, number)` — fetches `/recipes/autocomplete`; returns empty array on error
  - Private `getCachedRecipe(id)` — Prisma query with TTL filter
  - Private `cacheRecipe(recipe)` — Prisma upsert with all recipe fields
  - Private `cacheRecipes(recipes[])` — `Promise.allSettled` over individual cacheRecipe calls
  - Private `transformCachedToRecipe(cached)` — maps Prisma row back to `SpoonacularRecipe` shape

### 2.3 Filter Constants

- [ ] Create `src/lib/constants.ts` with `as const` arrays/objects:
  - `CUISINES` (26 entries)
  - `DIETS` (11 entries)
  - `MEAL_TYPES` (14 entries)
  - `INTOLERANCES` (12 entries)
  - `SORT_OPTIONS` (5 entries with value/label)
  - `DAYS_OF_WEEK` (Mon-Sun)
  - `MEAL_TYPE_ORDER` (`['BREAKFAST','LUNCH','DINNER','SNACK']`)

---

## Phase 3 — Authentication

### 3.1 NextAuth Configuration

- [ ] Create `src/lib/auth.ts` — `authOptions: NextAuthOptions`:
  - `PrismaAdapter` as adapter
  - `CredentialsProvider` — validates email + bcrypt password hash; throws `Error` on invalid credentials
  - JWT session strategy
  - `jwt` callback — injects `user.id` into token
  - `session` callback — injects `token.id` into `session.user.id`
  - Custom pages: `signIn: '/auth/signin'`, `signUp: '/auth/signup'`

### 3.2 NextAuth Type Augmentation

- [ ] Create `src/types/next-auth.d.ts`
  - Augment `Session.user` to include `id: string`

### 3.3 NextAuth Route Handler

- [ ] Create `src/app/api/auth/[...nextauth]/route.ts`
  - Export `handler` as both `GET` and `POST`

### 3.4 Registration API

- [ ] Create `src/app/api/auth/register/route.ts` — `POST` handler:
  - Zod schema: `name` (2-50), `email`, `password` (8-100)
  - Check for existing user -> 409 conflict
  - `bcrypt.hash(password, 12)`
  - Create user; return `{id, name, email}` with status 201
  - Handle ZodError -> 400, other errors -> 500

### 3.5 Auth Provider Component

- [ ] Create `src/components/providers/AuthProvider.tsx`
  - `'use client'` wrapper around NextAuth `SessionProvider`

### 3.6 Server-side Auth Helpers

- [ ] Create `src/lib/get-session.ts`:
  - `getSession()` — calls `getServerSession(authOptions)`
  - `requireAuth()` — calls `getSession()`; throws `Error('Unauthorized')` if no session

---

## Phase 4 — API Routes

### 4.1 Recipe Search API

- [ ] Create `src/app/api/recipes/search/route.ts` — `GET` handler:
  - Parse all `SearchFilters` from `searchParams` (with type coercions for numbers/arrays)
  - Call `spoonacular.searchRecipes(filters)`
  - If user is logged in: fetch their favorites for result IDs; attach `isFavorite` boolean to each recipe
  - Return full `SearchResult` object

### 4.2 Recipe Detail API

- [ ] Create `src/app/api/recipes/[id]/route.ts` — `GET` handler:
  - Parse and validate integer `id` -> 400 on `NaN`
  - Call `spoonacular.getRecipeById(id)`
  - Check `isFavorite` for logged-in user via Prisma unique lookup
  - Return `{ ...recipe, isFavorite }`

### 4.3 Favorites API

- [ ] Create `src/app/api/favorites/route.ts`:
  - **`GET`**: `requireAuth()`; paginated query (page, limit params); include recipe; return `{favorites, total, page, totalPages}`
  - **`POST`**: `requireAuth()`; ensure recipe is cached via `spoonacular.getRecipeById()`; create Favorite; handle P2002 (duplicate) -> 409
  - **`DELETE`**: `requireAuth()`; get `recipeId` from searchParams; delete Favorite by composite unique key

### 4.4 Meal Plans API

- [ ] Create `src/app/api/meal-plans/route.ts`:
  - **`GET`**: `requireAuth()`; optional `weekStart` filter; include entries with recipe; ordered by weekStart desc
  - **`POST`**: `requireAuth()`; Zod validate `{name, weekStart}`; compute `startOfWeek(..., {weekStartsOn:1})`; create MealPlan

### 4.5 Meal Plan Entries API

- [ ] Create `src/app/api/meal-plans/[id]/entries/route.ts`:
  - **`POST`**: verify meal plan ownership; Zod validate `{recipeId, dayOfWeek(0-6), mealType, servings(>=1)}`; ensure recipe cached; create MealPlanEntry with recipe include
  - **`DELETE`**: verify entry ownership via nested relation check; delete entry by `entryId` query param

### 4.6 Shopping Lists API

- [ ] Create `src/app/api/shopping-lists/route.ts`:
  - **`GET`**: `requireAuth()`; return all lists with items sorted by aisle then name
  - **`POST`**: `requireAuth()`; Zod validate `{name, mealPlanId?}`; if `mealPlanId` provided, aggregate ingredients from meal plan entries (merge duplicates by `nameClean-unit` key, multiply by servings); create ShoppingList with items

### 4.7 Shopping List Item Routes

- [ ] Create `src/app/api/shopping-lists/[id]/items/[itemId]/route.ts`:
  - **`PATCH`**: verify item ownership; update `checked` boolean
  - **`DELETE`**: verify item ownership; delete item

---

## Phase 5 — Custom Hooks

### 5.1 useDebounce

- [ ] Create `src/hooks/useDebounce.ts`
  - Generic `useDebounce<T>(value, delay=500)` hook using `useState` + `useEffect` with `setTimeout` cleanup

### 5.2 useRecipeSearch

- [ ] Create `src/hooks/useRecipeSearch.ts`
  - State: `filters` (SearchFilters), `results` (SearchResult | null), `isLoading`, `error`
  - `debouncedQuery` via `useDebounce(filters.query, 400)`
  - `fetchRecipes` callback — builds URLSearchParams from filters; fetches `/api/recipes/search`; skips if query is empty
  - Effect: re-fetch when `debouncedQuery`, cuisine, diet, type, maxReadyTime, sort, or offset change
  - `updateFilters` — merges partial; resets offset to 0 unless explicitly provided
  - `resetFilters` — restores default state
  - `goToPage(page)` — calls `updateFilters({ offset: (page-1) * pageSize })`
  - Returns: `recipes` (RecipeCardData[]), `isLoading`, `error`, `totalResults`, `currentPage`, `totalPages`, `filters`, `updateFilters`, `resetFilters`, `goToPage`

### 5.3 useFavoriteToggle

- [ ] Create `src/hooks/useFavorites.ts`
  - State: `pending` (Set<number>)
  - `toggleFavorite(recipeId, currentState)`:
    - Guard: must be logged in
    - Adds to `pending` set; fires DELETE or POST to `/api/favorites`; removes from `pending` on settle
    - Returns new boolean state
  - `isPending(id)` — checks Set membership
  - Returns `{ toggleFavorite, isPending }`

---

## Phase 6 — UI Components

### 6.1 Root Layout

- [ ] Update `src/app/layout.tsx`:
  - Import `Inter` from `next/font/google`
  - Wrap body in `<AuthProvider>` then `<Navbar>`
  - `<main>` with max-width container and padding
  - Set metadata: title + description

### 6.2 Navbar

- [ ] Create `src/components/layout/Navbar.tsx` (`'use client'`):
  - Logo with `ChefHat` icon linking to `/`
  - Desktop nav links: Search, Favorites, Meal Plans, Shopping (with Lucide icons)
  - Auth section: shows user name + logout button if signed in; Sign In / Sign Up links otherwise
  - Mobile hamburger menu (`Menu` / `X` icon) toggling a dropdown
  - `sticky top-0 z-50` positioning

### 6.3 RecipeCard

- [ ] Create `src/components/recipes/RecipeCard.tsx` (`'use client'`):
  - `RecipeCardProps`: `recipe: RecipeCardData`, optional `onAddToMealPlan`
  - Image with `aspect-video`, `fill`, scale-on-hover transition; fallback "No Image" div
  - Diet tags overlaid on image (max 2 shown)
  - Title as link to `/recipes/{id}` with `line-clamp-2`
  - Footer: `Clock` + minutes, `Users` + servings
  - Conditional favorite heart button (only when `session.user`): uses `useFavoriteToggle`; local `isFavorite` state; `disabled` during pending
  - Conditional "Add to meal plan" `Plus` button when `onAddToMealPlan` prop provided

### 6.4 SearchFilters

- [ ] Create `src/components/recipes/SearchFilters.tsx` (`'use client'`):
  - Collapsible panel toggled by `Filter` button
  - Active filter badge count on toggle button
  - Filter controls in a responsive 4-column grid:
    - Cuisine `<select>` (from `CUISINES`)
    - Diet `<select>` (from `DIETS`, lowercase values)
    - Meal Type `<select>` (from `MEAL_TYPES`)
    - Max Cook Time `<input type="number">`
  - Sort By `<select>` (from `SORT_OPTIONS`)
  - "Clear all" button — only visible when `activeFilterCount > 0`

### 6.5 Pagination

- [ ] Create `src/components/ui/Pagination.tsx` (`'use client'`):
  - Returns `null` if `totalPages <= 1`
  - `getVisiblePages()` — shows pages within delta=2 of current; ellipsis for gaps
  - Prev / Next `ChevronLeft` / `ChevronRight` buttons with `disabled` states
  - Active page styled with emerald background

---

## Phase 7 — Pages

### 7.1 Home Page

- [ ] Create/update `src/app/page.tsx`:
  - Hero section: H1, subtitle, "Start Searching" CTA button -> `/search`
  - Features grid (2-col sm, 4-col lg): Recipe Search, Save Favorites, Meal Planning, Shopping Lists
  - Each feature card: icon, title, description, link

### 7.2 Search Page

- [ ] Create `src/app/search/page.tsx` (`'use client'`):
  - Uses `useRecipeSearch` hook
  - Large search input with `SearchIcon` and inline `Loader2` spinner
  - `<SearchFilters>` component below
  - Results count text when results > 0
  - Error alert (red box)
  - Results grid (1->2->3->4 cols at breakpoints) of `<RecipeCard>` components
  - Empty state (no results for query)
  - Initial state (no query entered)
  - `<Pagination>` at bottom

### 7.3 Recipe Detail Page (Server Component)

- [ ] Create `src/app/recipes/[id]/page.tsx`:
  - `generateMetadata` — fetches recipe title/summary for `<head>` tags
  - Validates integer `id`; calls `notFound()` on invalid/error
  - Renders `<RecipeDetail recipe={recipe} />`

- [ ] Create `src/app/recipes/[id]/RecipeDetail.tsx` (`'use client'`):
  - Hero image with `aspect-[21/9]`, `fill`, `priority`
  - Title + favorite button (top-right)
  - Diet tags (emerald) and cuisine tags (blue)
  - Quick stats row: clock, servings, source link
  - Nutrition card (if data available): Calories, Protein, Carbs, Fat in a 2->4 col grid
  - Two-column layout (lg): left = ingredients (sticky), right = instructions
  - Serving multiplier adjuster (- / + buttons) scales ingredient amounts
  - Ingredients list: `Check` icon + `nameClean amount unit`
  - Instructions: numbered list parsed from HTML; fallback to `dangerouslySetInnerHTML`
  - Summary section (HTML rendered via `dangerouslySetInnerHTML`)

### 7.4 Meal Planner Page

- [ ] Create `src/app/meal-plans/page.tsx` (`'use client'`):
  - Redirect to `/auth/signin` if unauthenticated
  - Week navigation: `ChevronLeft` / `ChevronRight` buttons; formatted week range display
  - `fetchMealPlan` on week change: GET `/api/meal-plans?weekStart=...`
  - If no plan: empty state with "Create Meal Plan" button (POST `/api/meal-plans`)
  - If plan exists:
    - "Generate Shopping List" link -> `/shopping-lists/new?mealPlanId=...`
    - Calendar grid (`overflow-x-auto`, `min-w-[800px]`): 8 columns (label + 7 days)
    - Header row: day names + formatted dates
    - Rows for each meal type (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`)
    - Each cell: list of recipe entries (title link + hover delete X); hover-reveal `Plus` button
  - `AddRecipeModal` component (inline):
    - Fixed overlay with white panel
    - Search input -> debounced query -> GET `/api/recipes/search?query=...&number=6`
    - Results list: thumbnail + title + time/servings + `Plus` icon button
    - On select: POST `/api/meal-plans/{id}/entries` then refresh

### 7.5 Shopping Lists Page

- [ ] Create `src/app/shopping-lists/page.tsx` (`'use client'`):
  - Redirect to `/auth/signin` if unauthenticated
  - `fetchLists` on mount: GET `/api/shopping-lists`; auto-expand first list
  - Empty state: "Generate one from your meal plan"
  - Accordion list items:
    - Header: list name, `{checked}/{total} items checked`, progress bar, chevron
    - Expanded body: items grouped by aisle (sorted alphabetically)
    - Each item: custom checkbox (green when checked), `line-through` text when checked, hover-reveal `Trash2` delete button
    - Checkbox uses optimistic update -> then PATCH `/api/shopping-lists/{id}/items/{itemId}`
    - Delete calls DELETE on same route

### 7.6 Favorites Page

- [ ] Create `src/app/favorites/page.tsx` (`'use client'`):
  - Redirect to `/auth/signin` if unauthenticated
  - Paginated fetch: GET `/api/favorites?page={page}&limit=12`
  - Empty state: "Heart recipes while searching to save them here"
  - Grid of `<RecipeCard>` components (all with `isFavorite: true`)
  - `<Pagination>` component

### 7.7 Auth Pages

- [ ] Create `src/app/auth/signin/page.tsx` (`'use client'`):
  - `ChefHat` logo + "Welcome Back" heading
  - Form: email + password inputs
  - `signIn('credentials', { ..., redirect: false })` on submit
  - Error display on `result?.error`
  - Redirect to `/search` on success
  - Link to sign-up page

- [ ] Create `src/app/auth/signup/page.tsx` (`'use client'`):
  - `ChefHat` logo + "Create Account" heading
  - Form: name + email + password inputs (minLength=8 hint)
  - POST to `/api/auth/register`; auto sign-in on success; redirect to `/search`
  - Error display
  - Link to sign-in page

---

## Phase 8 — Next.js Configuration

- [ ] Update `next.config.js` (or create if missing):
  - Add `images.remotePatterns` for `spoonacular.com` and `img.spoonacular.com` (https)

---

## Phase 9 — Verification & Quality Checks

### 9.1 Build Verification

- [ ] Run `npm run build` — resolve all TypeScript errors and ESLint warnings
- [ ] Run `npm run dev` — confirm dev server starts without errors

### 9.2 Feature Smoke Tests

- [ ] **Auth flow**: register new user -> auto sign-in -> lands on `/search`
- [ ] **Auth flow**: sign out -> sign back in with credentials
- [ ] **Search**: type a query -> debounce fires -> results render with images and stats
- [ ] **Filters**: select cuisine + diet -> results update; "Clear all" resets
- [ ] **Pagination**: navigate to page 2 and back
- [ ] **Recipe detail**: click a recipe card -> detail page loads with ingredients + instructions + nutrition
- [ ] **Favorites**: heart a recipe (card + detail page) -> appears in `/favorites`; un-heart removes it
- [ ] **Meal plan**: navigate to `/meal-plans` -> create plan for current week -> add recipe to a slot -> entry appears in grid; delete an entry
- [ ] **Shopping list**: from meal plan, click "Generate Shopping List" -> list created -> items grouped by aisle; check/uncheck items; delete an item
- [ ] **Image optimization**: recipe images load via Next.js `<Image>` without console errors about unconfigured hostnames

### 9.3 Edge Cases

- [ ] Unauthenticated users redirected from `/favorites`, `/meal-plans`, `/shopping-lists`
- [ ] Invalid recipe ID in URL -> 404 (notFound)
- [ ] Duplicate favorite -> 409 handled gracefully (no crash)
- [ ] Empty meal plan -> shopping list generates with 0 items (no crash)
- [ ] Spoonacular API error -> user sees error state, not blank screen

---

## File Structure Reference

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── search/page.tsx
│   ├── recipes/[id]/
│   │   ├── page.tsx
│   │   └── RecipeDetail.tsx
│   ├── favorites/page.tsx
│   ├── meal-plans/page.tsx
│   ├── shopping-lists/page.tsx
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── auth/register/route.ts
│       ├── recipes/search/route.ts
│       ├── recipes/[id]/route.ts
│       ├── favorites/route.ts
│       ├── meal-plans/route.ts
│       ├── meal-plans/[id]/entries/route.ts
│       ├── shopping-lists/route.ts
│       └── shopping-lists/[id]/items/[itemId]/route.ts
├── components/
│   ├── layout/Navbar.tsx
│   ├── recipes/
│   │   ├── RecipeCard.tsx
│   │   └── SearchFilters.tsx
│   ├── providers/AuthProvider.tsx
│   └── ui/Pagination.tsx
├── hooks/
│   ├── useDebounce.ts
│   ├── useRecipeSearch.ts
│   └── useFavorites.ts
├── lib/
│   ├── prisma.ts
│   ├── spoonacular.ts
│   ├── auth.ts
│   ├── get-session.ts
│   └── constants.ts
└── types/
    ├── recipe.ts
    └── next-auth.d.ts
```

---

## Key Implementation Notes for Agents

| Concern | Guidance |
|---|---|
| **Prisma singleton** | Use `globalThis` guard in `prisma.ts` to prevent exhausting connections in dev hot-reload |
| **Recipe cache TTL** | `CACHE_DURATION_HOURS = 24` — always filter by `cachedAt >= now - 24h` |
| **Auth guards** | Use `requireAuth()` (server) in API routes; `useSession` redirect in client pages |
| **Ingredient aggregation** | Key is `${ing.nameClean \|\| ing.name}-${ing.unit}`; amounts multiplied by `entry.servings` |
| **Debounce delay** | 400ms on search inputs (`useDebounce`) |
| **Pagination** | Offset-based: `offset = (page - 1) * number`; default page size = 12 |
| **Optimistic updates** | Shopping list checkboxes: update local state first, then PATCH |
| **Calendar grid** | `dayOfWeek` is 0 = Monday, 6 = Sunday (not JS `Date.getDay()` convention) |
| **Image config** | Must allow `spoonacular.com` and `img.spoonacular.com` in `next.config.js` |
| **MealType enum** | Always uppercase in DB: `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK` |
| **Session injection** | `session.user.id` is only available after type augmentation in `next-auth.d.ts` |
