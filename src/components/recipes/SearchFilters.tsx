'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { CUISINES, DIETS, MEAL_TYPES, SORT_OPTIONS } from '@/lib/constants';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 dark:bg-gray-900 dark:border-gray-800">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors w-full dark:text-gray-300 dark:hover:text-emerald-400"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full dark:bg-emerald-900/40 dark:text-emerald-300">
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
            <FormField label="Cuisine" labelSize="xs">
              <Select
                value={filters.cuisine ?? ''}
                onChange={(e) =>
                  onUpdate({ cuisine: e.target.value || undefined })
                }
                placeholder="Any Cuisine"
                options={CUISINES.map((c) => ({ value: c, label: c }))}
              />
            </FormField>

            {/* Diet */}
            <FormField label="Diet" labelSize="xs">
              <Select
                value={filters.diet ?? ''}
                onChange={(e) =>
                  onUpdate({ diet: e.target.value || undefined })
                }
                placeholder="Any Diet"
                options={DIETS.map((d) => ({
                  value: d.toLowerCase(),
                  label: d,
                }))}
              />
            </FormField>

            {/* Meal Type */}
            <FormField label="Meal Type" labelSize="xs">
              <Select
                value={filters.type ?? ''}
                onChange={(e) =>
                  onUpdate({ type: e.target.value || undefined })
                }
                placeholder="Any Type"
                options={MEAL_TYPES.map((t) => ({
                  value: t,
                  label: t.charAt(0).toUpperCase() + t.slice(1),
                }))}
              />
            </FormField>

            {/* Max Ready Time */}
            <FormField label="Max Cook Time (min)" labelSize="xs">
              <Input
                inputSize="sm"
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
              />
            </FormField>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-4">
            <FormField
              label="Sort By"
              labelSize="xs"
              className="flex-1 max-w-xs"
            >
              <Select
                value={filters.sort ?? ''}
                onChange={(e) =>
                  onUpdate({ sort: e.target.value || undefined })
                }
                placeholder="Relevance"
                options={SORT_OPTIONS}
              />
            </FormField>

            {/* Reset Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={onReset}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 mt-5 transition-colors dark:text-gray-400 dark:hover:text-red-400"
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
