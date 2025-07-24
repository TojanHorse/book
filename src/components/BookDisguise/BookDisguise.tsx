import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BookCover from './BookCover';
import BookContent from './BookContent';
import SecretTrigger from './SecretTrigger';
import UserMenu from './UserMenu';

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

const BookDisguise: React.FC = () => {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [bookContent, setBookContent] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [secretProgress, setSecretProgress] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch random book from Gutendex API
  useEffect(() => {
    const fetchRandomBook = async () => {
      try {
        setIsLoading(true);
        
        // First, get a random page of books
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const response = await fetch(`https://gutendex.org/books/?page=${randomPage}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          // Pick a random book from the results
          const randomBook = data.results[Math.floor(Math.random() * data.results.length)];
          setCurrentBook(randomBook);
          
          // Try to fetch the book content
          await fetchBookContent(randomBook);
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        // Fallback book data
        setCurrentBook({
          id: 1,
          title: "Pride and Prejudice",
          authors: [{ name: "Jane Austen", birth_year: 1775, death_year: 1817 }],
          subjects: ["England -- Social life and customs -- 19th century -- Fiction"],
          languages: ["en"],
          formats: {},
          summaries: ["A classic tale of love, society, and personal growth in Regency England."]
        });
        setBookContent("Welcome to this classic tale. The actual content would be displayed here when fetched from Project Gutenberg...");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRandomBook();
  }, []);

  const fetchBookContent = async (book: Book) => {
    try {
      // Look for plain text format
      const textUrl = book.formats['text/plain'] || 
                     book.formats['text/plain; charset=utf-8'] ||
                     book.formats['text/plain; charset=us-ascii'];
      
      if (textUrl) {
        const response = await fetch(textUrl);
        const text = await response.text();
        
        // Clean up the text and take first part
        const cleanedText = text
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .substring(0, 50000); // Limit content size
        
        setBookContent(cleanedText);
      } else {
        // Fallback content
        setBookContent(`${book.title}\n\nBy ${book.authors.map(a => a.name).join(', ')}\n\n${book.summaries?.[0] || 'This is a classic work of literature from Project Gutenberg. The full text would be available when accessed through the proper format.'}\n\nThis digital library provides access to thousands of free eBooks from Project Gutenberg, maintaining the legacy of great literature for future generations.`);
      }
    } catch (error) {
      console.error('Error fetching book content:', error);
      setBookContent("Content unavailable. Please try again later.");
    }
  };

  const handleSecretClick = () => {
    setSecretProgress(prev => {
      const newProgress = prev + 1;
      if (newProgress >= 5) {
        // Secret revealed! Navigate to chat
        navigate('/chat');
      }
      return newProgress;
    });
  };

  const resetSecretProgress = () => {
    setSecretProgress(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700 book-font text-lg">Loading your book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      {/* User Menu */}
      <UserMenu user={user} />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Book Cover */}
          <div className="lg:w-1/3">
            <BookCover 
              book={currentBook}
              onPageTurn={() => setCurrentPage(1)}
            />
          </div>
          
          {/* Book Content */}
          <div className="lg:w-2/3">
            <BookContent 
              book={currentBook}
              content={bookContent}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
        
        {/* Secret Trigger */}
        <SecretTrigger 
          progress={secretProgress}
          onSecretClick={handleSecretClick}
          onReset={resetSecretProgress}
        />
      </div>
    </div>
  );
};

export default BookDisguise;