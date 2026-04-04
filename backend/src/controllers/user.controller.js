const User = require('../models/user.model');
const { Op } = require('sequelize');

// GET /api/users  [admin]
exports.getAll = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
    const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(users.map(u => u.toJSON()));
  } catch (err) { next(err); }
};

// GET /api/users/:id  [admin]
exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) { next(err); }
};

// POST /api/users  [admin]
exports.create = async (req, res, next) => {
  try {
    const existing = await User.findOne({ where: { email: req.body.email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create(req.body);
    res.status(201).json(user.toJSON());
  } catch (err) { next(err); }
};

// PUT /api/users/:id  [admin]
exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Prevent password update via this endpoint
    delete req.body.password;
    await user.update(req.body);
    res.json(user.toJSON());
  } catch (err) { next(err); }
};

// DELETE /api/users/:id  [admin]
exports.remove = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) { next(err); }
};
