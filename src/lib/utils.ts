import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, resolving conflicts
 * (last class wins) and dropping falsy values.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}