import React from 'react';
import { MessageCircle, Users, Shield, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  username: string;
  onStartChat: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ username, onStartChat }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-8">
          <MessageCircle className="w-20 h-20 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, {username}!
          </h1>
          <p className="text-gray-600">
            Your secure messaging space is ready. Start a conversation to begin.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">End-to-End Security</h3>
              <p className="text-sm text-gray-600">Your conversations are private and secure</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Real-time Messaging</h3>
              <p className="text-sm text-gray-600">Instant delivery with typing indicators</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">File Sharing</h3>
              <p className="text-sm text-gray-600">Share images, videos, and documents</p>
            </div>
          </div>
        </div>

        <button
          onClick={onStartChat}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start Your First Chat
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Search for users by their unique ID to begin messaging
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;