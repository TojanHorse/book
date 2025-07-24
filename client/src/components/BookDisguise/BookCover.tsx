import React, { useState } from 'react';
import { BookOpen, User, Calendar, Globe } from 'lucide-react';

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

interface BookCoverProps {
  book: Book | null;
  onPageTurn: () => void;
}

const BookCover: React.FC<BookCoverProps> = ({ book, onPageTurn }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!book) return null;

  const primaryAuthor = book.authors[0];
  const yearRange = primaryAuthor?.birth_year && primaryAuthor?.death_year 
    ? `${primaryAuthor.birth_year}-${primaryAuthor.death_year}`
    : '';

  return (
    <div className="relative">
      <div 
        className={`book-page bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg p-4 sm:p-6 lg:p-8 shadow-2xl transition-all duration-500 cursor-pointer page-turn ${isHovered ? 'transform hover:scale-105' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onPageTurn}
      >
        {/* Book spine effect */}
        <div className="book-spine"></div>
        
        {/* Cover Content */}
        <div className="text-center space-y-4 sm:space-y-6">
          {/* Book Icon */}
          <div className="flex justify-center">
            <BookOpen className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-amber-800" />
          </div>
          
          {/* Title */}
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl title-font font-bold text-amber-900 leading-tight">
            {book.title}
          </h1>
          
          {/* Author */}
          <div className="space-y-2">
            <div className="flex items-center justify-center text-amber-800">
              <User className="w-4 h-4 mr-2" />
              <span className="book-font text-lg">
                {book.authors.map(author => author.name).join(', ')}
              </span>
            </div>
            
            {yearRange && (
              <div className="flex items-center justify-center text-amber-700">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="book-font text-sm">{yearRange}</span>
              </div>
            )}
          </div>
          
          {/* Language */}
          <div className="flex items-center justify-center text-amber-700">
            <Globe className="w-4 h-4 mr-2" />
            <span className="book-font text-sm uppercase">
              {book.languages.join(', ')}
            </span>
          </div>
          
          {/* Summary */}
          {book.summaries && book.summaries[0] && (
            <div className="border-t border-amber-300 pt-4">
              <p className="book-font text-sm text-amber-800 leading-relaxed">
                {book.summaries[0].substring(0, 200)}
                {book.summaries[0].length > 200 ? '...' : ''}
              </p>
            </div>
          )}
          
          {/* Subjects/Categories */}
          {book.subjects.length > 0 && (
            <div className="border-t border-amber-300 pt-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {book.subjects.slice(0, 3).map((subject, index) => (
                  <span
                    key={index}
                    className="inline-block bg-amber-200 text-amber-800 px-2 py-1 rounded-full text-xs book-font"
                  >
                    {subject.split(' -- ')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Project Gutenberg ID */}
          <div className="border-t border-amber-300 pt-4">
            <p className="book-font text-xs text-amber-600">
              Project Gutenberg #{book.id}
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-2 h-16 bg-gradient-to-b from-amber-300 to-amber-500 rounded-full opacity-50"></div>
        <div className="absolute top-4 right-4 w-2 h-16 bg-gradient-to-b from-amber-300 to-amber-500 rounded-full opacity-50"></div>
        <div className="absolute bottom-4 left-4 w-16 h-2 bg-gradient-to-r from-amber-300 to-amber-500 rounded-full opacity-50"></div>
        <div className="absolute bottom-4 right-4 w-16 h-2 bg-gradient-to-r from-amber-300 to-amber-500 rounded-full opacity-50"></div>
      </div>
      
      {/* Hover instruction */}
      {isHovered && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <p className="book-font text-sm text-amber-700 animate-pulse">
            Click to open the book
          </p>
        </div>
      )}
    </div>
  );
};

export default BookCover;