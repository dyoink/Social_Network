import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  totalCount, 
  onPageChange 
}) => {
  if (totalPages <= 1) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      onPageChange(value);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-outline-variant/10 gap-4">
      <p className="text-sm text-outline">
        Trang <span className="font-bold text-on-surface">{currentPage}</span> / {totalPages} ({totalCount} kết quả)
      </p>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1} 
            onClick={() => onPageChange(currentPage - 1)} 
            className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-40 transition-colors"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => onPageChange(currentPage + 1)} 
            className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-40 transition-colors"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-outline-variant/30 mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-2">
          <label htmlFor="goto-page" className="text-xs text-outline whitespace-nowrap">Đến trang:</label>
          <input
            id="goto-page"
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={handleInputChange}
            className="w-16 px-2 py-1 text-center border border-outline-variant/30 rounded-lg text-sm bg-surface-container-low text-on-surface focus:outline-none focus:border-primary/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
    </div>
  );
};

export default Pagination;
