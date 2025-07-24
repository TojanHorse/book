import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  authors: Array<{
    name: string;
    birth_year?: number;
    death_year?: number;
  }>;
  subjects: string[];
  languages: string[];
  formats: Record<string, string>;
  summaries?: string[];
}

interface BookContentProps {
  book: Book | null;
  content: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const BookContent: React.FC<BookContentProps> = ({ 
  book, 
  content, 
  currentPage, 
  onPageChange 
}) => {
  const [isPageTurning, setIsPageTurning] = useState(false);

  // Split content into pages (roughly 1000 characters per page)
  const pages = useMemo(() => {
    if (!content) return [];
    
    const wordsPerPage = 400;
    const words = content.split(/\s+/);
    const pageArray = [];
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage);
      pageArray.push(pageWords.join(' '));
    }
    
    return pageArray.length > 0 ? pageArray : [content];
  }, [content]);

  const totalPages = pages.length;

  const handlePageTurn = (direction: 'next' | 'prev') => {
    if (isPageTurning) return;

    setIsPageTurning(true);
    
    setTimeout(() => {
      if (direction === 'next' && currentPage < totalPages - 1) {
        onPageChange(currentPage + 1);
      } else if (direction === 'prev' && currentPage > 0) {
        onPageChange(currentPage - 1);
      }
      setIsPageTurning(false);
    }, 300);
  };

  if (!book || currentPage === 0) {
    return (
      <div className="book-page bg-white rounded-lg p-8 shadow-lg">
        <div className="text-center text-amber-700">
          <BookOpen className="w-16 h-16 mx-auto mb-4" />
          <p className="book-font text-lg">
            {!book ? 'Loading book...' : 'Click the book cover to start reading'}
          </p>
        </div>
      </div>
    );
  }

  const currentPageContent = pages[currentPage - 1] || '';

  return (
    <div className="relative">
      <div className={`book-page bg-white rounded-lg p-8 shadow-lg min-h-[600px] ${isPageTurning ? 'page-turning' : ''}`}>
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="title-font text-xl font-bold text-gray-800 mb-2">
            {book.title}
          </h2>
          <p className="book-font text-sm text-gray-600">
            by {book.authors.map(a => a.name).join(', ')}
          </p>
        </div>
        
        {/* Content */}
        <div className="prose prose-amber max-w-none">
          <div className="book-font text-gray-800 leading-relaxed text-justify">
            {currentPageContent.split('\n').map((paragraph, index) => (
              paragraph.trim() ? (
                <p key={index} className="mb-4">
                  {paragraph.trim()}
                </p>
              ) : (
                <div key={index} className="mb-4"></div>
              )
            ))}
          </div>
        </div>
        
        {/* Page Footer */}
        <div className="absolute bottom-4 left-8 right-8">
          <div className="flex justify-between items-center border-t border-gray-200 pt-4">
            <button
              onClick={() => handlePageTurn('prev')}
              disabled={currentPage <= 1 || isPageTurning}
              className="flex items-center space-x-2 px-4 py-2 text-amber-700 hover:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="book-font text-sm">Previous</span>
            </button>
            
            <div className="text-center">
              <span className="book-font text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <button
              onClick={() => handlePageTurn('next')}
              disabled={currentPage >= totalPages || isPageTurning}
              className="flex items-center space-x-2 px-4 py-2 text-amber-700 hover:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="book-font text-sm">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookContent;