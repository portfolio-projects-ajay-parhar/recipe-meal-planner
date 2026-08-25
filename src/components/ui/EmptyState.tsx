import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional call-to-action rendered below the description. */
  action?: React.ReactNode;
  /** Wraps the state in a white card (used on list pages). */
  bordered?: boolean;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bordered = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-16',
        bordered &&
          'bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800',
        className
      )}
    >
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4 dark:text-gray-600" />
      <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}