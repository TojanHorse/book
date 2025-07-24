import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
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
  isEdited: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'document'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  fileUrl: String,
  filePublicId: String,
  fileName: String,
  fileType: String,
  fileSize: Number,
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const Message = mongoose.model<IMessage>('Message', messageSchema);