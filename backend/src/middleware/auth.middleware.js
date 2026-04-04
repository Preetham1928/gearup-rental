const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../config/logger');

// ─── Verify JWT Token ─────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Authorization required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or account deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    logger.error('Auth middleware error:', err);
    next(err);
  }
};

// ─── Role-Based Access Control ────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
};

// ─── Resource Ownership Check ─────────────────────────────────
// Allows admin/manager to access all, customer/technician only their own
const ownerOrAdmin = (resourceUserIdField = 'customerId') => {
  return (req, res, next) => {
    const { role, id } = req.user;
    if (role === 'admin' || role === 'manager') return next();

    const resource = req.resource; // set by controller
    if (resource && resource[resourceUserIdField] === id) return next();

    return res.status(403).json({ error: 'Access denied. You can only access your own resources.' });
  };
};

module.exports = { authenticate, authorize, ownerOrAdmin };
