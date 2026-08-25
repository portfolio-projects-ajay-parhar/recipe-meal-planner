'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from './IconButton';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const pages: (number | '...')[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <IconButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </IconButton>

      {getVisiblePages().map((page, idx) =>
        page === '...' ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-3 py-2 text-gray-400 text-sm"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-emerald-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {page}
          </button>
        )
      )}

      <IconButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </IconButton>
    </div>
  );
}
