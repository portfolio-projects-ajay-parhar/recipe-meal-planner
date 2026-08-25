'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Clock, Users, Heart, ExternalLink, ChefHat,
  ShoppingCart, Check
} from 'lucide-react';
import { useFavoriteToggle } from '@/hooks/useFavorites';
import type { SpoonacularRecipe, ExtendedIngredient } from '@/types/recipe';

interface RecipeDetailProps {
  recipe: SpoonacularRecipe & { isFavorite?: boolean };
}

export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  const { data: session } = useSession();
  const { toggleFavorite, isPending } = useFavoriteToggle();
  const [isFavorite, setIsFavorite] = useState(
    recipe.isFavorite ?? false
  );
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const handleFavorite = async () => {
    if (!session?.user) return;
    const newState = await toggleFavorite(recipe.id, isFavorite);
    setIsFavorite(newState);
  };

  // Extract key nutrients
  const calories = recipe.nutrition?.nutrients?.find(
    (n) => n.name === 'Calories'
  );
  const protein = recipe.nutrition?.nutrients?.find(
    (n) => n.name === 'Protein'
  );
  const carbs = recipe.nutrition?.nutrients?.find(
    (n) => n.name === 'Carbohydrates'
  );
  const fat = recipe.nutrition?.nutrients?.find(
    (n) => n.name === 'Fat'
  );

  // Parse instructions into steps
  const instructionSteps = recipe.instructions
    ?.replace(/<ol>|<\/ol>|<ul>|<\/ul>/gi, '')
    .split(/<li>|<\/li>/gi)
    .map((step) => step.replace(/<[^>]*>/g, '').trim())
    .filter((step) => step.length > 0)
    ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative">
        {recipe.image && (
          <div className="aspect-[21/9] relative rounded-2xl overflow-hidden">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        )}
      </div>

      {/* Title & Meta */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {recipe.title}
          </h1>
          {session?.user && (
            <button
              onClick={handleFavorite}
              disabled={isPending(recipe.id)}
              className={`p-3 rounded-xl transition-colors shrink-0 ${
                isFavorite
                  ? 'bg-red-50 text-red-500'
                  : 'bg-gray-100 text-gray-400 hover:text-red-500 dark:bg-gray-800'
              }`}
              aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
            >
              <Heart
                className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {recipe.diets?.map((diet) => (
            <span
              key={diet}
              className="bg-emerald-100 text-emerald-700 text-sm px-3 py-1 rounded-full dark:bg-emerald-900/40 dark:text-emerald-300"
            >
              {diet}
            </span>
          ))}
          {recipe.cuisines?.map((cuisine) => (
            <span
              key={cuisine}
              className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full dark:bg-blue-950/50 dark:text-blue-300"
            >
              {cuisine}
            </span>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-6 mt-4 text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>{recipe.readyInMinutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>{recipe.servings} servings</span>
          </div>
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-600 hover:underline"
            >
              <ExternalLink className="w-5 h-5" />
              Source
            </a>
          )}
        </div>
      </div>

      {/* Nutrition Card */}
      {calories && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 mb-4 dark:text-gray-100">
            Nutrition per Serving
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Calories', data: calories },
              { label: 'Protein', data: protein },
              { label: 'Carbs', data: carbs },
              { label: 'Fat', data: fat },
            ].map(({ label, data }) =>
              data ? (
                <div
                  key={label}
                  className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-800"
                >
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(data.amount)}
                    <span className="text-sm font-normal text-gray-500 ml-1 dark:text-gray-400">
                      {data.unit}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Ingredients */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 dark:text-gray-100">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Ingredients
              </h2>
              {/* Serving Adjuster */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))
                  }
                  aria-label="Decrease servings"
                  className="w-7 h-7 rounded-full border border-gray-300 text-sm flex items-center justify-center hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  −
                </button>
                <span className="text-sm font-medium w-6 text-center">
                  {servingMultiplier}x
                </span>
                <button
                  onClick={() => setServingMultiplier(servingMultiplier + 0.5)}
                  aria-label="Increase servings"
                  className="w-7 h-7 rounded-full border border-gray-300 text-sm flex items-center justify-center hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  +
                </button>
              </div>
            </div>

            <ul className="space-y-2">
              {recipe.extendedIngredients?.map(
                (ing: ExtendedIngredient, idx: number) => (
                  <li
                    key={`${ing.id}-${idx}`}
                    className="flex items-start gap-2 text-sm text-gray-700 py-1 border-b border-gray-50 last:border-0 dark:text-gray-300 dark:border-gray-800"
                  >
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>
                      <span className="font-medium">
                        {Math.round(ing.amount * servingMultiplier * 10) / 10}
                        {ing.unit ? ` ${ing.unit}` : ''}
                      </span>{' '}
                      {ing.nameClean || ing.name}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-gray-900 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-6 dark:text-gray-100">
              <ChefHat className="w-5 h-5 text-emerald-600" />
              Instructions
            </h2>

            {instructionSteps.length > 0 ? (
              <ol className="space-y-4">
                {instructionSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span
                      className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0 dark:bg-emerald-900/40 dark:text-emerald-300"
                    >
                      {idx + 1}
                    </span>
                    <p className="text-gray-700 pt-1 leading-relaxed dark:text-gray-300">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <div
                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: recipe.instructions || 'No instructions available.',
                }}
              />
            )}
          </div>

          {/* Summary */}
          {recipe.summary && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6 dark:bg-gray-900 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 mb-3 dark:text-gray-100">About</h2>
              <div
                className="text-sm text-gray-600 prose prose-sm max-w-none prose-a:text-emerald-600 dark:text-gray-400"
                dangerouslySetInnerHTML={{ __html: recipe.summary }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
