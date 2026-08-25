import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/get-session';
import { z } from 'zod';
import { startOfWeek } from 'date-fns';

const createMealPlanSchema = z.object({
  name: z.string().min(1).max(100),
  weekStart: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;
    const weekStart = searchParams.get('weekStart');

    const where: Prisma.MealPlanWhereInput = { userId: session.user.id };

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
