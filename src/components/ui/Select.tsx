'use client';

import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.ComponentProps<'select'> {
  options: readonly SelectOption[];
  /** Shown as the first, empty-valued option when provided. */
  placeholder?: string;
}

export default function Select({
  options,
  placeholder,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(
        'w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-shadow disabled:opacity-50 dark:bg-gray-900 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {children}
    </select>
  );
}