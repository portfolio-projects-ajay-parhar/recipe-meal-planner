import { cn } from '@/lib/utils';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

export interface AlertProps {
  variant?: AlertVariant;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  success:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  warning:
    'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
};

export default function Alert({
  variant = 'info',
  className,
  children,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn('p-3 rounded-lg text-sm', variantClasses[variant], className)}
    >
      {children}
    </div>
  );
}