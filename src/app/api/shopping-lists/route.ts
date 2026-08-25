import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/get-session';
import { z } from 'zod';
import type { ExtendedIngredient } from '@/types/recipe';

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
            (entry.recipe.extendedIngredients as unknown as
              | ExtendedIngredient[]
              | null) ?? [];

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
