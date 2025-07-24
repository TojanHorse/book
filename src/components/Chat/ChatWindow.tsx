import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Conversation, Message } from './ChatApp';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import axios from 'axios';

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  onConversationUpdate: (conversation: Conversation) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUserId,
  onConversationUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const { joinConversation, typingUsers } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if someone is typing in this conversation
  const isOtherUserTyping = typingUsers.some(
    user => user.conversationId === conversation._id && user.userId !== currentUserId
  );

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation._id !== 'temp') {
      loadMessages();
      joinConversation(conversation._id);
    } else {
      setMessages([]);
      setIsLoading(false);
    }
  }, [conversation._id]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const { message, conversation: updatedConversation } = event.detail;
      
      if (message.conversationId === conversation._id) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
        
        // Update conversation in parent
        if (updatedConversation) {
          onConversationUpdate(updatedConversation);
        }
      }
    };

    const handleMessageSent = (event: CustomEvent) => {
      const { message, tempId } = event.detail;
      
      setMessages(prev => {
        // Replace temporary message or add new one
        if (tempId) {
          return prev.map(m => m._id === tempId ? message : m);
        } else {
          return prev.some(m => m._id === message._id) ? prev : [...prev, message];
        }
      });
    };

    window.addEventListener('newMessage', handleNewMessage as EventListener);
    window.addEventListener('messageSent', handleMessageSent as EventListener);

    return () => {
      window.removeEventListener('newMessage', handleNewMessage as EventListener);
      window.removeEventListener('messageSent', handleMessageSent as EventListener);
    };
  }, [conversation._id, onConversationUpdate]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherUserTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/chat/conversations/${conversation._id}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (content: string, messageType: string = 'text', fileData?: any) => {
    if (!conversation.otherParticipant) return;

    // Create temporary message for immediate UI feedback
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: conversation._id,
      senderId: currentUserId,
      messageType: messageType as any,
      content,
      fileUrl: fileData?.url,
      fileName: fileData?.fileName,
      fileType: fileData?.fileType,
      fileSize: fileData?.fileSize,
      createdAt: new Date().toISOString()
    };

    // Add temporary message to UI
    if (conversation._id !== 'temp') {
      setMessages(prev => [...prev, tempMessage]);
    }

    // Send via socket
    useSocket().sendMessage(
      conversation.otherParticipant.uniqueAppId,
      content,
      messageType,
      fileData,
      tempMessage._id
    );
  };

  const handleTypingStart = () => {
    if (!isTyping && conversation._id !== 'temp') {
      setIsTyping(true);
      useSocket().startTyping(conversation._id);
    }
  };

  const handleTypingStop = () => {
    if (isTyping && conversation._id !== 'temp') {
      setIsTyping(false);
      useSocket().stopTyping(conversation._id);
    }
  };

  if (isLoading && conversation._id !== 'temp') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader 
        conversation={conversation}
        currentUserId={currentUserId}
      />
      
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isOtherUserTyping={isOtherUserTyping}
          otherUser={conversation.otherParticipant}
        />
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </div>
  );
};

export default ChatWindow;