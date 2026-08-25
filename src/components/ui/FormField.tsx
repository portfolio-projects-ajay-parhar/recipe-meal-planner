'use client';

import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  /** Small helper text rendered below the control. */
  hint?: string;
  /** Error message rendered below the control in red. */
  error?: string;
  labelSize?: 'xs' | 'sm';
  className?: string;
  children: React.ReactNode;
}

const labelSizeClasses = {
  sm: 'text-sm text-gray-700 dark:text-gray-300',
  xs: 'text-xs text-gray-600 dark:text-gray-400',
};

export default function FormField({
  label,
  htmlFor,
  hint,
  error,
  labelSize = 'sm',
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className={cn('block font-medium mb-1', labelSizeClasses[labelSize])}
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}