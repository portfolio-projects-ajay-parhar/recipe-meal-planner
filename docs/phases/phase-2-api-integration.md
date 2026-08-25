# Phase 2: External API Integration (Spoonacular)

## Type Definitions

```typescript
// src/types/recipe.ts
export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  servings: number;
  readyInMinutes: number;
  sourceUrl: string;
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  instructions: string;
  extendedIngredients: ExtendedIngredient[];
  nutrition?: NutritionInfo;
}

export interface ExtendedIngredient {
  id: number;
  aisle: string;
  name: string;
  nameClean: string;
  original: string;
  originalName: string;
  amount: number;
  unit: string;
  measures: {
    us: { amount: number; unitShort: string; unitLong: string };
    metric: { amount: number; unitShort: string; unitLong: string };
  };
}

export interface NutritionInfo {
  nutrients: Nutrient[];
  caloricBreakdown: {
    percentProtein: number;
    percentFat: number;
    percentCarbs: number;
  };
}

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds: number;
}

export interface SearchFilters {
  query: string;
  cuisine?: string;
  diet?: string;
  type?: string;
  maxReadyTime?: number;
  minCalories?: number;
  maxCalories?: number;
  intolerances?: string[];
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  offset?: number;
  number?: number;
}

export interface SearchResult {
  results: SpoonacularRecipe[];
  offset: number;
  number: number;
  totalResults: number;
}

export interface RecipeCardData {
  id: number;
  title: string;
  image: string | null;
  readyInMinutes: number | null;
  servings: number | null;
  diets: string[];
  isFavorite?: boolean;
}
```

## API Client with Caching

```typescript
// src/lib/spoonacular.ts
import axios, { AxiosInstance } from 'axios';
import { prisma } from './prisma';
import type {
  SpoonacularRecipe,
  SearchFilters,
  SearchResult,
} from '@/types/recipe';

class SpoonacularClient {
  private client: AxiosInstance;
  private CACHE_DURATION_HOURS = 24;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.spoonacular.com',
      params: {
        apiKey: process.env.SPOONACULAR_API_KEY,
      },
    });
  }

  async searchRecipes(filters: SearchFilters): Promise<SearchResult> {
    const params: Record<string, string | number | boolean> = {
      query: filters.query,
      offset: filters.offset ?? 0,
      number: filters.number ?? 12,
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
    };

    if (filters.cuisine) params.cuisine = filters.cuisine;
    if (filters.diet) params.diet = filters.diet;
    if (filters.type) params.type = filters.type;
    if (filters.maxReadyTime) params.maxReadyTime = filters.maxReadyTime;
    if (filters.minCalories) params.minCalories = filters.minCalories;
    if (filters.maxCalories) params.maxCalories = filters.maxCalories;
    if (filters.intolerances?.length) {
      params.intolerances = filters.intolerances.join(',');
    }
    if (filters.sort) params.sort = filters.sort;
    if (filters.sortDirection) params.sortDirection = filters.sortDirection;

    try {
      const { data } = await this.client.get<SearchResult>(
        '/recipes/complexSearch',
        { params }
      );

      // Cache results in background
      this.cacheRecipes(data.results).catch(console.error);

      return data;
    } catch (error) {
      console.error('Spoonacular search error:', error);
      throw new Error('Failed to search recipes');
    }
  }

  async getRecipeById(id: number): Promise<SpoonacularRecipe> {
    // Check cache first
    const cached = await this.getCachedRecipe(id);
    if (cached) {
      return this.transformCachedToRecipe(cached);
    }

    try {
      const { data } = await this.client.get<SpoonacularRecipe>(
        `/recipes/${id}/information`,
        {
          params: {
            includeNutrition: true,
          },
        }
      );

      // Cache the result
      await this.cacheRecipe(data);

      return data;
    } catch (error) {
      console.error(`Spoonacular recipe ${id} error:`, error);
      throw new Error('Failed to fetch recipe');
    }
  }

  async getRecipesBulk(ids: number[]): Promise<SpoonacularRecipe[]> {
    if (ids.length === 0) return [];

    // Check cache for all ids
    const cached = await prisma.cachedRecipe.findMany({
      where: {
        id: { in: ids },
        cachedAt: {
          gte: new Date(
            Date.now() - this.CACHE_DURATION_HOURS * 60 * 60 * 1000
          ),
        },
      },
    });

    const cachedIds = new Set(cached.map((r) => r.id));
    const uncachedIds = ids.filter((id) => !cachedIds.has(id));

    let freshRecipes: SpoonacularRecipe[] = [];

    if (uncachedIds.length > 0) {
      try {
        const { data } = await this.client.get<SpoonacularRecipe[]>(
          '/recipes/informationBulk',
          {
            params: {
              ids: uncachedIds.join(','),
              includeNutrition: true,
            },
          }
        );
        freshRecipes = data;
        await this.cacheRecipes(freshRecipes);
      } catch (error) {
        console.error('Spoonacular bulk fetch error:', error);
      }
    }

    const cachedRecipes = cached.map((r) => this.transformCachedToRecipe(r));
    return [...cachedRecipes, ...freshRecipes];
  }

  async getRandomRecipes(
    number: number = 6,
    tags?: string
  ): Promise<SpoonacularRecipe[]> {
    try {
      const params: Record<string, string | number> = { number };
      if (tags) params.tags = tags;

      const { data } = await this.client.get<{
        recipes: SpoonacularRecipe[];
      }>('/recipes/random', { params });

      this.cacheRecipes(data.recipes).catch(console.error);

      return data.recipes;
    } catch (error) {
      console.error('Spoonacular random recipes error:', error);
      throw new Error('Failed to fetch random recipes');
    }
  }

  async getAutocomplete(
    query: string,
    number: number = 5
  ): Promise<{ id: number; title: string; imageType: string }[]> {
    try {
      const { data } = await this.client.get('/recipes/autocomplete', {
        params: { query, number },
      });
      return data;
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  private async getCachedRecipe(id: number) {
    return prisma.cachedRecipe.findFirst({
      where: {
        id,
        cachedAt: {
          gte: new Date(
            Date.now() - this.CACHE_DURATION_HOURS * 60 * 60 * 1000
          ),
        },
      },
    });
  }

  private async cacheRecipe(recipe: SpoonacularRecipe) {
    await prisma.cachedRecipe.upsert({
      where: { id: recipe.id },
      update: {
        title: recipe.title,
        image: recipe.image,
        imageType: recipe.imageType,
        servings: recipe.servings,
        readyInMinutes: recipe.readyInMinutes,
        sourceUrl: recipe.sourceUrl,
        summary: recipe.summary,
        cuisines: recipe.cuisines ?? [],
        dishTypes: recipe.dishTypes ?? [],
        diets: recipe.diets ?? [],
        instructions: recipe.instructions,
        extendedIngredients: recipe.extendedIngredients as any,
        nutrition: recipe.nutrition as any,
        cachedAt: new Date(),
      },
      create: {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        imageType: recipe.imageType,
        servings: recipe.servings,
        readyInMinutes: recipe.readyInMinutes,
        sourceUrl: recipe.sourceUrl,
        summary: recipe.summary,
        cuisines: recipe.cuisines ?? [],
        dishTypes: recipe.dishTypes ?? [],
        diets: recipe.diets ?? [],
        instructions: recipe.instructions,
        extendedIngredients: recipe.extendedIngredients as any,
        nutrition: recipe.nutrition as any,
      },
    });
  }

  private async cacheRecipes(recipes: SpoonacularRecipe[]) {
    const operations = recipes.map((recipe) => this.cacheRecipe(recipe));
    await Promise.allSettled(operations);
  }

  private transformCachedToRecipe(cached: any): SpoonacularRecipe {
    return {
      id: cached.id,
      title: cached.title,
      image: cached.image ?? '',
      imageType: cached.imageType ?? '',
      servings: cached.servings ?? 0,
      readyInMinutes: cached.readyInMinutes ?? 0,
      sourceUrl: cached.sourceUrl ?? '',
      summary: cached.summary ?? '',
      cuisines: cached.cuisines,
      dishTypes: cached.dishTypes,
      diets: cached.diets,
      instructions: cached.instructions ?? '',
      extendedIngredients: cached.extendedIngredients ?? [],
      nutrition: cached.nutrition,
    };
  }
}

export const spoonacular = new SpoonacularClient();
```

