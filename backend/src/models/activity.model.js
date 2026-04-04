const mongoose = require('mongoose');

// MongoDB (NoSQL) — used for activity logs, audit trail, notifications
// Demonstrates flexible schema for unstructured/semi-structured data

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: String, // UUID from PostgreSQL
    required: true,
    index: true
  },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT', 'REGISTER',
      'EQUIPMENT_CREATED', 'EQUIPMENT_UPDATED', 'EQUIPMENT_DELETED',
      'RENTAL_CREATED', 'RENTAL_APPROVED', 'RENTAL_REJECTED', 'RENTAL_COMPLETED',
      'MAINTENANCE_CREATED', 'MAINTENANCE_RESOLVED',
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'REPORT_GENERATED'
    ]
  },
  resourceType: { type: String }, // 'equipment', 'rental', 'user', etc.
  resourceId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed }, // flexible JSON
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  collection: 'activity_logs',
  timestamps: false
});

// TTL index — auto-delete logs older than 90 days
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Compound index for querying user activity
activityLogSchema.index({ userId: 1, timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
