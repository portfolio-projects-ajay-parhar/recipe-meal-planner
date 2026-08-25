'use client';

import { cn } from '@/lib/utils';

type IconButtonVariant = 'outline' | 'ghost';
type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends React.ComponentProps<'button'> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Required for accessibility since the button has no visible text. */
  'aria-label': string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  outline:
    'border border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:active:bg-gray-700',
  ghost:
    'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
};

export default function IconButton({
  variant = 'outline',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}