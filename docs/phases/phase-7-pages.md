# Phase 7: Pages

## Home Page

```typescript
// src/app/page.tsx
import Link from 'next/link';
import { Search, Calendar, ShoppingCart, Heart, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Search,
      title: 'Recipe Search',
      description: 'Search thousands of recipes with filters for cuisine, diet, and more.',
      href: '/search',
      color: 'emerald',
    },
    {
      icon: Heart,
      title: 'Save Favorites',
      description: 'Bookmark your favorite recipes for quick access later.',
      href: '/favorites',
      color: 'red',
    },
    {
      icon: Calendar,
      title: 'Meal Planning',
      description: 'Plan your weekly meals with a drag-and-drop calendar.',
      href: '/meal-plans',
      color: 'blue',
    },
    {
      icon: ShoppingCart,
      title: 'Shopping Lists',
      description: 'Auto-generate shopping lists from your meal plans.',
      href: '/shopping-lists',
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Plan Your Meals,
          <br />
          <span className="text-emerald-600">Simplify Your Life</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Search recipes, plan your weekly meals, and generate shopping lists
          — all in one place.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white
                     px-6 py-3 rounded-xl text-lg font-medium
                     hover:bg-emerald-700 transition-colors shadow-lg
                     shadow-emerald-600/25"
        >
          Start Searching
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, description, href }) => (
          <Link
            key={title}
            href={href}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200
                       hover:shadow-md hover:border-emerald-200
                       transition-all group"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex
                            items-center justify-center mb-4
                            group-hover:bg-emerald-200 transition-colors">
              <Icon className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
```

## Search Page

```typescript
// src/app/search/page.tsx
'use client';

import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import RecipeCard from '@/components/recipes/RecipeCard';
import SearchFilters from '@/components/recipes/SearchFilters';
import Pagination from '@/components/ui/Pagination';

export default function SearchPage() {
  const {
    recipes,
    isLoading,
    error,
    totalResults,
    currentPage,
    totalPages,
    filters,
    updateFilters,
    resetFilters,
    goToPage,
  } = useRecipeSearch();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Search Recipes
        </h1>
        <p className="text-gray-600">
          Find the perfect recipe from thousands of options
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2
                              w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => updateFilters({ query: e.target.value })}
          placeholder="Search for recipes... (e.g., chicken pasta, vegan curry)"
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl
                     text-lg focus:ring-2 focus:ring-emerald-500
                     focus:border-transparent shadow-sm"
          autoFocus
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2
                             w-5 h-5 text-emerald-600 animate-spin" />
        )}
      </div>

      {/* Filters */}
      <SearchFilters
        filters={filters}
        onUpdate={updateFilters}
        onReset={resetFilters}
      />

      {/* Results Header */}
      {totalResults > 0 && (
        <p className="text-sm text-gray-600">
          Found <span className="font-medium">{totalResults}</span> recipes
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Results Grid */}
      {recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                        xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filters.query && recipes.length === 0 && !error && (
        <div className="text-center py-16">
          <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No recipes found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Initial State */}
      {!filters.query && (
        <div className="text-center py-16">
          <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Type a recipe name or ingredient above
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </div>
  );
}
```

## Recipe Detail Page (Server Component)

```typescript
// src/app/recipes/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { spoonacular } from '@/lib/spoonacular';
import RecipeDetail from './RecipeDetail';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const recipe = await spoonacular.getRecipeById(parseInt(params.id));
    return {
      title: `${recipe.title} | MealPlanner`,
      description: recipe.summary?.replace(/<[^>]*>/g, '').slice(0, 160),
    };
  } catch {
    return { title: 'Recipe Not Found' };
  }
}

export default async function RecipePage({ params }: Props) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  try {
    const recipe = await spoonacular.getRecipeById(id);
    return <RecipeDetail recipe={recipe} />;
  } catch {
    notFound();
  }
}
```

