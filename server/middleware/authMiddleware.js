import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect routes: verifies Bearer JWT token in Authorization header.
 * Attaches authenticated user to req.user (excluding password).
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production'
      );

      // Fetch user profile from DB excluding password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * @param {...string} roles - Allowed Guild roles (e.g. 'Guild Leader', 'Vice Leader')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user missing' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this action. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/** Requires membership in an active guild before accessing tenant data. */
export const requireGuild = (req, res, next) => {
  if (!req.user?.guild) {
    return res.status(403).json({ success: false, message: 'Guild membership is required for this resource.' });
  }
  next();
};

/** Used for creating a guild or applying to one. */
export const requireNoGuild = (req, res, next) => {
  if (req.user?.guild) {
    return res.status(409).json({ success: false, message: 'Leave your current guild before performing this action.' });
  }
  next();
};
