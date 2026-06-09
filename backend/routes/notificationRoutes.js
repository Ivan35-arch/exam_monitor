const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, getUnreadCount, markAsRead } = require('../controllers/notificationController');

router.get('/', protect(['student']), getNotifications);
router.get('/unread-count', protect(['student']), getUnreadCount);
router.patch('/:id/read', protect(['student']), markAsRead);

module.exports = router;
