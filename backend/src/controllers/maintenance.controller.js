const Maintenance = require('../models/maintenance.model');
const Equipment = require('../models/equipment.model');
const User = require('../models/user.model');
const ActivityLog = require('../models/activity.model');
const logger = require('../config/logger');

const logActivity = async (user, action, resourceId, details = {}) => {
  try {
    await ActivityLog.create({ userId: user.id, userName: user.name, userRole: user.role, action, resourceType: 'maintenance', resourceId, details });
  } catch (e) { logger.warn('Activity log failed:', e.message); }
};

// GET /api/maintenance
exports.getAll = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (req.user.role === 'technician') where.assignedTo = req.user.id;

    const tickets = await Maintenance.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Equipment, as: 'equipment', attributes: ['name', 'equipmentId', 'emoji'] },
        { model: User, as: 'assignee', attributes: ['name', 'email'] },
        { model: User, as: 'reporter', attributes: ['name', 'email'] }
      ]
    });
    res.json(tickets);
  } catch (err) { next(err); }
};

// POST /api/maintenance
exports.create = async (req, res, next) => {
  try {
    const { equipmentId, issue, description, priority, assignedTo, estimatedCost } = req.body;

    const equip = await Equipment.findByPk(equipmentId);
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });

    // Generate ticketId manually
    const count = await Maintenance.count();
    const ticketId = `MNT-${String(count + 501).padStart(3, '0')}`;

    const ticket = await Maintenance.create({
      ticketId,
      equipmentId,
      issue,
      description,
      priority,
      assignedTo,
      estimatedCost,
      reportedBy: req.user.id
    });

    await equip.update({ status: 'maintenance', lastServiced: new Date() });
    await logActivity(req.user, 'MAINTENANCE_CREATED', ticket.id, { issue });
    res.status(201).json(ticket);
  } catch (err) { next(err); }
};

// PUT /api/maintenance/:id
exports.update = async (req, res, next) => {
  try {
    const ticket = await Maintenance.findByPk(req.params.id, {
      include: [{ model: Equipment, as: 'equipment' }]
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const updates = { ...req.body };
    if (req.body.status === 'completed') {
      updates.resolvedAt = new Date();
      await ticket.equipment.update({ status: 'available' });
    }
    await ticket.update(updates);
    if (req.body.status === 'completed') {
      await logActivity(req.user, 'MAINTENANCE_RESOLVED', ticket.id, { resolution: req.body.resolution });
    }
    res.json(ticket);
  } catch (err) { next(err); }
};