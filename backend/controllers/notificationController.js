const db = require('../db');

// GET /api/notifications
const getNotifications = async (req, res) => {
    const student_id = req.user.specificId;
    if (!student_id || req.user.role_name !== 'student') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM notifications WHERE student_id = $1 ORDER BY sent_at DESC LIMIT 50',
            [student_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
    const student_id = req.user.specificId;
    if (!student_id || req.user.role_name !== 'student') return res.status(403).json({ error: 'Forbidden' });

    try {
        const result = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE student_id = $1 AND is_read = FALSE',
            [student_id]
        );
        res.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
    const student_id = req.user.specificId;
    if (!student_id) return res.status(403).json({ error: 'Forbidden' });
    const notification_id = req.params.id;

    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND student_id = $2',
            [notification_id, student_id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead };
