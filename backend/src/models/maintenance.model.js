const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Maintenance = sequelize.define('Maintenance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticketId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  equipmentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  reportedBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true
  },
  issue: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low','medium','high','critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending','in_progress','completed','cancelled'),
    defaultValue: 'pending'
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  actualCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'maintenance',
  timestamps: true
});

module.exports = Maintenance;