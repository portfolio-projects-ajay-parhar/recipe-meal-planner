'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, Clock, Users, Plus } from 'lucide-react';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import type { RecipeCardData } from '@/types/recipe';

interface RecipeCardProps {
  recipe: RecipeCardData;
  onAddToMealPlan?: (recipeId: number) => void;
}

export default function RecipeCard({
  recipe,
  onAddToMealPlan,
}: RecipeCardProps) {
  const { data: session } = useSession();
  const { toggleFavorite, isPending } = useFavoriteToggle();
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite ?? false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) return;

    const newState = await toggleFavorite(recipe.id, isFavorite);
    setIsFavorite(newState);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col dark:bg-gray-900 dark:border-gray-800">
      {/* Image */}
      <Link href={`/recipes/${recipe.id}`} className="relative block">
        <div className="aspect-video relative overflow-hidden bg-gray-100">
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Diet Tags Overlay */}
        {recipe.diets.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
            {recipe.diets.slice(0, 2).map((diet) => (
              <span
                key={diet}
                className="bg-emerald-600/90 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm"
              >
                {diet}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors mb-2 dark:text-gray-100 dark:group-hover:text-emerald-400">
            {recipe.title}
          </h3>
        </Link>

        <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto dark:text-gray-400">
          {recipe.readyInMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.readyInMinutes}m
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {recipe.servings}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {session?.user && (
            <button
              onClick={handleToggleFavorite}
              disabled={isPending(recipe.id)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
              />
            </button>
          )}

          {onAddToMealPlan && session?.user && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToMealPlan(recipe.id);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              aria-label="Add to meal plan"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