## Filter Constants

```typescript
// src/lib/constants.ts
export const CUISINES = [
  'African', 'American', 'British', 'Cajun', 'Caribbean',
  'Chinese', 'Eastern European', 'European', 'French', 'German',
  'Greek', 'Indian', 'Irish', 'Italian', 'Japanese',
  'Jewish', 'Korean', 'Latin American', 'Mediterranean',
  'Mexican', 'Middle Eastern', 'Nordic', 'Southern',
  'Spanish', 'Thai', 'Vietnamese',
] as const;

export const DIETS = [
  'Gluten Free', 'Ketogenic', 'Vegetarian', 'Lacto-Vegetarian',
  'Ovo-Vegetarian', 'Vegan', 'Pescetarian', 'Paleo',
  'Primal', 'Low FODMAP', 'Whole30',
] as const;

export const MEAL_TYPES = [
  'main course', 'side dish', 'dessert', 'appetizer',
  'salad', 'bread', 'breakfast', 'soup', 'beverage',
  'sauce', 'marinade', 'fingerfood', 'snack', 'drink',
] as const;

export const INTOLERANCES = [
  'Dairy', 'Egg', 'Gluten', 'Grain', 'Peanut',
  'Seafood', 'Sesame', 'Shellfish', 'Soy',
  'Sulfite', 'Tree Nut', 'Wheat',
] as const;

export const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'healthiness', label: 'Healthiness' },
  { value: 'time', label: 'Cooking Time' },
  { value: 'calories', label: 'Calories' },
  { value: 'price', label: 'Price' },
] as const;

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
] as const;

export const MEAL_TYPE_ORDER = [
  'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK',
] as const;
```