```typescript
// src/app/recipes/[id]/RecipeDetail.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Clock, Users, Heart, ExternalLink, ChefHat,
  ShoppingCart, Plus, Check
} from 'lucide-react';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import type { SpoonacularRecipe, ExtendedIngredient } from '@/types/recipe';

interface RecipeDetailProps {
  recipe: SpoonacularRecipe & { isFavorite?: boolean };
}

export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  const { data: session } = useSession();
  const { toggleFavorite, isPending } = useFavoriteToggle();
  const [isFavorite, setIsFavorite] = useState(
    recipe.isFavorite ?? false
  );
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const handleFavorite = async () => {
    if (!session?.user) return;
    const newState = await toggleFavorite(recipe.id, isFavorite);
    setIsFavorite(newState);
  };

  // Extract key nutrients
  const calories = recipe.nutrition?.nutrients?.find(
    (n) => n.name === 'Calories'
  );
  const protein = recipe.nutrition?.nutrients?.find(
    (n) => n.name === 'Protein'
  );
  const carbs = recipe.nutrition?.nutrients?.find(
    (n) => n.name === 'Carbohydrates'
  );
  const fat = recipe.nutrition?.nutrients?.find(
    (n) => n.name === 'Fat'
  );

  // Parse instructions into steps
  const instructionSteps = recipe.instructions
    ?.replace(/<ol>|<\/ol>|<ul>|<\/ul>/gi, '')
    .split(/<li>|<\/li>/gi)
    .map((step) => step.replace(/<[^>]*>/g, '').trim())
    .filter((step) => step.length > 0)
    ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative">
        {recipe.image && (
          <div className="aspect-[21/9] relative rounded-2xl overflow-hidden">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        )}
      </div>

      {/* Title & Meta */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {recipe.title}
          </h1>
          {session?.user && (
            <button
              onClick={handleFavorite}
              disabled={isPending(recipe.id)}
              className={`p-3 rounded-xl transition-colors shrink-0 ${
                isFavorite
                  ? 'bg-red-50 text-red-500'
                  : 'bg-gray-100 text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart
                className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {recipe.diets?.map((diet) => (
            <span
              key={diet}
              className="bg-emerald-100 text-emerald-700 text-sm px-3
                         py-1 rounded-full"
            >
              {diet}
            </span>
          ))}
          {recipe.cuisines?.map((cuisine) => (
            <span
              key={cuisine}
              className="bg-blue-100 text-blue-700 text-sm px-3
                         py-1 rounded-full"
            >
              {cuisine}
            </span>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-6 mt-4 text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>{recipe.readyInMinutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>{recipe.servings} servings</span>
          </div>
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-600
                         hover:underline"
            >
              <ExternalLink className="w-5 h-5" />
              Source
            </a>
          )}
        </div>
      </div>

      {/* Nutrition Card */}
      {calories && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Nutrition per Serving
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Calories', data: calories, color: 'amber' },
              { label: 'Protein', data: protein, color: 'red' },
              { label: 'Carbs', data: carbs, color: 'blue' },
              { label: 'Fat', data: fat, color: 'yellow' },
            ].map(({ label, data, color }) =>
              data ? (
                <div
                  key={label}
                  className="text-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(data.amount)}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {data.unit}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{label}</div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6
                          sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center
                             gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Ingredients
              </h2>
              {/* Serving Adjuster */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))
                  }
                  className="w-7 h-7 rounded-full border border-gray-300
                             text-sm flex items-center justify-center
                             hover:bg-gray-50"
                >
                  −
                </button>
                <span className="text-sm font-medium w-6 text-center">
                  {servingMultiplier}x
                </span>
                <button
                  onClick={() => setServingMultiplier(servingMultiplier + 0.5)}
                  className="w-7 h-7 rounded-full border border-gray-300
                             text-sm flex items-center justify-center
                             hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <ul className="space-y-2">
              {recipe.extendedIngredients?.map(
                (ing: ExtendedIngredient, idx: number) => (
                  <li
                    key={`${ing.id}-${idx}`}
                    className="flex items-start gap-2 text-sm text-gray-700
                               py-1 border-b border-gray-50 last:border-0"
                  >
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5
                                     shrink-0" />
                    <span>
                      <span className="font-medium">
                        {Math.round(ing.amount * servingMultiplier * 10) / 10}
                        {ing.unit ? ` ${ing.unit}` : ''}
                      </span>{' '}
                      {ing.nameClean || ing.name}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 flex items-center
                           gap-2 mb-6">
              <ChefHat className="w-5 h-5 text-emerald-600" />
              Instructions
            </h2>

            {instructionSteps.length > 0 ? (
              <ol className="space-y-4">
                {instructionSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span
                      className="w-8 h-8 bg-emerald-100 text-emerald-700
                                 rounded-full flex items-center justify-center
                                 text-sm font-bold shrink-0"
                    >
                      {idx + 1}
                    </span>
                    <p className="text-gray-700 pt-1 leading-relaxed">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: recipe.instructions || 'No instructions available.',
                }}
              />
            )}
          </div>

          {/* Summary */}
          {recipe.summary && (
            <div className="bg-white rounded-xl border border-gray-200 p-6
                            mt-6">
              <h2 className="font-semibold text-gray-900 mb-3">About</h2>
              <div
                className="text-sm text-gray-600 prose prose-sm max-w-none
                           prose-a:text-emerald-600"
                dangerouslySetInnerHTML={{ __html: recipe.summary }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Meal Planner Page

```typescript
// src/app/meal-plans/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Trash2, X
} from 'lucide-react';
import { startOfWeek, addWeeks, format, addDays } from 'date-fns';
import { DAYS_OF_WEEK, MEAL_TYPE_ORDER } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';

interface MealPlanEntry {
  id: string;
  recipeId: number;
  dayOfWeek: number;
  mealType: string;
  servings: number;
  recipe: {
    id: number;
    title: string;
    image: string | null;
    readyInMinutes: number | null;
  };
}

interface MealPlan {
  id: string;
  name: string;
  weekStart: string;
  entries: MealPlanEntry[];
}

export default function MealPlanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayOfWeek: number;
    mealType: string;
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchMealPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/meal-plans?weekStart=${currentWeek.toISOString()}`
      );
      const plans = await res.json();
      setMealPlan(plans[0] ?? null);
    } catch (error) {
      console.error('Failed to fetch meal plan:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  useEffect(() => {
    if (session) fetchMealPlan();
  }, [session, fetchMealPlan]);

  const createMealPlan = async () => {
    const weekLabel = format(currentWeek, "'Week of' MMM d, yyyy");
    const res = await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: weekLabel,
        weekStart: currentWeek.toISOString(),
      }),
    });
    const plan = await res.json();
    setMealPlan({ ...plan, entries: [] });
  };

  const deleteEntry = async (entryId: string) => {
    if (!mealPlan) return;
    await fetch(
      `/api/meal-plans/${mealPlan.id}/entries?entryId=${entryId}`,
      { method: 'DELETE' }
    );
    setMealPlan({
      ...mealPlan,
      entries: mealPlan.entries.filter((e) => e.id !== entryId),
    });
  };

  const getEntriesForSlot = (dayOfWeek: number, mealType: string) => {
    return (
      mealPlan?.entries.filter(
        (e) => e.dayOfWeek === dayOfWeek && e.mealType === mealType
      ) ?? []
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600
                        border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center
                         gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            Meal Planner
          </h1>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
            className="p-2 rounded-lg border border-gray-300
                       hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[180px]
                           text-center">
            {format(currentWeek, 'MMM d')} –{' '}
            {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 rounded-lg border border-gray-300
                       hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!mealPlan ? (
        <div className="text-center py-16 bg-white rounded-xl border
                        border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No meal plan for this week
          </h3>
          <button
            onClick={createMealPlan}
            className="mt-4 inline-flex items-center gap-2 bg-emerald-600
                       text-white px-4 py-2 rounded-lg hover:bg-emerald-700
                       transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Meal Plan
          </button>
        </div>
      ) : (
        <>
          {/* Generate Shopping List */}
          <div className="flex justify-end">
            <Link
              href={`/shopping-lists/new?mealPlanId=${mealPlan.id}`}
              className="inline-flex items-center gap-2 text-sm
                         bg-emerald-600 text-white px-4 py-2 rounded-lg
                         hover:bg-emerald-700 transition-colors"
            >
              Generate Shopping List
            </Link>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-xs font-medium text-gray-500 p-2" />
                {DAYS_OF_WEEK.map((day, idx) => (
                  <div
                    key={day}
                    className="text-xs font-medium text-gray-700 p-2
                               text-center bg-gray-100 rounded-lg"
                  >
                    <div>{day}</div>
                    <div className="text-gray-400">
                      {format(addDays(currentWeek, idx), 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal Type Rows */}
              {MEAL_TYPE_ORDER.map((mealType) => (
                <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="text-xs font-medium text-gray-600 p-2
                                  flex items-start capitalize">
                    {mealType.toLowerCase()}
                  </div>

                  {DAYS_OF_WEEK.map((_, dayIdx) => {
                    const entries = getEntriesForSlot(dayIdx, mealType);

                    return (
                      <div
                        key={dayIdx}
                        className="bg-white border border-gray-200 rounded-lg
                                   p-2 min-h-[80px] group"
                      >
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-emerald-50 rounded-lg p-2 mb-1
                                       text-xs relative group/entry"
                          >
                            <Link
                              href={`/recipes/${entry.recipeId}`}
                              className="font-medium text-gray-800
                                         hover:text-emerald-700
                                         line-clamp-2"
                            >
                              {entry.recipe.title}
                            </Link>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="absolute -top-1 -right-1 w-5 h-5
                                         bg-red-500 text-white rounded-full
                                         items-center justify-center
                                         opacity-0 group-hover/entry:opacity-100
                                         transition-opacity hidden
                                         group-hover/entry:flex"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => {
                            setSelectedSlot({
                              dayOfWeek: dayIdx,
                              mealType,
                            });
                            setShowAddModal(true);
                          }}
                          className="w-full py-1 text-gray-400
                                     hover:text-emerald-600 opacity-0
                                     group-hover:opacity-100
                                     transition-opacity flex items-center
                                     justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Recipe Modal */}
      {showAddModal && selectedSlot && mealPlan && (
        <AddRecipeModal
          mealPlanId={mealPlan.id}
          dayOfWeek={selectedSlot.dayOfWeek}
          mealType={selectedSlot.mealType}
          onClose={() => {
            setShowAddModal(false);
            setSelectedSlot(null);
          }}
          onAdd={() => {
            fetchMealPlan();
            setShowAddModal(false);
            setSelectedSlot(null);
          }}
        />
      )}
    </div>
  );
}

// Quick Add Recipe Modal
function AddRecipeModal({
  mealPlanId,
  dayOfWeek,
  mealType,
  onClose,
  onAdd,
}: {
  mealPlanId: string;
  dayOfWeek: number;
  mealType: string;
  onClose: () => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/recipes/search?query=${encodeURIComponent(
            debouncedQuery
          )}&number=6`
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const addRecipe = async (recipeId: number) => {
    try {
      await fetch(`/api/meal-plans/${mealPlanId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, dayOfWeek, mealType, servings: 1 }),
      });
      onAdd();
    } catch (error) {
      console.error('Failed to add recipe:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh]
                      overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b
                        border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Add Recipe – {DAYS_OF_WEEK[dayOfWeek]}{' '}
            {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100
                                               rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       text-sm focus:ring-2 focus:ring-emerald-500
                       focus:border-transparent"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
          {searching && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Searching...
            </div>
          )}
          {results.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => addRecipe(recipe.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg
                         border border-gray-200 hover:border-emerald-300
                         hover:bg-emerald-50 transition-colors text-left"
            >
              {recipe.image && (
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  width={60}
                  height={60}
                  className="rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900
                               line-clamp-1">
                  {recipe.title}
                </div>
                <div className="text-xs text-gray-500">
                  {recipe.readyInMinutes}m · {recipe.servings} servings
                </div>
              </div>
              <Plus className="w-5 h-5 text-emerald-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Import the debounce hook for the modal
import { useDebounce } from '@/hooks/useDebounce';
```

## Shopping List Page

```typescript
// src/app/shopping-lists/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Check, Trash2, ChevronDown, ChevronRight
} from 'lucide-react';

interface ShoppingListItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  aisle: string | null;
  checked: boolean;
}

interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  items: ShoppingListItem[];
}

export default function ShoppingListsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping-lists');
      const data = await res.json();
      setLists(data);
      if (data.length > 0 && !expandedList) {
        setExpandedList(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch shopping lists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchLists();
  }, [session, fetchLists]);

  const toggleItem = async (
    listId: string,
    itemId: string,
    checked: boolean
  ) => {
    // Optimistic update
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, checked } : item
              ),
            }
          : list
      )
    );

    await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked }),
    });
  };

  const deleteItem = async (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.filter((item) => item.id !== itemId),
            }
          : list
      )
    );

    await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });
  };

  // Group items by aisle
  const groupByAisle = (items: ShoppingListItem[]) => {
    const groups: Record<string, ShoppingListItem[]> = {};
    for (const item of items) {
      const aisle = item.aisle || 'Other';
      if (!groups[aisle]) groups[aisle] = [];
      groups[aisle].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600
                        border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-emerald-600" />
        Shopping Lists
      </h1>

      {lists.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border
                        border-gray-200">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No shopping lists yet
          </h3>
          <p className="text-gray-600 text-sm">
            Generate one from your meal plan
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => {
            const isExpanded = expandedList === list.id;
            const checkedCount = list.items.filter((i) => i.checked).length;
            const totalCount = list.items.length;

            return (
              <div
                key={list.id}
                className="bg-white rounded-xl border border-gray-200
                           overflow-hidden"
              >
                {/* List Header */}
                <button
                  onClick={() =>
                    setExpandedList(isExpanded ? null : list.id)
                  }
                  className="w-full flex items-center justify-between p-4
                             hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{list.name}</h3>
                    <p className="text-sm text-gray-500">
                      {checkedCount}/{totalCount} items checked
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Progress Bar */}
                    <div className="w-20 h-2 bg-gray-200 rounded-full
                                    overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full
                                   transition-all"
                        style={{
                          width: `${
                            totalCount > 0
                              ? (checkedCount / totalCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    {groupByAisle(list.items).map(([aisle, items]) => (
                      <div key={aisle}>
                        <h4 className="text-xs font-semibold text-gray-500
                                       uppercase tracking-wider mb-2">
                          {aisle}
                        </h4>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 py-1.5
                                         group"
                            >
                              <button
                                onClick={() =>
                                  toggleItem(
                                    list.id,
                                    item.id,
                                    !item.checked
                                  )
                                }
                                className={`w-5 h-5 rounded border-2
                                           flex items-center justify-center
                                           shrink-0 transition-colors ${
                                             item.checked
                                               ? 'bg-emerald-500 border-emerald-500'
                                               : 'border-gray-300 hover:border-emerald-500'
                                           }`}
                              >
                                {item.checked && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>

                              <span
                                className={`flex-1 text-sm ${
                                  item.checked
                                    ? 'line-through text-gray-400'
                                    : 'text-gray-700'
                                }`}
                              >
                                {item.amount
                                  ? `${Math.round(item.amount * 10) / 10}`
                                  : ''}
                                {item.unit ? ` ${item.unit}` : ''}{' '}
                                {item.name}
                              </span>

                              <button
                                onClick={() =>
                                  deleteItem(list.id, item.id)
                                }
                                className="p-1 text-gray-300
                                           hover:text-red-500 opacity-0
                                           group-hover:opacity-100
                                           transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

## Auth Pages

```typescript
// src/app/auth/signin/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/search');
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <ChefHat className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600 mt-1">Sign in to your account</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200
                   p-6 space-y-4"
      >
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       focus:ring-2 focus:ring-emerald-500
                       focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       focus:ring-2 focus:ring-emerald-500
                       focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2.5 rounded-lg
                     font-medium hover:bg-emerald-700 transition-colors
                     disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-emerald-600 font-medium hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
```

```typescript
// src/app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Auto sign in after registration
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      router.push('/search');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Registration failed'
      );
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <ChefHat className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="text-gray-600 mt-1">Start planning your meals</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200
                   p-6 space-y-4"
      >
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       focus:ring-2 focus:ring-emerald-500
                       focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       focus:ring-2 focus:ring-emerald-500
                       focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2
                       focus:ring-2 focus:ring-emerald-500
                       focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2.5 rounded-lg
                     font-medium hover:bg-emerald-700 transition-colors
                     disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Account
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="text-emerald-600 font-medium hover:underline"
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
```

## Favorites Page

```typescript
// src/app/favorites/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import RecipeCard from '@/components/recipes/RecipeCard';
import Pagination from '@/components/ui/Pagination';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/favorites?page=${page}&limit=12`);
        const data = await res.json();
        setFavorites(data.favorites);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600
                        border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-500" />
        My Favorites
      </h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border
                        border-gray-200">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No favorites yet
          </h3>
          <p className="text-gray-600">
            Heart recipes while searching to save them here
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                          xl:grid-cols-4 gap-6">
            {favorites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  id: recipe.id,
                  title: recipe.title,
                  image: recipe.image,
                  readyInMinutes: recipe.readyInMinutes,
                  servings: recipe.servings,
                  diets: recipe.diets ?? [],
                  isFavorite: true,
                }}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```
