const express = require('express');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search users by unique ID
router.get('/users/search/:searchTerm', authenticateToken, async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const currentUserId = req.user.uniqueAppId;

    if (searchTerm.length < 2) {
      return res.status(400).json({ error: 'Search term must be at least 2 characters' });
    }

    const users = await User.find({
      $and: [
        { uniqueAppId: { $ne: currentUserId } },
        { isVerified: true },
        {
          $or: [
            { uniqueAppId: { $regex: searchTerm, $options: 'i' } },
            { username: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    })
    .select('uniqueAppId username lastActive')
    .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get user conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uniqueAppId;

    const conversations = await Conversation.find({
      participants: userId,
      deletedFor: { $ne: userId }
    })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'uniqueAppId username lastActive')
    .lean();

    // Add participant info for each conversation
    const conversationsWithInfo = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.uniqueAppId !== userId);
      return {
        ...conv,
        otherParticipant
      };
    });

    res.json({ conversations: conversationsWithInfo });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversation messages
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.uniqueAppId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ 
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Block/unblock user
router.post('/users/:uniqueAppId/block', authenticateToken, async (req, res) => {
  try {
    const { uniqueAppId: targetUserId } = req.params;
    const { action } = req.body; // 'block' or 'unblock'
    const currentUserId = req.user.uniqueAppId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const targetUser = await User.findOne({ uniqueAppId: targetUserId });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findOne({ uniqueAppId: currentUserId });

    if (action === 'block') {
      if (!currentUser.blockedUsers.includes(targetUserId)) {
        currentUser.blockedUsers.push(targetUserId);
        await currentUser.save();
      }
    } else if (action === 'unblock') {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id !== targetUserId);
      await currentUser.save();
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ 
      message: `User ${action}ed successfully`,
      blockedUsers: currentUser.blockedUsers
    });
  } catch (error) {
    console.error('Block/unblock error:', error);
    res.status(500).json({ error: 'Failed to update block status' });
  }
});

// Delete conversation (soft delete)
router.delete('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.uniqueAppId;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Add user to deletedFor array
    if (!conversation.deletedFor.includes(userId)) {
      conversation.deletedFor.push(userId);
      await conversation.save();
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;