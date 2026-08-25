'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import {
  Search, Heart, Calendar, ShoppingCart,
  Menu, X, ChefHat, LogOut, User
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/search', label: 'Search', icon: Search },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/meal-plans', label: 'Meal Plans', icon: Calendar },
    { href: '/shopping-lists', label: 'Shopping', icon: ShoppingCart },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-emerald-600 font-bold text-xl"
          >
            <ChefHat className="w-7 h-7" />
            <span className="hidden sm:inline">MealPlanner</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors text-sm font-medium dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  aria-label="Sign out"
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors dark:text-gray-400 dark:hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-emerald-400"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="hidden md:flex items-center">
            <ThemeToggle />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors dark:text-gray-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between dark:border-gray-800">
              {session?.user ? (
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-3 py-2 text-red-600 w-full rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center gap-3 px-3 py-2 text-emerald-600 rounded-lg hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  Sign In
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
