import React from 'react';
import { Message } from './ChatApp';
import { Download, FileText, Image, Video, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  senderName: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar,
  senderName
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const getFileIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderFileContent = () => {
    if (!message.fileUrl) return null;

    switch (message.messageType) {
      case 'image':
        return (
          <div className="mt-2">
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Image'}
              className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
          </div>
        );

      case 'video':
        return (
          <div className="mt-2">
            <video
              src={message.fileUrl}
              controls
              className="max-w-xs max-h-64 rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'document':
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              {getFileIcon(message.messageType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {message.fileName || 'Document'}
                </p>
                {message.fileSize && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(message.fileSize)}
                  </p>
                )}
              </div>
              <a
                href={message.fileUrl}
                download={message.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} message-enter`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isOwnMessage && (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        )}
        
        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          } ${showAvatar || isOwnMessage ? '' : 'ml-10'}`}
        >
          {/* Sender name for group chats */}
          {!isOwnMessage && showAvatar && (
            <p className="text-xs text-gray-500 mb-1">{senderName}</p>
          )}
          
          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          
          {/* File content */}
          {renderFileContent()}
          
          {/* Timestamp */}
          <p className={`text-xs mt-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(message.createdAt)}
            {message.isEdited && <span className="ml-1">(edited)</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;