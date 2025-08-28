const express = require('express');
const router = express.Router();
const { requireUserAuth } = require('../utils/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Protect all routes with user auth
router.use(requireUserAuth);

// GET /api/user/notifications
router.get('/', notificationController.getMyNotifications);

// PATCH /api/user/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;