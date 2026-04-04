const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ActivityLog = require('../models/activity.model');
const logger = require('../config/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const logActivity = async (userId, userName, userRole, action, details = {}, req = null) => {
  try {
    await ActivityLog.create({
      userId, userName, userRole, action, details,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  } catch (err) {
    // MongoDB might not be available — don't fail the request
    logger.warn('Activity log failed (MongoDB):', err.message);
  }
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, company, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Only admins can create admin/manager accounts
    const allowedRoles = ['customer', 'technician'];
    const assignedRole = allowedRoles.includes(role) ? role : 'customer';

    const user = await User.create({ name, email, password, role: assignedRole, company, phone });
    const token = generateToken(user);

    await logActivity(user.id, user.name, user.role, 'REGISTER', { email }, req);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    await user.update({ lastLogin: new Date() });
    const token = generateToken(user);

    await logActivity(user.id, user.name, user.role, 'LOGIN', {}, req);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  await logActivity(req.user.id, req.user.name, req.user.role, 'LOGOUT', {}, req);
  res.json({ message: 'Logged out successfully' });
};
