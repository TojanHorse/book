import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { connectDatabase } from './config/database';
import { User } from './models/User';
import { Conversation } from './models/Conversation';
import { Message } from './models/Message';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { sendVerificationEmail } from './utils/emailService';
import { AuthenticatedSocket } from './types/socket';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await connectDatabase();

  // Health check endpoint for Render
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  });

  // Root endpoint
  app.get('/api', (req, res) => {
    res.json({ 
      message: 'Book Chat API is running',
      version: '1.0.0',
      environment: process.env.NODE_ENV
    });
  });

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
        console.log(`🔗 Manual verification link: http://localhost:${process.env.PORT || 3001}/api/auth/verify-email?token=${emailVerificationToken}`);
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
          verificationLink: `http://localhost:${process.env.PORT || 3001}/api/auth/verify-email?token=${emailVerificationToken}`
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

  // Book routes
  app.get('/api/books/random', async (req, res) => {
    try {
      // Fetch random book from Gutendex API
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const response = await fetch(`https://gutendex.org/books/?page=${randomPage}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const randomBook = data.results[Math.floor(Math.random() * data.results.length)];
        res.json(randomBook);
      } else {
        // Fallback book
        res.json({
          id: 1,
          title: "Pride and Prejudice",
          authors: [{ name: "Jane Austen", birth_year: 1775, death_year: 1817 }],
          subjects: ["England -- Social life and customs -- 19th century -- Fiction"],
          languages: ["en"],
          formats: {},
          summaries: ["A classic tale of love, society, and personal growth in Regency England."]
        });
      }
    } catch (error) {
      console.error('Error fetching random book:', error);
      res.status(500).json({ message: 'Failed to fetch book' });
    }
  });

  app.get('/api/books/search', async (req, res) => {
    try {
      const { query, page = 1 } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const response = await fetch(`https://gutendex.org/books/?search=${encodeURIComponent(query as string)}&page=${page}`);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error('Error searching books:', error);
      res.status(500).json({ message: 'Failed to search books' });
    }
  });

  app.get('/api/books/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(`https://gutendex.org/books/${id}`);
      
      if (!response.ok) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      const book = await response.json();
      res.json(book);
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({ message: 'Failed to fetch book' });
    }
  });

  // File upload route
  app.post('/api/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { buffer, mimetype, originalname, size } = req.file;
      
      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'chat-files',
            public_id: `${Date.now()}-${originalname}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      const result = uploadResult as any;
      
      res.json({
        url: result.secure_url,
        publicId: result.public_id,
        fileName: originalname,
        fileType: mimetype,
        fileSize: size
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'File upload failed' });
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
            ? `http://localhost:${process.env.PORT || 3001}/api/auth/verify-email?token=${user.emailVerificationToken}`
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
  
  // Setup Socket.IO with authentication
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, process.env.RENDER_EXTERNAL_URL].filter(Boolean) as string[]
        : "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: process.env.NODE_ENV === 'production' 
      ? ['websocket', 'polling'] 
      : ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: true
  });

  // Store connected users
  const connectedUsers = new Map();

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      (socket as AuthenticatedSocket).userId = user._id.toString();
      (socket as AuthenticatedSocket).user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`User connected: ${authSocket.user.username} (${socket.id})`);
    
    // Store user connection
    connectedUsers.set(authSocket.userId, {
      socketId: socket.id,
      userId: authSocket.userId,
      username: authSocket.user.username,
      uniqueAppId: authSocket.user.uniqueAppId
    });

    // Broadcast user online status
    socket.broadcast.emit('user_online', { userId: authSocket.userId });

    socket.on('join_conversation', (data) => {
      const { conversationId } = data;
      socket.join(conversationId);
      console.log(`User ${authSocket.user.username} joined conversation ${conversationId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { recipientId, content, messageType = 'text', fileData, tempId } = data;
        const senderId = authSocket.userId;
        
        console.log('Processing message:', { senderId, recipientId, content: content.substring(0, 50) });

        // Find recipient by uniqueAppId
        const recipient = await User.findOne({ uniqueAppId: recipientId });
        if (!recipient) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }

        const recipientUserId = recipient._id.toString();

        // Create or find conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, recipientUserId] }
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [senderId, recipientUserId],
            type: 'direct'
          });
          await conversation.save();
          console.log('Created new conversation:', conversation._id);
        }

        // Create message
        const message = new Message({
          conversationId: conversation._id,
          senderId: senderId,
          messageType,
          content,
          ...(fileData || {})
        });

        await message.save();
        console.log('Message saved:', message._id);

        // Update conversation
        conversation.lastMessage = {
          content,
          senderId: senderId,
          messageType
        };
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const messageData = {
          ...message.toObject(),
          sender: {
            _id: authSocket.userId,
            username: authSocket.user.username,
            uniqueAppId: authSocket.user.uniqueAppId
          },
          tempId
        };

        // Emit to conversation room (including sender)
        io.to(conversation._id.toString()).emit('new_message', messageData);

        // Also emit directly to recipient if they're not in the conversation room
        const recipientConnection = Array.from(connectedUsers.values()).find(
          user => user.uniqueAppId === recipientId
        );
        if (recipientConnection) {
          io.to(recipientConnection.socketId).emit('new_conversation_message', {
            ...messageData,
            conversationId: conversation._id
          });
        }

        // Confirm message was sent
        socket.emit('message_sent', {
          tempId,
          message: message.toObject()
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('user_typing', {
        userId: authSocket.userId,
        username: authSocket.user.username,
        conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('user_stopped_typing', {
        userId: authSocket.userId,
        conversationId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${authSocket.user.username} (${socket.id})`);
      
      // Remove user from connected users
      connectedUsers.delete(authSocket.userId);
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', { userId: authSocket.userId });
    });
  });

  return httpServer;
}
