'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import RecipeCard from '@/components/recipes/RecipeCard';
import EmptyState from '@/components/ui/EmptyState';
import PageLoader from '@/components/ui/PageLoader';
import Pagination from '@/components/ui/Pagination';

interface FavoriteRecipe {
  id: number;
  title: string;
  image: string | null;
  readyInMinutes: number | null;
  servings: number | null;
  diets?: string[];
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/favorites?page=${page}&limit=12`);
        const data = await res.json();
        setFavorites(data.favorites);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session, page]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
        <Heart className="w-6 h-6 text-red-500" />
        My Favorites
      </h1>

      {favorites.length === 0 ? (
        <EmptyState
          bordered
          icon={Heart}
          title="No favorites yet"
          description="Heart recipes while searching to save them here"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  id: recipe.id,
                  title: recipe.title,
                  image: recipe.image,
                  readyInMinutes: recipe.readyInMinutes,
                  servings: recipe.servings,
                  diets: recipe.diets ?? [],
                  isFavorite: true,
                }}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
