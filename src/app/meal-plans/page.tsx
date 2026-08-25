'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, ChevronDown, X
} from 'lucide-react';
import { startOfWeek, addWeeks, format, addDays } from 'date-fns';
import { DAYS_OF_WEEK, MEAL_TYPE_ORDER } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import PageLoader from '@/components/ui/PageLoader';
import type { SpoonacularRecipe } from '@/types/recipe';

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
  // Mobile accordion: which day card is expanded (defaults to today's index)
  const [openDay, setOpenDay] = useState<number | null>(() =>
    (new Date().getDay() + 6) % 7
  );

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

  if (status === 'loading' || loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
            <Calendar className="w-6 h-6 text-emerald-600 shrink-0" />
            Meal Planner
          </h1>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <IconButton
            onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </IconButton>
          <span className="text-sm font-medium text-gray-700 min-w-[160px] sm:min-w-[180px] text-center dark:text-gray-300">
            {format(currentWeek, 'MMM d')} –{' '}
            {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
          </span>
          <IconButton
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {!mealPlan ? (
        <EmptyState
          bordered
          icon={Calendar}
          title="No meal plan for this week"
          action={
            <Button onClick={createMealPlan} size="sm">
              <Plus className="w-4 h-4" />
              Create Meal Plan
            </Button>
          }
        />
      ) : (
        <>
          {/* Generate Shopping List */}
          <div className="flex">
            <Link
              href={`/shopping-lists/new?mealPlanId=${mealPlan.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm bg-emerald-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
            >
              Generate Shopping List
            </Link>
          </div>

          {/* Mobile: Day-by-day accordion list */}
          <div className="md:hidden space-y-3">
            {DAYS_OF_WEEK.map((day, idx) => {
              const isOpen = openDay === idx;
              const dayEntries = mealPlan.entries.filter(
                (e) => e.dayOfWeek === idx
              );
              const isToday =
                format(addDays(currentWeek, idx), 'yyyy-MM-dd') ===
                format(new Date(), 'yyyy-MM-dd');

              return (
                <div
                  key={day}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden dark:bg-gray-900 dark:border-gray-800"
                >
                  <button
                    onClick={() => setOpenDay(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-3 text-left active:bg-gray-50 transition-colors dark:active:bg-gray-800"
                  >
                    <span className="font-medium text-sm text-gray-900 flex items-center gap-2 dark:text-gray-100">
                      {day}
                      <span className="text-gray-400 font-normal text-xs">
                        {format(addDays(currentWeek, idx), 'MMM d')}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Today
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      {dayEntries.length > 0 && (
                        <span className="text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {dayEntries.length}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-3 border-t border-gray-100 space-y-3 dark:border-gray-800">
                      {MEAL_TYPE_ORDER.map((mealType) => {
                        const entries = getEntriesForSlot(idx, mealType);
                        return (
                          <div key={mealType}>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                              {mealType.toLowerCase()}
                            </div>
                            <div className="space-y-2">
                              {entries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center gap-2 bg-emerald-50 rounded-lg p-2 dark:bg-emerald-950/40"
                                >
                                  <Link
                                    href={`/recipes/${entry.recipeId}`}
                                    className="flex-1 min-w-0 text-xs font-medium text-gray-800 line-clamp-2 dark:text-gray-200"
                                  >
                                    {entry.recipe.title}
                                  </Link>
                                  <button
                                    onClick={() => deleteEntry(entry.id)}
                                    aria-label="Delete entry"
                                    className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 active:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  setSelectedSlot({
                                    dayOfWeek: idx,
                                    mealType,
                                  });
                                  setShowAddModal(true);
                                }}
                                aria-label={`Add recipe to ${mealType.toLowerCase()} on ${day}`}
                                className="w-full border border-dashed border-gray-300 rounded-lg py-1.5 flex items-center justify-center gap-1 text-xs text-gray-400 active:bg-gray-50 active:text-emerald-600 transition-colors dark:border-gray-600 dark:active:bg-gray-800"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop/Tablet: Week Calendar Grid */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-xs font-medium text-gray-500 p-2" />
                {DAYS_OF_WEEK.map((day, idx) => (
                  <div
                    key={day}
                    className="text-xs font-medium text-gray-700 p-2 text-center bg-gray-100 rounded-lg dark:text-gray-300 dark:bg-gray-800"
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
                  <div className="text-xs font-medium text-gray-600 p-2 flex items-start capitalize dark:text-gray-400">
                    {mealType.toLowerCase()}
                  </div>

                  {DAYS_OF_WEEK.map((_, dayIdx) => {
                    const entries = getEntriesForSlot(dayIdx, mealType);

                    return (
                      <div
                        key={dayIdx}
                        className="bg-white border border-gray-200 rounded-lg p-2 min-h-[80px] group dark:bg-gray-900 dark:border-gray-800"
                      >
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-emerald-50 rounded-lg p-2 mb-1 text-xs relative group/entry dark:bg-emerald-950/40"
                          >
                            <Link
                              href={`/recipes/${entry.recipeId}`}
                              className="font-medium text-gray-800 hover:text-emerald-700 line-clamp-2 dark:text-gray-200 dark:hover:text-emerald-400"
                            >
                              {entry.recipe.title}
                            </Link>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              aria-label="Delete entry"
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center flex transition-opacity opacity-100 md:opacity-0 md:group-hover/entry:opacity-100"
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
                          aria-label="Add recipe to slot"
                          className="w-full py-1 text-gray-400 hover:text-emerald-600 transition-opacity flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100"
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
  const [results, setResults] = useState<SpoonacularRecipe[]>([]);
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-lg max-h-[85dvh] sm:max-h-[80vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-xl dark:bg-gray-900">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 truncate pr-2 dark:text-gray-100">
            Add Recipe – {DAYS_OF_WEEK[dayOfWeek]}{' '}
            {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 -mr-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg shrink-0 dark:hover:bg-gray-800 dark:active:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <Input
            inputSize="sm"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes..."
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
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left dark:border-gray-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40"
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
                <div className="font-medium text-sm text-gray-900 line-clamp-1 dark:text-gray-100">
                  {recipe.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
