import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation } from './ChatApp';
import { ArrowLeft, User, MoreVertical, UserX, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, currentUserId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleDeleteConversation = async () => {
    try {
      await axios.delete(`/chat/conversations/${conversation._id}`);
      toast.success('Conversation deleted');
      navigate('/chat');
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
    setShowMenu(false);
  };

  const handleBlockUser = async () => {
    if (!conversation.otherParticipant) return;

    try {
      await axios.post(`/chat/users/${conversation.otherParticipant.uniqueAppId}/block`, {
        action: 'block'
      });
      toast.success('User blocked');
      navigate('/chat');
    } catch (error) {
      toast.error('Failed to block user');
    }
    setShowMenu(false);
  };

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button  
            onClick={() => navigate('/chat')}
            className="p-1 text-gray-600 hover:text-gray-800 lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-800">
              {conversation.otherParticipant?.username || 'Unknown User'}
            </h2>
            <p className="text-sm text-gray-500">
              ID: {conversation.otherParticipant?.uniqueAppId || 'Unknown'}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              <button
                onClick={handleBlockUser}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <UserX className="w-4 h-4" />
                <span>Block User</span>
              </button>
              
              <button
                onClick={handleDeleteConversation}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Conversation</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;