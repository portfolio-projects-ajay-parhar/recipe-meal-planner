import { NextRequest, NextResponse } from 'next/server';
import { spoonacular } from '@/lib/spoonacular';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/prisma';
import type { SearchFilters } from '@/types/recipe';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters: SearchFilters = {
    query: searchParams.get('query') ?? '',
    cuisine: searchParams.get('cuisine') ?? undefined,
    diet: searchParams.get('diet') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    maxReadyTime: searchParams.get('maxReadyTime')
      ? Number(searchParams.get('maxReadyTime'))
      : undefined,
    minCalories: searchParams.get('minCalories')
      ? Number(searchParams.get('minCalories'))
      : undefined,
    maxCalories: searchParams.get('maxCalories')
      ? Number(searchParams.get('maxCalories'))
      : undefined,
    intolerances: searchParams.get('intolerances')
      ? searchParams.get('intolerances')!.split(',')
      : undefined,
    sort: searchParams.get('sort') ?? undefined,
    sortDirection:
      (searchParams.get('sortDirection') as 'asc' | 'desc') ?? undefined,
    offset: Number(searchParams.get('offset') ?? 0),
    number: Number(searchParams.get('number') ?? 12),
  };

  try {
    const results = await spoonacular.searchRecipes(filters);

    // Add favorite status if user is logged in
    const session = await getSession();
    if (session?.user) {
      const recipeIds = results.results.map((r) => r.id);
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: session.user.id,
          recipeId: { in: recipeIds },
        },
        select: { recipeId: true },
      });

      const favoriteIds = new Set(favorites.map((f) => f.recipeId));

      const resultsWithFavorites = results.results.map((recipe) => ({
        ...recipe,
        isFavorite: favoriteIds.has(recipe.id),
      }));

      return NextResponse.json({
        ...results,
        results: resultsWithFavorites,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search recipes' },
      { status: 500 }
    );
  }
}
