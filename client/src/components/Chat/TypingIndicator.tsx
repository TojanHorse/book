import React from 'react';

interface TypingIndicatorProps {
  username: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ username }) => {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-xs">
        <div className="px-4 py-2 bg-gray-100 rounded-lg rounded-bl-sm">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{username} is typing</span>
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;