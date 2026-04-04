const { Op } = require('sequelize');
const Equipment = require('../models/equipment.model');
const ActivityLog = require('../models/activity.model');
const logger = require('../config/logger');

const logActivity = async (user, action, resourceId, details = {}) => {
  try {
    await ActivityLog.create({ userId: user.id, userName: user.name, userRole: user.role, action, resourceType: 'equipment', resourceId, details });
  } catch (e) { logger.warn('Activity log failed:', e.message); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) where.name = { [Op.iLike]: '%' + search + '%' };
    const offset = (page - 1) * limit;
    const { count, rows } = await Equipment.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    res.json({ total: count, page: parseInt(page), totalPages: Math.ceil(count / limit), data: rows });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const equip = await Equipment.findByPk(req.params.id);
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });
    res.json(equip);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, category, description, specifications, dailyRate, emoji, location, purchaseDate } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!dailyRate) return res.status(400).json({ error: 'Daily rate is required' });
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const count = await Equipment.count();
    const equipmentId = 'EQ-' + String(count + 1).padStart(3, '0');
    const equip = await Equipment.create({
      name, equipmentId, category,
      description: description || '',
      specifications: specifications || {},
      dailyRate,
      emoji: emoji || '📦',
      location: location || 'Campus',
      purchaseDate,
      status: 'available'
    });
    await logActivity(req.user, 'EQUIPMENT_CREATED', equip.id, { name });
    res.status(201).json(equip);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const equip = await Equipment.findByPk(req.params.id);
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });
    await equip.update(req.body);
    await logActivity(req.user, 'EQUIPMENT_UPDATED', equip.id, { name: equip.name });
    res.json(equip);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const equip = await Equipment.findByPk(req.params.id);
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });
    await equip.update({ status: 'retired' });
    await logActivity(req.user, 'EQUIPMENT_DELETED', equip.id, { name: equip.name });
    res.json({ message: 'Equipment retired successfully' });
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const total = await Equipment.count();
    const available = await Equipment.count({ where: { status: 'available' } });
    const rented = await Equipment.count({ where: { status: 'rented' } });
    const maintenance = await Equipment.count({ where: { status: 'maintenance' } });
    res.json({ total, available, rented, maintenance, utilization: Math.round((rented / (total || 1)) * 100) });
  } catch (err) { next(err); }
};
