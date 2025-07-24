const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: String,
    required: true,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    content: String,
    senderId: String,
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'document'],
      default: 'text'
    }
  },
  deletedFor: [{
    type: String,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ deletedFor: 1 });

// Static method to find or create conversation
conversationSchema.statics.findOrCreatePrivateConversation = async function(userId1, userId2) {
  const participants = [userId1, userId2].sort();
  
  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 },
    type: 'private'
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants,
      type: 'private'
    });
  }
  
  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);