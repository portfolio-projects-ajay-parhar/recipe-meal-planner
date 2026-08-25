'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useFavoriteToggle() {
  const { data: session } = useSession();
  const [pending, setPending] = useState<Set<number>>(new Set());

  const toggleFavorite = useCallback(
    async (recipeId: number, currentState: boolean) => {
      if (!session?.user) {
        throw new Error('Must be logged in');
      }

      setPending((prev) => new Set(prev).add(recipeId));

      try {
        if (currentState) {
          await fetch(`/api/favorites?recipeId=${recipeId}`, {
            method: 'DELETE',
          });
        } else {
          await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeId }),
          });
        }

        return !currentState;
      } catch (error) {
        console.error('Toggle favorite error:', error);
        return currentState;
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      }
    },
    [session]
  );

  return { toggleFavorite, isPending: (id: number) => pending.has(id) };
}
