const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isConnected, memoryStore } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'sporttrack_jwt_secret_key_2026_vision_ai';
const JWT_EXPIRES_IN = '7d';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'player'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new athlete, coach, or analyst
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, sport, dominantSide, targetElbowAngle } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide your full name.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide an email address.' });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email address already exists.'
        });
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password, // Pre-save hook will hash this
        role: role || 'player',
        sport: sport || 'basketball',
        dominantSide: dominantSide || 'right',
        targetElbowAngle: targetElbowAngle || 160.0
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        user: sanitizeUser(user),
        token
      });
    } else {
      // In-memory fallback
      const existingUser = memoryStore.users.find(u => u.email === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'An account with this email address already exists.'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        _id: `usr_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || 'player',
        sport: sport || 'basketball',
        dominantSide: dominantSide || 'right',
        targetElbowAngle: targetElbowAngle || 160.0,
        createdAt: new Date().toISOString()
      };

      memoryStore.users.push(user);
      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully (Memory Store).',
        user: sanitizeUser(user),
        token
      });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during registration.'
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isConnected()) {
      // Explicitly select password field which is excluded by default in schema
      const user = await User.findOne({ email: normalizedEmail }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        message: 'Login successful.',
        user: sanitizeUser(user),
        token
      });
    } else {
      // Memory Store Fallback
      const user = memoryStore.users.find(u => u.email === normalizedEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        message: 'Login successful (Memory Store).',
        user: sanitizeUser(user),
        token
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during login.'
    });
  }
};

/**
 * @route   GET /api/auth/profile or /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    if (isConnected()) {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }
      return res.json({ success: true, user });
    } else {
      const user = memoryStore.users.find(u => u._id === userId) || req.user;
      return res.json({ success: true, user: sanitizeUser(user) });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile & biomechanical preferences
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { name, sport, dominantSide, targetElbowAngle, avatar } = req.body;

    if (isConnected()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      if (name) user.name = name.trim();
      if (sport) user.sport = sport;
      if (dominantSide) user.dominantSide = dominantSide;
      if (targetElbowAngle) user.targetElbowAngle = targetElbowAngle;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();
      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: sanitizeUser(user)
      });
    } else {
      const userIdx = memoryStore.users.findIndex(u => u._id === userId);
      if (userIdx !== -1) {
        const u = memoryStore.users[userIdx];
        if (name) u.name = name.trim();
        if (sport) u.sport = sport;
        if (dominantSide) u.dominantSide = dominantSide;
        if (targetElbowAngle) u.targetElbowAngle = targetElbowAngle;
        if (avatar !== undefined) u.avatar = avatar;
        return res.json({
          success: true,
          message: 'Profile updated successfully (Memory Store).',
          user: sanitizeUser(u)
        });
      }
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
