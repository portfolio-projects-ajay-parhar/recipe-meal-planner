# Phase 4: API Routes

## Recipe Search API

```typescript
// src/app/api/recipes/search/route.ts
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
```

## Recipe Detail API

```typescript
// src/app/api/recipes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spoonacular } from '@/lib/spoonacular';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
  }

  try {
    const recipe = await spoonacular.getRecipeById(id);

    // Check favorite status
    const session = await getSession();
    let isFavorite = false;

    if (session?.user) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_recipeId: {
            userId: session.user.id,
            recipeId: id,
          },
        },
      });
      isFavorite = !!favorite;
    }

    return NextResponse.json({ ...recipe, isFavorite });
  } catch (error) {
    console.error(`Recipe ${id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}
```

## Favorites API

```typescript
// src/app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/get-session';
import { spoonacular } from '@/lib/spoonacular';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 12);
    const offset = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: session.user.id },
        include: { recipe: true },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.favorite.count({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        ...f.recipe,
        isFavorite: true,
        favoritedAt: f.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { recipeId } = await request.json();

    // Ensure recipe is cached before favoriting
    await spoonacular.getRecipeById(recipeId);

    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        recipeId,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already favorited' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;
    const recipeId = Number(searchParams.get('recipeId'));

    await prisma.favorite.delete({
      where: {
        userId_recipeId: {
          userId: session.user.id,
          recipeId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
```

## Meal Plan API

```typescript
// src/app/api/meal-plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/get-session';
import { z } from 'zod';
import { startOfWeek, format } from 'date-fns';

const createMealPlanSchema = z.object({
  name: z.string().min(1).max(100),
  weekStart: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;
    const weekStart = searchParams.get('weekStart');

    const where: any = { userId: session.user.id };

    if (weekStart) {
      where.weekStart = new Date(weekStart);
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where,
      include: {
        entries: {
          include: { recipe: true },
          orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        },
      },
      orderBy: { weekStart: 'desc' },
    });

    return NextResponse.json(mealPlans);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, weekStart } = createMealPlanSchema.parse(body);

    const weekStartDate = startOfWeek(new Date(weekStart), {
      weekStartsOn: 1,
    });

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: session.user.id,
        name,
        weekStart: weekStartDate,
      },
    });

    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    );
  }
}
```

## Meal Plan Entries API

```typescript
// src/app/api/meal-plans/[id]/entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/get-session';
import { spoonacular } from '@/lib/spoonacular';
import { z } from 'zod';

const addEntrySchema = z.object({
  recipeId: z.number(),
  dayOfWeek: z.number().min(0).max(6),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  servings: z.number().min(1).default(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    // Verify meal plan ownership
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { recipeId, dayOfWeek, mealType, servings } =
      addEntrySchema.parse(body);

    // Ensure recipe is cached
    await spoonacular.getRecipeById(recipeId);

    const entry = await prisma.mealPlanEntry.create({
      data: {
        mealPlanId: params.id,
        recipeId,
        dayOfWeek,
        mealType,
        servings,
      },
      include: { recipe: true },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to add entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const entry = await prisma.mealPlanEntry.findFirst({
      where: {
        id: entryId,
        mealPlan: {
          id: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    await prisma.mealPlanEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
```

## Shopping List API

```typescript
// src/app/api/shopping-lists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/get-session';
import { z } from 'zod';

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  mealPlanId: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();

    const lists = await prisma.shoppingList.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          orderBy: [{ aisle: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(lists);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, mealPlanId } = createListSchema.parse(body);

    let items: Array<{
      name: string;
      amount: number | null;
      unit: string | null;
      aisle: string | null;
    }> = [];

    // Generate from meal plan if provided
    if (mealPlanId) {
      const mealPlan = await prisma.mealPlan.findFirst({
        where: { id: mealPlanId, userId: session.user.id },
        include: {
          entries: {
            include: { recipe: true },
          },
        },
      });

      if (mealPlan) {
        const ingredientMap = new Map<
          string,
          {
            name: string;
            amount: number;
            unit: string;
            aisle: string;
          }
        >();

        for (const entry of mealPlan.entries) {
          const ingredients =
            (entry.recipe.extendedIngredients as any[]) ?? [];

          for (const ing of ingredients) {
            const key = `${ing.nameClean || ing.name}-${ing.unit}`;
            const existing = ingredientMap.get(key);

            if (existing) {
              existing.amount += (ing.amount ?? 0) * entry.servings;
            } else {
              ingredientMap.set(key, {
                name: ing.nameClean || ing.name,
                amount: (ing.amount ?? 0) * entry.servings,
                unit: ing.unit ?? '',
                aisle: ing.aisle ?? 'Other',
              });
            }
          }
        }

        items = Array.from(ingredientMap.values());
      }
    }

    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: session.user.id,
        name,
        items: {
          create: items,
        },
      },
      include: {
        items: { orderBy: [{ aisle: 'asc' }, { name: 'asc' }] },
      },
    });

    return NextResponse.json(shoppingList, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create shopping list' },
      { status: 500 }
    );
  }
}
```

## Shopping List Item Toggle & Delete

```typescript
// src/app/api/shopping-lists/[id]/items/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/get-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Verify ownership
    const item = await prisma.shoppingListItem.findFirst({
      where: {
        id: params.itemId,
        shoppingList: {
          id: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.shoppingListItem.update({
      where: { id: params.itemId },
      data: { checked: body.checked },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await requireAuth();

    const item = await prisma.shoppingListItem.findFirst({
      where: {
        id: params.itemId,
        shoppingList: {
          id: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    await prisma.shoppingListItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
```
