const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/maintenance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorize('admin', 'manager', 'technician'), ctrl.getAll);
router.post('/', authenticate, authorize('admin', 'manager', 'technician'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'manager', 'technician'), ctrl.update);

module.exports = router;
