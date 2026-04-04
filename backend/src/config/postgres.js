const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'rentforge',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || 'postgres',
  {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function connectPostgres() {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected via Sequelize');
    // Sync models (use migrations in production)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('✅ PostgreSQL models synced');
  } catch (err) {
    logger.error('❌ PostgreSQL connection failed:', err.message);
    throw err;
  }
}

module.exports = { sequelize, connectPostgres };
