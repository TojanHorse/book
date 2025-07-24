import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { connectDatabase } from './config/database';
import { User } from './models/User';
import { Conversation } from './models/Conversation';
import { Message } from './models/Message';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { sendVerificationEmail } from './utils/emailService';

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await connectDatabase();

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({ 
          message: 'Username, email, and password are required' 
        });
      }

      if (username.length < 3) {
        return res.status(400).json({ 
          message: 'Username must be at least 3 characters long' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'Password must be at least 6 characters long' 
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: 'Please enter a valid email address' 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.email === email ? 'Email already exists' : 'Username already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate unique app ID
      const uniqueAppId = nanoid(8);
      
      // Create verification token
      const emailVerificationToken = nanoid(32);

      // Create user
      const user = new User({
        username,
        email,
        password: hashedPassword,
        uniqueAppId,
        emailVerificationToken,
        isVerified: false
      });

      await user.save();

      // Send verification email
      let emailSent = false;
      try {
        await sendVerificationEmail(email, emailVerificationToken);
        emailSent = true;
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        // Don't fail the registration if email fails
      }

      console.log(`📧 Email sending status for ${email}:`, emailSent ? 'SUCCESS' : 'FAILED');
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 Manual verification link: http://localhost:5000/api/auth/verify-email?token=${emailVerificationToken}`);
      }

      res.status(201).json({ 
        message: 'User created successfully. Please check your email for verification.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          uniqueAppId: user.uniqueAppId,
          isVerified: user.isVerified
        },
        // Include verification link in response for development/testing
        ...(process.env.NODE_ENV === 'development' && {
          verificationLink: `http://localhost:5000/api/auth/verify-email?token=${emailVerificationToken}`
        })
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 11000) {
        // Duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ 
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Check if email is verified
      if (!user.isVerified) {
        return res.status(400).json({ 
          message: 'Please verify your email before logging in',
          needsVerification: true 
        });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const token = jwt.sign(
        { userId: user._id },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Update last active
      user.lastActive = new Date();
      await user.save();

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          uniqueAppId: user.uniqueAppId,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        // Redirect to frontend verification page with error
        return res.redirect('/verify-email?error=missing_token');
      }

      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) {
        // Redirect to frontend verification page with error
        return res.redirect('/verify-email?error=invalid_token');
      }

      user.isVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      console.log(`✅ Email verified successfully for user: ${user.email}`);
      
      // Redirect to frontend verification page with success
      res.redirect('/verify-email?success=true');
    } catch (error) {
      console.error('Email verification error:', error);
      res.redirect('/verify-email?error=server_error');
    }
  });

  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      // Generate new verification token
      const emailVerificationToken = nanoid(32);
      user.emailVerificationToken = emailVerificationToken;
      await user.save();

      // Send verification email
      try {
        await sendVerificationEmail(email, emailVerificationToken);
        res.json({ message: 'Verification email sent successfully' });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        res.status(500).json({ message: 'Failed to send verification email' });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Protected routes
  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          uniqueAppId: user.uniqueAppId,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User search route
  app.get('/api/users/search', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { query } = req.query;
      const currentUserId = req.userId;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      // Search for users by username or uniqueAppId (case-insensitive)
      const users = await User.find({
        _id: { $ne: currentUserId }, // Exclude current user
        isVerified: true, // Only show verified users
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { uniqueAppId: { $regex: query, $options: 'i' } }
        ]
      })
      .select('username uniqueAppId lastActive')
      .limit(10);

      res.json(users);
    } catch (error) {
      console.error('User search error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Chat routes
  app.get('/api/chat/conversations', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      
      const conversations = await Conversation.find({
        participants: userId
      }).sort({ lastMessageAt: -1 });

      // Get other participants' info
      const conversationsWithUsers = await Promise.all(
        conversations.map(async (conv) => {
          const otherParticipantId = conv.participants.find(p => p !== userId);
          const otherUser = await User.findById(otherParticipantId);
          
          return {
            ...conv.toObject(),
            otherParticipant: otherUser ? {
              uniqueAppId: otherUser.uniqueAppId,
              username: otherUser.username,
              lastActive: otherUser.lastActive
            } : null
          };
        })
      );

      res.json(conversationsWithUsers);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/chat/messages/:conversationId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.userId!;

      // Verify user is part of conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(100);

      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Debug routes (development only)
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/debug/unverified-users', async (req, res) => {
      try {
        const users = await User.find({ isVerified: false })
          .select('username email uniqueAppId emailVerificationToken createdAt')
          .sort({ createdAt: -1 })
          .limit(10);

        const usersWithLinks = users.map(user => ({
          ...user.toObject(),
          verificationLink: user.emailVerificationToken 
            ? `http://localhost:5000/api/auth/verify-email?token=${user.emailVerificationToken}`
            : null
        }));

        res.json({
          message: 'Unverified users (development only)',
          users: usersWithLinks
        });
      } catch (error) {
        console.error('Debug unverified users error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  const httpServer = createServer(app);
  
  // Setup Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('send_message', async (data) => {
      try {
        const { recipientId, content, messageType = 'text', fileData } = data;
        
        // Create or find conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [data.senderId, recipientId] }
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [data.senderId, recipientId],
            type: 'direct'
          });
          await conversation.save();
        }

        // Create message
        const message = new Message({
          conversationId: conversation._id,
          senderId: data.senderId,
          messageType,
          content,
          ...fileData
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = {
          content,
          senderId: data.senderId,
          messageType
        };
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Emit to conversation room
        io.to(conversation._id.toString()).emit('new_message', message);
      } catch (error) {
        console.error('Send message error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return httpServer;
}
