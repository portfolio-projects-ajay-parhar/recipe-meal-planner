'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import type {
  SearchFilters,
  SearchResult,
  RecipeCardData,
} from '@/types/recipe';

type ResultWithFavorite = SearchResult['results'][number] & {
  isFavorite?: boolean;
};

interface UseRecipeSearchReturn {
  recipes: RecipeCardData[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: SearchFilters;
  updateFilters: (partial: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  goToPage: (page: number) => void;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  offset: 0,
  number: 12,
};

export function useRecipeSearch(): UseRecipeSearchReturn {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(filters.query, 400);

  const fetchRecipes = useCallback(async (searchFilters: SearchFilters) => {
    if (!searchFilters.query.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/recipes/search?${params}`);

      if (!response.ok) throw new Error('Search failed');

      const data: SearchResult = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger search when debounced query or other filters change
  useEffect(() => {
    fetchRecipes({ ...filters, query: debouncedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filters.cuisine, filters.diet, filters.type,
      filters.maxReadyTime, filters.sort, filters.offset, fetchRecipes]);

  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
      // Reset offset when filters change (except when paginating)
      offset: 'offset' in partial ? (partial.offset ?? 0) : 0,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const pageSize = filters.number ?? 12;
  const totalResults = results?.totalResults ?? 0;

  const goToPage = useCallback(
    (page: number) => {
      updateFilters({ offset: (page - 1) * pageSize });
    },
    [pageSize, updateFilters]
  );

  const recipes: RecipeCardData[] = (results?.results ?? []).map(
    (r: ResultWithFavorite) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      readyInMinutes: r.readyInMinutes,
      servings: r.servings,
      diets: r.diets ?? [],
      isFavorite: r.isFavorite ?? false,
    })
  );

  return {
    recipes,
    isLoading,
    error,
    totalResults,
    currentPage: Math.floor((filters.offset ?? 0) / pageSize) + 1,
    totalPages: Math.ceil(totalResults / pageSize),
    filters,
    updateFilters,
    resetFilters,
    goToPage,
  };
}
