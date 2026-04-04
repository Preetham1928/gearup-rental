const mongoose = require('mongoose');
const logger = require('./logger');

async function connectMongo() {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/rentforge',
      { serverSelectionTimeoutMS: 5000 }
    );
    logger.info(`✅ MongoDB connected via Mongoose: ${conn.connection.host}`);
  } catch (err) {
    logger.error('❌ MongoDB connection failed:', err.message);
    // MongoDB is optional — app continues (used for logs/activity)
    logger.warn('⚠️  Continuing without MongoDB...');
  }
}

module.exports = { connectMongo };
