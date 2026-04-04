const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/equipment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/stats', authenticate, ctrl.getStats);
router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getOne);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'manager'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin', 'manager'), ctrl.remove);

module.exports = router;
