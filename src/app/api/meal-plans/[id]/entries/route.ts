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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    // Verify meal plan ownership
    const mealPlan = await prisma.mealPlan.findFirst({
      where: { id, userId: session.user.id },
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
        mealPlanId: id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
          id,
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
