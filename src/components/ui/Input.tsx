'use client';

import { cn } from '@/lib/utils';

type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'> {
  /** Visual size of the field. Named `inputSize` to avoid clashing
   * with the native HTML `size` attribute. */
  inputSize?: InputSize;
  /** Element rendered inside the field on the left (e.g. a search icon). */
  leadingIcon?: React.ReactNode;
  /** Element rendered inside the field on the right (e.g. a spinner). */
  trailingElement?: React.ReactNode;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-3 py-2 rounded-lg',
  lg: 'px-4 py-3 text-lg rounded-xl shadow-sm',
};

const baseClasses =
  'w-full border border-gray-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-shadow placeholder:text-gray-400 disabled:opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:placeholder:text-gray-500';

export default function Input({
  inputSize = 'md',
  leadingIcon,
  trailingElement,
  className,
  ...props
}: InputProps) {
  const hasOverlay = Boolean(leadingIcon || trailingElement);

  const field = (
    <input
      className={cn(
        baseClasses,
        sizeClasses[inputSize],
        leadingIcon && (inputSize === 'lg' ? 'pl-12' : 'pl-10'),
        trailingElement && (inputSize === 'lg' ? 'pr-12' : 'pr-10'),
        className
      )}
      {...props}
    />
  );

  if (!hasOverlay) return field;

  return (
    <div className="relative w-full">
      {leadingIcon && (
        <span
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none',
            inputSize === 'lg' ? '[&>*]:w-5 [&>*]:h-5' : '[&>*]:w-4 [&>*]:h-4'
          )}
        >
          {leadingIcon}
        </span>
      )}
      {field}
      {trailingElement && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {trailingElement}
        </span>
      )}
    </div>
  );
}