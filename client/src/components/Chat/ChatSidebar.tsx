import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Conversation } from './ChatApp';
import { MessageCircle, Plus, BookOpen, User, Wifi, WifiOff } from 'lucide-react';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
  onNewChat: () => void;
  currentUserId: string;
  isConnected: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversation,
  onConversationSelect,
  onNewChat,
  currentUserId,
  isConnected
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, messageType, senderId } = conversation.lastMessage;
    const isOwnMessage = senderId === currentUserId;
    const prefix = isOwnMessage ? 'You: ' : '';
    
    switch (messageType) {
      case 'image':
        return `${prefix}📷 Photo`;
      case 'video':
        return `${prefix}🎥 Video`;
      case 'document':
        return `${prefix}📄 Document`;
      default:
        return `${prefix}${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-800">Messages</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isConnected ? 'Online' : 'Offline'}</span>
            </div>
            
            <button
              onClick={() => navigate('/book')}
              className="p-2 text-gray-600 hover:text-amber-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Book"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">{user?.username}</p>
              <p className="text-xs text-gray-500">ID: {user?.uniqueAppId}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full mt-4 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new chat to begin messaging</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => onConversationSelect(conversation)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  selectedConversation?._id === conversation._id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800 text-sm truncate">
                        {conversation.otherParticipant?.username || 'Unknown User'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;