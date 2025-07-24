const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const connectedUsers = new Map();

const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user
    });
    
    // Join user to their own room for private messages
    socket.join(socket.userId);
    
    // Emit user online status to all connections
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      username: socket.user.username
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        // Verify user is participant in conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });
        
        if (conversation) {
          socket.join(conversationId);
          socket.emit('joined_conversation', { conversationId });
        } else {
          socket.emit('error', { message: 'Unauthorized to join conversation' });
        }
      } catch (error) {
        console.error('Join conversation error:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, content, messageType = 'text', fileData } = data;
        const senderId = socket.userId;
        
        // Check if users have blocked each other
        const [sender, recipient] = await Promise.all([
          User.findOne({ uniqueAppId: senderId }),
          User.findOne({ uniqueAppId: recipientId })
        ]);
        
        if (!recipient) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }
        
        // Check blocking
        if (sender.blockedUsers.includes(recipientId) || recipient.blockedUsers.includes(senderId)) {
          socket.emit('error', { message: 'Message blocked due to user blocking' });
          return;
        }
        
        // Find or create conversation
        const conversation = await Conversation.findOrCreatePrivateConversation(senderId, recipientId);
        
        // Create message
        const messageData = {
          conversationId: conversation._id,
          senderId,
          messageType,
          content: content || '',
        };
        
        // Add file data if present
        if (fileData) {
          messageData.fileUrl = fileData.url;
          messageData.filePublicId = fileData.publicId;
          messageData.fileName = fileData.fileName;
          messageData.fileType = fileData.fileType;
          messageData.fileSize = fileData.fileSize;
        }
        
        const message = await Message.create(messageData);
        
        // Update conversation
        conversation.lastMessage = {
          content: content || (fileData ? `Sent a ${messageType}` : ''),
          senderId,
          messageType
        };
        conversation.lastMessageAt = new Date();
        
        // Remove recipient from deletedFor if present
        conversation.deletedFor = conversation.deletedFor.filter(userId => userId !== recipientId);
        
        await conversation.save();
        
        // Populate message for emission
        const populatedMessage = await Message.findById(message._id).lean();
        
        // Emit to conversation room
        io.to(conversation._id.toString()).emit('new_message', {
          message: populatedMessage,
          conversation: {
            _id: conversation._id,
            participants: conversation.participants,
            lastMessageAt: conversation.lastMessageAt
          }
        });
        
        // Emit to recipient's personal room for real-time notifications
        io.to(recipientId).emit('new_conversation_message', {
          message: populatedMessage,
          conversationId: conversation._id,
          sender: {
            uniqueAppId: sender.uniqueAppId,
            username: sender.username
          }
        });
        
        // Confirm to sender
        socket.emit('message_sent', {
          tempId: data.tempId,
          message: populatedMessage
        });
        
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', async (data) => {
      try {
        const { conversationId } = data;
        
        // Verify user is in conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });
        
        if (conversation) {
          socket.to(conversationId).emit('user_typing', {
            userId: socket.userId,
            username: socket.user.username,
            conversationId
          });
        }
      } catch (error) {
        console.error('Typing start error:', error);
      }
    });

    socket.on('typing_stop', async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });
        
        if (conversation) {
          socket.to(conversationId).emit('user_stopped_typing', {
            userId: socket.userId,
            conversationId
          });
        }
      } catch (error) {
        console.error('Typing stop error:', error);
      }
    });

    // Handle user going offline/disconnecting
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Emit user offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.userId
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

module.exports = socketHandlers;