const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getConfig } = require('../config/validateEnv');

const config = getConfig();

// Middleware for HTTP requests
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findOne({ uniqueAppId: decoded.uniqueAppId }).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email verification required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware for Socket.IO connections
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findOne({ uniqueAppId: decoded.uniqueAppId }).select('-passwordHash');
    
    if (!user || !user.isVerified) {
      return next(new Error('User not found or not verified'));
    }

    socket.userId = user.uniqueAppId;
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Invalid authentication token'));
  }
};

// Admin role check
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  authenticateSocket,
  requireAdmin
};