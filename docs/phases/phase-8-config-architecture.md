# Phase 8: Next.js Image Configuration & Architecture Summary

## Next.js Image Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'spoonacular.com',
      },
      {
        protocol: 'https',
        hostname: 'img.spoonacular.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

---

## Architecture Summary

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home / landing
│   ├── search/
│   │   └── page.tsx                  # Recipe search (client)
│   ├── recipes/
│   │   └── [id]/
│   │       ├── page.tsx              # Recipe detail (server)
│   │       └── RecipeDetail.tsx      # Detail view (client)
│   ├── favorites/
│   │   └── page.tsx                  # Favorites list
│   ├── meal-plans/
│   │   └── page.tsx                  # Weekly planner
│   ├── shopping-lists/
│   │   └── page.tsx                  # Shopping lists
│   ├── auth/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/       # NextAuth
│       ├── recipes/
│       │   ├── search/route.ts       # Search with caching
│       │   └── [id]/route.ts         # Recipe detail
│       ├── favorites/route.ts        # CRUD favorites
│       ├── meal-plans/
│       │   ├── route.ts              # CRUD meal plans
│       │   └── [id]/entries/route.ts # Plan entries
│       └── shopping-lists/
│           ├── route.ts              # CRUD lists
│           └── [id]/items/[itemId]/  # Toggle/delete items
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
│   ├── prisma.ts                     # DB client
│   ├── spoonacular.ts                # API client + cache
│   ├── auth.ts                       # NextAuth config
│   ├── get-session.ts                # Server auth helper
│   └── constants.ts                  # Filter options
└── types/
    ├── recipe.ts                     # Recipe types
    └── next-auth.d.ts                # Auth type augmentation
```

## Key Technical Patterns Demonstrated

| Pattern | Implementation |
|---|---|
| **API Integration** | Spoonacular client with typed responses |
| **DB Caching** | Recipes cached in PostgreSQL with TTL |
| **Debouncing** | 400ms debounce on search input |
| **Server Components** | Recipe detail page fetches server-side |
| **Client Components** | Search, meal planner with interactivity |
| **Optimistic Updates** | Shopping list checkbox toggles |
| **Pagination** | Offset-based with visible page numbers |
| **Auth Guards** | Server + client session checks |
| **Responsive Design** | Mobile hamburger menu, adaptive grids |
| **Ingredient Aggregation** | Shopping list merges duplicate ingredients |
