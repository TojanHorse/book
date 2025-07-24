import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import UserSearch from './UserSearch';
import WelcomeScreen from './WelcomeScreen';
import axios from 'axios';

export interface User {
  uniqueAppId: string;
  username: string;
  lastActive?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  messageType: 'text' | 'image' | 'video' | 'document';
  content: string;
  fileUrl?: string;
  filePublicId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  isEdited?: boolean;
}

export interface Conversation {
  _id: string;
  participants: string[];
  type?: string;
  lastMessageAt: string;
  lastMessage?: {
    content: string;
    senderId: string;
    messageType: string;
  };
  otherParticipant?: User;
}

const ChatApp: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await axios.get('/chat/conversations');
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleStartChat = (targetUser: User) => {
    // Find existing conversation or create a placeholder
    const existingConversation = conversations.find(conv => 
      conv.otherParticipant?.uniqueAppId === targetUser.uniqueAppId
    );

    if (existingConversation) {
      setSelectedConversation(existingConversation);
    } else {
      // Create a temporary conversation object
      const tempConversation: Conversation = {
        _id: 'temp',
        participants: [user!.uniqueAppId, targetUser.uniqueAppId],
        lastMessageAt: new Date().toISOString(),
        otherParticipant: targetUser
      };
      setSelectedConversation(tempConversation);
    }
    
    setShowUserSearch(false);
  };

  const handleConversationUpdate = (conversation: Conversation) => {
    setConversations(prev => {
      const index = prev.findIndex(c => c._id === conversation._id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = conversation;
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      } else {
        return [conversation, ...prev];
      }
    });
  };

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={setSelectedConversation}
          onNewChat={() => setShowUserSearch(true)}
          currentUserId={user?.uniqueAppId || ''}
          isConnected={isConnected}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUserId={user?.uniqueAppId || ''}
            onConversationUpdate={handleConversationUpdate}
          />
        ) : (
          <WelcomeScreen 
            username={user?.username || ''}
            onStartChat={() => setShowUserSearch(true)}
          />
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch
          onSelectUser={handleStartChat}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </div>
  );
};

export default ChatApp;