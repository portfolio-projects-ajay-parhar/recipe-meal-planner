'use client';

import { Moon, Sun } from 'lucide-react';
import IconButton from './IconButton';
import { useTheme } from '@/components/providers/ThemeProvider';

/** Light/dark switch for the navbar. Initial state comes from
 * localStorage or the OS preference (set before hydration). */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <IconButton
      variant="ghost"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </IconButton>
  );
}