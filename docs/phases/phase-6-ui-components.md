# Phase 6: UI Components

## Layout

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Recipe & Meal Planner',
  description: 'Search recipes, plan meals, and generate shopping lists',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Navbar

```typescript
// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import {
  Search, Heart, Calendar, ShoppingCart,
  Menu, X, ChefHat, LogOut, User
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/search', label: 'Search', icon: Search },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/meal-plans', label: 'Meal Plans', icon: Calendar },
    { href: '/shopping-lists', label: 'Shopping', icon: ShoppingCart },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-emerald-600 font-bold text-xl"
          >
            <ChefHat className="w-7 h-7" />
            <span className="hidden sm:inline">MealPlanner</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg
                           text-gray-600 hover:text-emerald-600
                           hover:bg-emerald-50 transition-colors text-sm font-medium"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 text-sm text-gray-500
                             hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-600 hover:text-emerald-600
                             px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm bg-emerald-600 text-white px-4 py-2
                             rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg
                           text-gray-600 hover:bg-emerald-50
                           hover:text-emerald-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-3">
              {session?.user ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-3 py-2 text-red-600
                             w-full rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center gap-3 px-3 py-2
                             text-emerald-600 rounded-lg hover:bg-emerald-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
```

## Recipe Card

```typescript
// src/components/recipes/RecipeCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, Clock, Users, Plus } from 'lucide-react';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import type { RecipeCardData } from '@/types/recipe';

interface RecipeCardProps {
  recipe: RecipeCardData;
  onAddToMealPlan?: (recipeId: number) => void;
}

export default function RecipeCard({
  recipe,
  onAddToMealPlan,
}: RecipeCardProps) {
  const { data: session } = useSession();
  const { toggleFavorite, isPending } = useFavoriteToggle();
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite ?? false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) return;

    const newState = await toggleFavorite(recipe.id, isFavorite);
    setIsFavorite(newState);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200
                    overflow-hidden hover:shadow-md transition-shadow
                    group flex flex-col">
      {/* Image */}
      <Link href={`/recipes/${recipe.id}`} className="relative block">
        <div className="aspect-video relative overflow-hidden bg-gray-100">
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform
                         duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full
                            text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Diet Tags Overlay */}
        {recipe.diets.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
            {recipe.diets.slice(0, 2).map((diet) => (
              <span
                key={diet}
                className="bg-emerald-600/90 text-white text-xs px-2 py-0.5
                           rounded-full backdrop-blur-sm"
              >
                {diet}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2
                         group-hover:text-emerald-600 transition-colors mb-2">
            {recipe.title}
          </h3>
        </Link>

        <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
          {recipe.readyInMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.readyInMinutes}m
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {recipe.servings}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t
                        border-gray-100">
          {session?.user && (
            <button
              onClick={handleToggleFavorite}
              disabled={isPending(recipe.id)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
              />
            </button>
          )}

          {onAddToMealPlan && session?.user && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToMealPlan(recipe.id);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-emerald-600
                         hover:bg-emerald-50 transition-colors"
              aria-label="Add to meal plan"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Search Filters Component

```typescript
// src/components/recipes/SearchFilters.tsx
'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { CUISINES, DIETS, MEAL_TYPES, SORT_OPTIONS } from '@/lib/constants';
import type { SearchFilters as Filters } from '@/types/recipe';

interface SearchFiltersProps {
  filters: Filters;
  onUpdate: (partial: Partial<Filters>) => void;
  onReset: () => void;
}

export default function SearchFilters({
  filters,
  onUpdate,
  onReset,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    filters.cuisine,
    filters.diet,
    filters.type,
    filters.maxReadyTime,
    filters.sort,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700
                   hover:text-emerald-600 transition-colors w-full"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="bg-emerald-100 text-emerald-700 text-xs
                           px-2 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 ml-auto transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cuisine */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cuisine
              </label>
              <select
                value={filters.cuisine ?? ''}
                onChange={(e) =>
                  onUpdate({ cuisine: e.target.value || undefined })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           text-sm focus:ring-2 focus:ring-emerald-500
                           focus:border-transparent"
              >
                <option value="">Any Cuisine</option>
                {CUISINES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Diet */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Diet
              </label>
              <select
                value={filters.diet ?? ''}
                onChange={(e) =>
                  onUpdate({ diet: e.target.value || undefined })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           text-sm focus:ring-2 focus:ring-emerald-500
                           focus:border-transparent"
              >
                <option value="">Any Diet</option>
                {DIETS.map((d) => (
                  <option key={d} value={d.toLowerCase()}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Meal Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Meal Type
              </label>
              <select
                value={filters.type ?? ''}
                onChange={(e) =>
                  onUpdate({ type: e.target.value || undefined })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           text-sm focus:ring-2 focus:ring-emerald-500
                           focus:border-transparent"
              >
                <option value="">Any Type</option>
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Ready Time */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max Cook Time (min)
              </label>
              <input
                type="number"
                min={0}
                max={300}
                placeholder="e.g., 30"
                value={filters.maxReadyTime ?? ''}
                onChange={(e) =>
                  onUpdate({
                    maxReadyTime: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           text-sm focus:ring-2 focus:ring-emerald-500
                           focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Sort By
              </label>
              <select
                value={filters.sort ?? ''}
                onChange={(e) =>
                  onUpdate({ sort: e.target.value || undefined })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2
                           text-sm focus:ring-2 focus:ring-emerald-500
                           focus:border-transparent"
              >
                <option value="">Relevance</option>
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={onReset}
                className="flex items-center gap-1 text-sm text-gray-500
                           hover:text-red-600 mt-5 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Pagination Component

```typescript
// src/components/ui/Pagination.tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const pages: (number | '...')[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg border border-gray-300 text-gray-600
                   hover:bg-gray-50 disabled:opacity-50
                   disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getVisiblePages().map((page, idx) =>
        page === '...' ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-3 py-2 text-gray-400 text-sm"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg text-sm font-medium
                       transition-colors ${
                         currentPage === page
                           ? 'bg-emerald-600 text-white'
                           : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                       }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg border border-gray-300 text-gray-600
                   hover:bg-gray-50 disabled:opacity-50
                   disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
```
