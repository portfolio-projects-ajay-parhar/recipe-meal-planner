import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/get-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const session = await requireAuth();
    const body = await request.json();

    // Verify ownership
    const item = await prisma.shoppingListItem.findFirst({
      where: {
        id: itemId,
        shoppingList: {
          id,
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
      where: { id: itemId },
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
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const session = await requireAuth();

    const item = await prisma.shoppingListItem.findFirst({
      where: {
        id: itemId,
        shoppingList: {
          id,
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
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
