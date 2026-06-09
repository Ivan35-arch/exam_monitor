const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updateRegistrations, getMe } = require('../controllers/studentController');

router.put('/registrations', protect(['student']), updateRegistrations);
router.get('/me', protect(['student']), getMe);

module.exports = router;
