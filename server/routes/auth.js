const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getConfig } = require('../config/validateEnv');

const router = express.Router();
const config = getConfig();

// Email transporter setup
const transporter = nodemailer.createTransport(config.email);

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      uniqueAppId: user.uniqueAppId,
      email: user.email,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Send verification email
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${config.server.frontendUrl}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: config.email.auth.user,
    to: user.email,
    subject: 'Verify Your Account - Digital Library',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Digital Library</h2>
        <p>Hello ${user.username},</p>
        <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>If the button doesn't work, copy and paste this link:</p>
        <p>${verificationUrl}</p>
        <p>Your unique ID for the app is: <strong>${user.uniqueAppId}</strong></p>
        <p>This verification link will expire in 24 hours.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate unique app ID
    let uniqueAppId;
    let isUnique = false;
    while (!isUnique) {
      uniqueAppId = User.generateUniqueId();
      const existingId = await User.findOne({ uniqueAppId });
      isUnique = !existingId;
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { email, uniqueAppId },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    const user = new User({
      uniqueAppId,
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      verificationToken,
      isVerified: false
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      uniqueAppId: user.uniqueAppId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      token,
      user: {
        uniqueAppId: user.uniqueAppId,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findOne({ 
      email: decoded.email,
      uniqueAppId: decoded.uniqueAppId,
      verificationToken: token
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    const authToken = generateToken(user);

    res.json({
      message: 'Email verified successfully',
      token: authToken,
      user: {
        uniqueAppId: user.uniqueAppId,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({ error: 'Invalid or expired verification token' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      { email: user.email, uniqueAppId: user.uniqueAppId },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    user.verificationToken = verificationToken;
    await user.save();

    await sendVerificationEmail(user, verificationToken);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      uniqueAppId: req.user.uniqueAppId,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified,
      lastActive: req.user.lastActive
    }
  });
});

// Admin: Reset user verification
router.post('/admin/reset-verification/:uniqueAppId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { uniqueAppId } = req.params;

    const user = await User.findOne({ uniqueAppId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      { email: user.email, uniqueAppId: user.uniqueAppId },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    user.isVerified = false;
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    res.json({ 
      message: 'User verification reset successfully. Verification email sent.',
      user: {
        uniqueAppId: user.uniqueAppId,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Reset verification error:', error);
    res.status(500).json({ error: 'Failed to reset user verification' });
  }
});

module.exports = router;