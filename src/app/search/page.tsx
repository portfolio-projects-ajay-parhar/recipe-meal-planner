'use client';

import { Search as SearchIcon } from 'lucide-react';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import RecipeCard from '@/components/recipes/RecipeCard';
import SearchFilters from '@/components/recipes/SearchFilters';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-gray-100">
          Search Recipes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find the perfect recipe from thousands of options
        </p>
      </div>

      {/* Search Input */}
      <Input
        inputSize="lg"
        type="text"
        value={filters.query}
        onChange={(e) => updateFilters({ query: e.target.value })}
        placeholder="Search for recipes... (e.g., chicken pasta, vegan curry)"
        leadingIcon={<SearchIcon className="text-gray-400" />}
        trailingElement={isLoading ? <Spinner size="sm" /> : undefined}
        autoFocus
      />

      {/* Filters */}
      <SearchFilters
        filters={filters}
        onUpdate={updateFilters}
        onReset={resetFilters}
      />

      {/* Results Header */}
      {totalResults > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Found <span className="font-medium">{totalResults}</span> recipes
        </p>
      )}

      {/* Error */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Results Grid */}
      {recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filters.query && recipes.length === 0 && !error && (
        <EmptyState
          icon={SearchIcon}
          title="No recipes found"
          description="Try adjusting your search or filters"
        />
      )}

      {/* Initial State */}
      {!filters.query && (
        <EmptyState
          icon={SearchIcon}
          title="Start searching"
          description="Type a recipe name or ingredient above"
        />
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
