import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  _id: string;
  participants: string[];
  type: 'direct' | 'group';
  lastMessageAt: Date;
  lastMessage?: {
    content: string;
    senderId: string;
    messageType: string;
  };
  createdAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{
    type: String,
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    content: String,
    senderId: String,
    messageType: String
  }
}, {
  timestamps: true
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);