import { NextRequest, NextResponse } from 'next/server';
import { spoonacular } from '@/lib/spoonacular';
import { getSession } from '@/lib/get-session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);

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
