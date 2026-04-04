const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true }
  },
  equipmentId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  specifications: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  dailyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  status: {
    type: DataTypes.ENUM('available','rented','maintenance','retired'),
    defaultValue: 'available'
  },
  emoji: {
    type: DataTypes.STRING(10),
    defaultValue: '🏗️'
  },
  location: {
    type: DataTypes.STRING(200),
    defaultValue: 'Warangal Depot'
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  lastServiced: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  totalRentals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  }
}, {
  tableName: 'equipment',
  timestamps: true
});

module.exports = Equipment;
