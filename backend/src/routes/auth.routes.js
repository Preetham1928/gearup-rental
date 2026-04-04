// ─── auth.routes.js ──────────────────────────────────────────
const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/me', authenticate, authCtrl.getMe);
router.post('/logout', authenticate, authCtrl.logout);

module.exports = router;
