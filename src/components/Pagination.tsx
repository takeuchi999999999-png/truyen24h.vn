import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || 
      i === totalPages || 
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push('...');
    }
  }

  const uniquePages = pages.filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-3 rounded-xl bg-surface border border-accent/10 text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div className="flex items-center gap-2">
        {uniquePages.map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`size-12 rounded-xl font-black text-sm transition-all ${
                currentPage === page 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                  : 'bg-surface border border-accent/10 text-text-main hover:bg-background-light'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-2 text-muted font-bold">...</span>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-3 rounded-xl bg-surface border border-accent/10 text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
