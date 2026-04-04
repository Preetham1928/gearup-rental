// rental.routes.js
const express = require('express');
const rentalRouter = express.Router();
const rentalCtrl = require('../controllers/rental.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

rentalRouter.get('/stats', authenticate, authorize('admin', 'manager'), rentalCtrl.getStats);
rentalRouter.get('/', authenticate, rentalCtrl.getAll);
rentalRouter.post('/', authenticate, rentalCtrl.create);
rentalRouter.put('/:id/status', authenticate, authorize('admin', 'manager'), rentalCtrl.updateStatus);

module.exports = rentalRouter;
