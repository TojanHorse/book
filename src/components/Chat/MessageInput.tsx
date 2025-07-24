import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Send, Paperclip, Image, Video, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: string, fileData?: any) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

interface FileUpload {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<FileUpload | null>(null);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const fileType = getFileType(file);
    const fileUpload: FileUpload = {
      file,
      type: fileType
    };

    // Create preview for images
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = () => {
        fileUpload.preview = reader.result as string;
        setPendingFile(fileUpload);
      };
      reader.readAsDataURL(file);
    } else {
      setPendingFile(fileUpload);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'application/*': ['.pdf', '.doc', '.docx', '.txt'],
    },
    multiple: false
  });

  const uploadToCloudinary = async (file: File): Promise<any> => {
    try {
      setIsUploading(true);

      // Get upload signature from backend
      const fileType = getFileType(file);
      const signatureResponse = await axios.post('/files/upload-signature', { 
        fileType,
        resourceType: fileType === 'video' ? 'video' : 'auto'
      });

      const signature = signatureResponse.data;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature.signature);
      formData.append('timestamp', signature.timestamp.toString());  
      formData.append('api_key', signature.api_key);
      formData.append('public_id', signature.public_id);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloud_name}/${signature.resource_type}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const result = await uploadResponse.json();

      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      };

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (isUploading) return;

    // Handle file upload
    if (pendingFile) {
      try {
        const fileData = await uploadToCloudinary(pendingFile.file);
        onSendMessage('', pendingFile.type, fileData);
        setPendingFile(null);
        toast.success('File sent successfully');
      } catch (error) {
        // Error already handled in uploadToCloudinary
      }
      return;
    }

    // Handle text message
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    onTypingStart();
    
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    
    const timer = setTimeout(() => {
      onTypingStop();
    }, 1000);
    
    setTypingTimer(timer);
  };

  const removePendingFile = () => {
    setPendingFile(null);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* File Preview */}
      {pendingFile && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
            {pendingFile.preview ? (
              <img
                src={pendingFile.preview}
                alt="Preview"
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                {getFileIcon(pendingFile.type)}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {pendingFile.file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(pendingFile.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            
            <button
              onClick={removePendingFile}
              className="text-gray-400 hover:text-red-600"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="flex items-end space-x-3">
          {/* File Upload */}
          <div {...getRootProps()} className="flex-shrink-0">
            <input {...getInputProps()} />
            <button
              type="button"
              className={`p-2 text-gray-500 hover:text-blue-600 transition-colors ${
                isDragActive ? 'text-blue-600 bg-blue-50' : ''
              }`}
              disabled={isUploading}
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                resize: 'none'
              }}
              disabled={isUploading}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!message.trim() && !pendingFile) || isUploading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Drag overlay */}
        {isDragActive && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center border-2 border-dashed border-blue-300 rounded-lg">
            <div className="text-center">
              <Paperclip className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-600 font-medium">Drop your file here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInput;