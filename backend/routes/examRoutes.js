const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generateTimetable, getMyExams, exportICal } = require('../controllers/examController');

router.post('/generate', protect(['student']), generateTimetable);
router.get('/my-exams', protect(['student']), getMyExams);
router.get('/my-exams/ical', protect(['student']), exportICal);

module.exports = router;
