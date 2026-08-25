import axios, { AxiosInstance } from 'axios';
import { Prisma } from '@prisma/client';
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
        extendedIngredients:
          recipe.extendedIngredients as unknown as Prisma.InputJsonValue,
        nutrition: recipe.nutrition as unknown as Prisma.InputJsonValue,
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
        extendedIngredients:
          recipe.extendedIngredients as unknown as Prisma.InputJsonValue,
        nutrition: recipe.nutrition as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async cacheRecipes(recipes: SpoonacularRecipe[]) {
    const operations = recipes.map((recipe) => this.cacheRecipe(recipe));
    await Promise.allSettled(operations);
  }

  private transformCachedToRecipe(cached: {
    id: number;
    title: string;
    image: string | null;
    imageType: string | null;
    servings: number | null;
    readyInMinutes: number | null;
    sourceUrl: string | null;
    summary: string | null;
    cuisines: string[];
    dishTypes: string[];
    diets: string[];
    instructions: string | null;
    extendedIngredients: unknown;
    nutrition: unknown;
  }): SpoonacularRecipe {
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
      extendedIngredients:
        (cached.extendedIngredients as SpoonacularRecipe['extendedIngredients']) ??
        [],
      nutrition: cached.nutrition as SpoonacularRecipe['nutrition'],
    };
  }
}

export const spoonacular = new SpoonacularClient();
