import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  user: any;
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg hover:bg-opacity-100 transition-all"
        >
          <User className="w-5 h-5 text-amber-700" />
          <span className="book-font text-sm text-amber-900">{user?.username}</span>
          <ChevronDown className={`w-4 h-4 text-amber-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="book-font text-sm font-medium text-gray-800">{user?.username}</p>
              <p className="book-font text-xs text-gray-600">{user?.email}</p>
              <p className="book-font text-xs text-amber-600">ID: {user?.uniqueAppId}</p>
            </div>
            
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