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
  
  // Debug logging
  console.log('BookContent - currentPage:', currentPage, 'totalPages:', totalPages, 'pages:', pages.length);

  const handlePageTurn = (direction: 'next' | 'prev') => {
    if (isPageTurning) return;
    
    console.log('handlePageTurn called:', direction, 'currentPage:', currentPage, 'totalPages:', totalPages);

    setIsPageTurning(true);
    
    setTimeout(() => {
      if (direction === 'next' && currentPage < totalPages) {
        console.log('Going to next page:', currentPage + 1);
        onPageChange(currentPage + 1);
      } else if (direction === 'prev' && currentPage > 1) {
        console.log('Going to previous page:', currentPage - 1);
        onPageChange(currentPage - 1);
      } else {
        console.log('Page turn blocked - direction:', direction, 'currentPage:', currentPage, 'totalPages:', totalPages);
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
      <div className={`book-page bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-lg min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] ${isPageTurning ? 'page-turning' : ''}`}>
        {/* Header */}
        <div className="border-b border-gray-200 pb-3 sm:pb-4 mb-4 sm:mb-6">
          <h2 className="title-font text-lg sm:text-xl font-bold text-gray-800 mb-2">
            {book.title}
          </h2>
          <p className="book-font text-xs sm:text-sm text-gray-600">
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
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 lg:left-8 right-2 sm:right-4 lg:right-8">
          <div className="flex justify-between items-center border-t border-gray-200 pt-2 sm:pt-4">
            <button
              onClick={() => handlePageTurn('prev')}
              disabled={currentPage <= 1 || isPageTurning}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 text-amber-700 hover:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="book-font text-xs sm:text-sm hidden sm:inline">Previous</span>
              <span className="book-font text-xs sm:hidden">Prev</span>
            </button>
            
            <div className="text-center">
              <span className="book-font text-xs sm:text-sm text-gray-600">
                {currentPage}/{totalPages}
              </span>
            </div>
            
            <button
              onClick={() => handlePageTurn('next')}
              disabled={currentPage >= totalPages || isPageTurning}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 text-amber-700 hover:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="book-font text-xs sm:text-sm hidden sm:inline">Next</span>
              <span className="book-font text-xs sm:hidden">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookContent;