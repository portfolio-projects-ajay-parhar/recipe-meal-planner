import Link from 'next/link';
import { Search, Calendar, ShoppingCart, Heart, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Search,
      title: 'Recipe Search',
      description: 'Search thousands of recipes with filters for cuisine, diet, and more.',
      href: '/search',
    },
    {
      icon: Heart,
      title: 'Save Favorites',
      description: 'Bookmark your favorite recipes for quick access later.',
      href: '/favorites',
    },
    {
      icon: Calendar,
      title: 'Meal Planning',
      description: 'Plan your weekly meals with a drag-and-drop calendar.',
      href: '/meal-plans',
    },
    {
      icon: ShoppingCart,
      title: 'Shopping Lists',
      description: 'Auto-generate shopping lists from your meal plans.',
      href: '/shopping-lists',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 dark:text-gray-100">
          Plan Your Meals,
          <br />
          <span className="text-emerald-600 dark:text-emerald-400">Simplify Your Life</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 dark:text-gray-400">
          Search recipes, plan your weekly meals, and generate shopping lists
          — all in one place.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/25"
        >
          Start Searching
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, description, href }) => (
          <Link
            key={title}
            href={href}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-200 transition-all group dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-800"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors dark:bg-emerald-900/40 dark:group-hover:bg-emerald-900/60">
              <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

