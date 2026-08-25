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
