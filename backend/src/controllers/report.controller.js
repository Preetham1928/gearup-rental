const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/postgres');
const Equipment = require('../models/equipment.model');
const Rental = require('../models/rental.model');
const Maintenance = require('../models/maintenance.model');
const User = require('../models/user.model');
const ActivityLog = require('../models/activity.model');

// GET /api/reports/overview  [admin, manager]
exports.getOverview = async (req, res, next) => {
  try {
    const [
      totalEquipment, availableEquipment, rentedEquipment, maintenanceEquipment,
      totalRentals, pendingRentals, activeRentals, completedRentals,
      totalUsers, totalRevenue, openTickets
    ] = await Promise.all([
      Equipment.count(),
      Equipment.count({ where: { status: 'available' } }),
      Equipment.count({ where: { status: 'rented' } }),
      Equipment.count({ where: { status: 'maintenance' } }),
      Rental.count(),
      Rental.count({ where: { status: 'pending' } }),
      Rental.count({ where: { status: 'active' } }),
      Rental.count({ where: { status: 'completed' } }),
      User.count({ where: { isActive: true } }),
      Rental.sum('totalAmount', { where: { status: ['completed', 'active'] } }),
      Maintenance.count({ where: { status: ['pending', 'in_progress'] } })
    ]);

    res.json({
      equipment: { total: totalEquipment, available: availableEquipment, rented: rentedEquipment, maintenance: maintenanceEquipment },
      rentals: { total: totalRentals, pending: pendingRentals, active: activeRentals, completed: completedRentals },
      totalUsers,
      totalRevenue: totalRevenue || 0,
      openMaintenanceTickets: openTickets
    });
  } catch (err) { next(err); }
};

// GET /api/reports/revenue  [admin, manager]
exports.getRevenue = async (req, res, next) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const revenue = await Rental.sum('totalAmount', {
        where: {
          status: ['completed', 'active'],
          createdAt: {
            [Op.gte]: new Date(year, month - 1, 1),
            [Op.lt]: new Date(year, month, 1)
          }
        }
      });
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year,
        revenue: revenue || 0
      });
    }
    res.json(months);
  } catch (err) { next(err); }
};

// GET /api/reports/top-equipment  [admin, manager]
exports.getTopEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findAll({
      order: [['totalRevenue', 'DESC']],
      limit: 10
    });
    res.json(equipment);
  } catch (err) { next(err); }
};

// GET /api/reports/activity  [admin, manager]
exports.getActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json(logs);
  } catch (err) {
    res.json([]); // MongoDB might be unavailable
  }
};
