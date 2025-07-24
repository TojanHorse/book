import React, { useState, useEffect } from 'react';
import { User } from './ChatApp';
import { Search, X, User as UserIcon, MessageCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface UserSearchProps {
  onSelectUser: (user: User) => void;
  onClose: () => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const searchUsers = async () => {
    try {
      setIsSearching(true);
      const response = await axios.get(`/chat/users/search/${encodeURIComponent(searchTerm)}`);
      setSearchResults(response.data.users);
    } catch (error) {
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Never';
    
    const date = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Start New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter at least 2 characters to search
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isSearching ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Searching...</p>
            </div>
          ) : searchTerm.trim().length < 2 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Enter a username or ID to search for users</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No users found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((user) => (
                <button
                  key={user.uniqueAppId}
                  onClick={() => onSelectUser(user)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">
                        {user.username}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {user.uniqueAppId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last active: {formatLastActive(user.lastActive)}
                      </p>
                    </div>
                    
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;