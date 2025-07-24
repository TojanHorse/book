import React from 'react';
import { Message, User } from './ChatApp';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isOtherUserTyping: boolean;
  otherUser?: User;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  isOtherUserTyping,
  otherUser
}) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const showAvatar = !isOwnMessage && (
            index === 0 || 
            messages[index - 1].senderId !== message.senderId
          );

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isOwnMessage={isOwnMessage}
              showAvatar={showAvatar}
              senderName={isOwnMessage ? 'You' : otherUser?.username || 'Unknown'}
            />
          );
        })
      )}

      {isOtherUserTyping && (
        <TypingIndicator username={otherUser?.username || 'Someone'} />
      )}
    </div>
  );
};

export default MessageList;