import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface Message {
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

interface Conversation {
  _id: string;
  participants: string[];
  type?: string;
  lastMessageAt: string;
  lastMessage?: {
    content: string;
    senderId: string;
    messageType: string;
  };
  otherParticipant?: {
    uniqueAppId: string;
    username: string;
    lastActive?: string;
  };
}

interface TypingUser {
  userId: string;
  username: string;
  conversationId: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (recipientId: string, content: string, messageType?: string, fileData?: any, tempId?: string) => void;
  joinConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  onlineUsers: Set<string>;
  typingUsers: TypingUser[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (user && token) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: false
      });

      setSocket(newSocket);

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (error.message.includes('Authentication')) {
          toast.error('Chat authentication failed. Please refresh the page.');
        } else {
          toast.error('Failed to connect to chat server. Retrying...');
        }
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to chat server after', attemptNumber, 'attempts');
        toast.success('Chat reconnected');
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Failed to reconnect to chat server');
        toast.error('Chat connection failed. Please refresh the page.');
      });

      // User status events
      newSocket.on('user_online', (data) => {
        setOnlineUsers(prev => new Set([...Array.from(prev), data.userId]));
      });

      newSocket.on('user_offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      // Typing events
      newSocket.on('user_typing', (data: TypingUser) => {
        setTypingUsers(prev => {
          // Remove any existing typing indicator for this user in this conversation
          const filtered = prev.filter(user => 
            !(user.userId === data.userId && user.conversationId === data.conversationId)
          );
          return [...filtered, data];
        });
      });

      newSocket.on('user_stopped_typing', (data) => {
        setTypingUsers(prev => 
          prev.filter(user => 
            !(user.userId === data.userId && user.conversationId === data.conversationId)
          )
        );
      });

      // Message events
      newSocket.on('new_message', (data) => {
        // Handle new message (this will be used by chat components)
        window.dispatchEvent(new CustomEvent('newMessage', { detail: data }));
      });

      newSocket.on('new_conversation_message', (data) => {
        // Handle new message in conversation list
        window.dispatchEvent(new CustomEvent('newConversationMessage', { detail: data }));
        
        // Show notification if not in current conversation
        if (document.hidden || !window.location.pathname.includes('/chat')) {
          toast.success(`New message from ${data.sender.username}`);
        }
      });

      newSocket.on('message_sent', (data) => {
        // Handle message confirmation
        window.dispatchEvent(new CustomEvent('messageSent', { detail: data }));
      });

      newSocket.on('joined_conversation', (data) => {
        console.log('Joined conversation:', data.conversationId);
      });

      newSocket.on('error', (data) => {
        toast.error(data.message || 'An error occurred');
      });

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
        setTypingUsers([]);
      };
    }
  }, [user, token]);

  const sendMessage = (
    recipientId: string, 
    content: string, 
    messageType: string = 'text', 
    fileData?: any,
    tempId?: string
  ) => {
    if (socket && isConnected && user) {
      console.log('Sending message:', { recipientId, content: content.substring(0, 50), messageType });
      socket.emit('send_message', {
        senderId: user.uniqueAppId,
        recipientId,
        content,
        messageType,
        fileData,
        tempId
      });
    } else {
      console.error('Cannot send message - socket not connected or user not authenticated', {
        socket: !!socket,
        isConnected,
        user: !!user
      });
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      console.log('Joining conversation:', conversationId);
      socket.emit('join_conversation', { conversationId });
    }
  };

  const startTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    startTyping,
    stopTyping,
    onlineUsers,
    typingUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};