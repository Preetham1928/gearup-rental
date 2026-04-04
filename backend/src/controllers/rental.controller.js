const { Op } = require('sequelize');
const Rental = require('../models/rental.model');
const Equipment = require('../models/equipment.model');
const User = require('../models/user.model');
const ActivityLog = require('../models/activity.model');
const logger = require('../config/logger');

const logActivity = async (user, action, resourceId, details = {}) => {
  try {
    await ActivityLog.create({ userId: user.id, userName: user.name, userRole: user.role, action, resourceType: 'rental', resourceId, details });
  } catch (e) { logger.warn('Activity log failed:', e.message); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (req.user.role === 'customer') where.customerId = req.user.id;
    const offset = (page - 1) * limit;
    const { count, rows } = await Rental.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Equipment, as: 'equipment', attributes: ['name', 'equipmentId', 'emoji', 'category'] },
        { model: User, as: 'customer', attributes: ['name', 'email', 'company'] }
      ]
    });
    res.json({ total: count, page: parseInt(page), totalPages: Math.ceil(count / limit), data: rows });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { equipmentId, startDate, endDate, purpose } = req.body;
    const equip = await Equipment.findByPk(equipmentId);
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });
    if (equip.status !== 'available') return res.status(400).json({ error: 'Equipment is currently ' + equip.status });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (totalDays < 1) return res.status(400).json({ error: 'End date must be after start date' });

    const totalAmount = totalDays * parseFloat(equip.dailyRate);
    const count = await Rental.count();
    const orderId = 'ORD-' + String(count + 1001).padStart(4, '0');

    // ALL roles — including customer — get 'active' status directly, no approval needed
    const rental = await Rental.create({
      orderId,
      customerId: req.user.id,
      equipmentId,
      startDate,
      endDate,
      totalDays,
      dailyRate: equip.dailyRate,
      totalAmount,
      purpose,
      status: 'active'
    });

    // Mark equipment as rented immediately
    await equip.update({ status: 'rented' });

    await logActivity(req.user, 'RENTAL_CREATED', rental.id, { equipmentName: equip.name, totalAmount });
    res.status(201).json(rental);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const rental = await Rental.findByPk(req.params.id, {
      include: [{ model: Equipment, as: 'equipment' }]
    });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['active', 'cancelled'],
      active: ['completed', 'cancelled'],
    };
    if (!validTransitions[rental.status]?.includes(status)) {
      return res.status(400).json({ error: 'Cannot transition from ' + rental.status + ' to ' + status });
    }

    const updates = { status, notes };
    if (status === 'approved') { updates.approvedBy = req.user.id; updates.approvedAt = new Date(); }
    if (status === 'active') await rental.equipment.update({ status: 'rented' });
    if (status === 'completed') {
      updates.returnedAt = new Date();
      await rental.equipment.update({
        status: 'available',
        totalRentals: rental.equipment.totalRentals + 1,
        totalRevenue: parseFloat(rental.equipment.totalRevenue) + parseFloat(rental.totalAmount)
      });
    }
    if (status === 'cancelled' && rental.status === 'active') {
      await rental.equipment.update({ status: 'available' });
    }
    await rental.update(updates);
    await logActivity(req.user, 'RENTAL_' + status.toUpperCase(), rental.id, {});
    res.json(rental);
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const total = await Rental.count();
    const pending = await Rental.count({ where: { status: 'pending' } });
    const active = await Rental.count({ where: { status: 'active' } });
    const completed = await Rental.count({ where: { status: 'completed' } });
    const revenue = await Rental.sum('totalAmount', { where: { status: ['completed', 'active'] } });
    res.json({ total, pending, active, completed, totalRevenue: revenue || 0 });
  } catch (err) { next(err); }
};
