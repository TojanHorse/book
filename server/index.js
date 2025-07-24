const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
// Load environment variables - try root .env first, then server/.env
const fs = require('fs');
const rootEnvPath = path.join(__dirname, '../.env');
const serverEnvPath = path.join(__dirname, '.env');

if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
  console.log('🔧 Loaded environment variables from root .env');
} else if (fs.existsSync(serverEnvPath)) {
  require('dotenv').config({ path: serverEnvPath });
  console.log('🔧 Loaded environment variables from server/.env');
} else {
  console.warn('⚠️  No .env file found at', rootEnvPath, 'or', serverEnvPath);
  console.warn('⚠️  Make sure to set environment variables directly or create .env file');
}

const { getConfig } = require('./config/validateEnv');
const config = getConfig();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const fileRoutes = require('./routes/files');
const { authenticateSocket } = require('./middleware/auth');
const socketHandlers = require('./socket/socketHandlers');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: config.server.frontendUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Socket.IO setup
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// MongoDB connection
mongoose.connect(config.mongodb.uri, config.mongodb.options)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from the React build in production
if (config.server.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// Socket.IO middleware and handlers
io.use(authenticateSocket);
socketHandlers(io);

const PORT = config.server.port;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${config.server.nodeEnv}`);
  console.log(`🌐 CORS origin: ${config.server.frontendUrl}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please:`);
    console.error(`   1. Kill the process using port ${PORT}`);
    console.error(`   2. Or set a different PORT in your .env file`);
    process.exit(1);
  } else {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
});

module.exports = { app, server, io };