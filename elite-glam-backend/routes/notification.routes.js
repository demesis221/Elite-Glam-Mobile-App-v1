const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

router.get('/', protect, notificationController.getNotifications);
router.post('/mark-read', protect, notificationController.markAsRead);

module.exports = router;
