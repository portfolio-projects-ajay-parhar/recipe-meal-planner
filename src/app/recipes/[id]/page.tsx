import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { spoonacular } from '@/lib/spoonacular';
import RecipeDetail from './RecipeDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const recipeId = parseInt(id);

  if (isNaN(recipeId)) {
    return { title: 'Recipe Not Found' };
  }

  try {
    const recipe = await spoonacular.getRecipeById(recipeId);
    return {
      title: `${recipe.title} | Recipe & Meal Planner`,
      description: recipe.summary?.replace(/<[^>]*>/g, '').slice(0, 160),
    };
  } catch {
    return { title: 'Recipe Not Found' };
  }
}

export default async function RecipePage({ params }: PageProps) {
  const { id } = await params;
  const recipeId = parseInt(id);

  if (isNaN(recipeId)) {
    notFound();
  }

  try {
    const recipe = await spoonacular.getRecipeById(recipeId);
    return <RecipeDetail recipe={recipe} />;
  } catch (error) {
    console.error('Failed to load recipe:', error);
    notFound();
  }
}
