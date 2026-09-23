const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isConnected, memoryStore } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'sporttrack_jwt_secret_key_2026_vision_ai';

/**
 * Strict Authentication Middleware:
 * Rejects unauthenticated requests with 401 Unauthorized.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No valid Bearer token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token. Please log in again.'
      });
    }

    // Attach user payload
    if (isConnected()) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User associated with this token no longer exists.'
        });
      }
      req.user = user;
    } else {
      const memUser = memoryStore.users.find(u => u._id === decoded.id) || {
        _id: decoded.id,
        name: decoded.name || 'Athlete',
        email: decoded.email || 'athlete@sporttrack.ai',
        role: decoded.role || 'player',
        sport: 'basketball',
        dominantSide: 'right'
      };
      req.user = memUser;
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failed: ' + error.message
    });
  }
};

/**
 * Optional Authentication Middleware:
 * Populates req.user if a valid token is present, but allows unauthenticated requests.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (isConnected()) {
      req.user = await User.findById(decoded.id).select('-password');
    } else {
      req.user = memoryStore.users.find(u => u._id === decoded.id) || null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

/**
 * Role-Based Authorization Guard:
 * Restricts route access to specific roles (e.g. 'coach', 'admin', 'analyst').
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  // Alias for backward compatibility
  authMiddleware: requireAuth
};
