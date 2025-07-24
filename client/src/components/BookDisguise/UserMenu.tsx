import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'wouter';
import { User, LogOut, Settings, ChevronDown, MessageCircle } from 'lucide-react';

interface UserMenuProps {
  user: any;
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleChatClick = () => {
    setLocation('/chat');
    setIsOpen(false);
  };

  const handleIconTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent menu from opening
    
    const newCount = tapCount + 1;
    console.log(`👆 Icon tapped ${newCount} times`);
    setTapCount(newCount);
    
    // Clear existing timeout
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
    }
    
    if (newCount >= 5) {
      // Trigger chat access after 5 taps
      console.log('🚀 Chat access unlocked via 5-tap trigger!');
      setLocation('/chat');
      setTapCount(0); // Reset counter
    } else {
      // Reset counter after 3 seconds of inactivity
      tapTimeout.current = setTimeout(() => {
        console.log('⏰ Tap counter reset');
        setTapCount(0);
      }, 3000);
    }
  };

  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
      <div className="relative">
        <div className="flex items-center relative">
          {/* Secret Tap Area - User Icon */}
          <button
            onClick={handleIconTap}
            className={`relative z-10 p-1 rounded-full transition-all duration-200 ${
              tapCount > 0 ? 'animate-pulse scale-110 bg-blue-50' : 'hover:bg-amber-50'
            }`}
            title={tapCount > 0 ? `Secret: ${tapCount}/5 taps to unlock chat` : 'Tap 5 times for secret access'}
          >
            <User className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
              tapCount > 0 ? 'text-blue-600' : 'text-amber-700'
            }`} />
            {tapCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                {tapCount}
              </div>
            )}
          </button>
          
          {/* Main Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 sm:space-x-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg pl-1 pr-2 sm:pr-4 py-1.5 sm:py-2 shadow-lg hover:bg-opacity-100 transition-all -ml-1"
          >
            <span className="book-font text-xs sm:text-sm text-amber-900 hidden sm:inline ml-2">{user?.username}</span>
            <span className="book-font text-xs text-amber-900 sm:hidden ml-2">{user?.username?.substring(0, 8)}</span>
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-amber-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="book-font text-sm font-medium text-gray-800">{user?.username}</p>
              <p className="book-font text-xs text-gray-600">{user?.email}</p>
              <p className="book-font text-xs text-amber-600">ID: {user?.uniqueAppId}</p>
            </div>
            
            <button
              onClick={handleChatClick}
              className="w-full text-left px-4 py-2 book-font text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open Chat</span>
            </button>
            
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-4 py-2 book-font text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 book-font text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;