import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface SecretTriggerProps {
  progress: number;
  onSecretClick: () => void;
  onReset: () => void;
}

const SecretTrigger: React.FC<SecretTriggerProps> = ({ 
  progress, 
  onSecretClick, 
  onReset 
}) => {
  const [showHint, setShowHint] = useState(false);

  // Auto-reset progress after inactivity
  useEffect(() => {
    if (progress > 0) {
      const timeout = setTimeout(() => {
        onReset();
      }, 5000); // Reset after 5 seconds of inactivity

      return () => clearTimeout(timeout);
    }
  }, [progress, onReset]);

  // Show hint after some progress
  useEffect(() => {
    if (progress >= 2) {
      setShowHint(true);
      const timeout = setTimeout(() => {
        setShowHint(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [progress]);

  return (
    <>
      {/* Main secret trigger - bottom right corner */}
      <div 
        className={`fixed bottom-4 right-4 w-8 h-8 secret-trigger ${progress > 0 ? 'active' : ''}`}
        onClick={onSecretClick}
        style={{
          opacity: progress > 0 ? Math.min(0.1 + (progress * 0.1), 0.5) : 0,
        }}
      >
        <div className="w-full h-full bg-amber-400 rounded-full cursor-pointer"></div>
      </div>

      {/* Progress indicator */}
      {progress > 0 && (
        <div className="fixed bottom-16 right-4 text-right">
          <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < progress ? 'bg-amber-400' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span>{progress}/5</span>
            </div>
          </div>
        </div>
      )}

      {/* Hint message */}
      {showHint && (
        <div className="fixed bottom-28 right-4 text-right">
          <div className="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg shadow-lg max-w-xs animate-pulse">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm book-font">
                Keep clicking... something special awaits
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden triggers scattered around the page */}
      <div 
        className="fixed top-20 left-10 w-6 h-6 secret-trigger"
        onClick={onSecretClick}
      >
        <div className="w-full h-full rounded-full cursor-pointer"></div>
      </div>

      <div 
        className="fixed top-1/2 left-4 w-4 h-4 secret-trigger"
        onClick={onSecretClick}
      >
        <div className="w-full h-full rounded-full cursor-pointer"></div>
      </div>

      <div 
        className="fixed bottom-1/3 left-1/3 w-5 h-5 secret-trigger"
        onClick={onSecretClick}
      >
        <div className="w-full h-full rounded-full cursor-pointer"></div>
      </div>

      {/* Success animation */}
      {progress >= 5 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center shadow-2xl">
            <MessageCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="title-font text-2xl font-bold text-gray-800 mb-2">
              Secret Unlocked!
            </h2>
            <p className="book-font text-gray-600 mb-4">
              Welcome to the hidden chat...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecretTrigger;