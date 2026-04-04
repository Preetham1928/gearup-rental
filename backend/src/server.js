require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectPostgres } = require('./config/postgres');
const { connectMongo } = require('./config/mongo');
const logger = require('./config/logger');

// ─── Load Models & Define Associations ──────────────────────────
const User = require('./models/user.model');
const Equipment = require('./models/equipment.model');
const Rental = require('./models/rental.model');
const Maintenance = require('./models/maintenance.model');

// Rental associations
Rental.belongsTo(Equipment, { as: 'equipment', foreignKey: 'equipmentId' });
Rental.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
Rental.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });
Equipment.hasMany(Rental, { as: 'rentals', foreignKey: 'equipmentId' });

// Maintenance associations
Maintenance.belongsTo(Equipment, { as: 'equipment', foreignKey: 'equipmentId' });
Maintenance.belongsTo(User, { as: 'reporter', foreignKey: 'reportedBy' });
Maintenance.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
Equipment.hasMany(Maintenance, { as: 'maintenances', foreignKey: 'equipmentId' });

// ─── Routes ─────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const rentalRoutes = require('./routes/rental.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const userRoutes = require('./routes/user.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// ─── Security Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── Body Parsing ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// ─── Health Check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'RentForge API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ─── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectPostgres();
    await connectMongo();
    app.listen(PORT, () => {
      logger.info(`🚀 RentForge API running on port ${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;