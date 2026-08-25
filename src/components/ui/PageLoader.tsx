import { cn } from '@/lib/utils';
import Spinner from './Spinner';

export interface PageLoaderProps {
  className?: string;
}

/** Full-page centered loading indicator used while data is fetching. */
export default function PageLoader({ className }: PageLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center py-20', className)}>
      <Spinner />
    </div>
  );
}