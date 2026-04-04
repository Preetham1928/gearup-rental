const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/overview', authenticate, authorize('admin', 'manager'), ctrl.getOverview);
router.get('/revenue', authenticate, authorize('admin', 'manager'), ctrl.getRevenue);
router.get('/top-equipment', authenticate, authorize('admin', 'manager'), ctrl.getTopEquipment);
router.get('/activity', authenticate, authorize('admin', 'manager'), ctrl.getActivity);

module.exports = router;
