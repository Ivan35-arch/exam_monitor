const express = require('express');
const router = express.Router();
const { getCourses, getGroupsByCourse } = require('../controllers/metaController');

// These routes can be accessed by any authenticated user
const { protect } = require('../middleware/authMiddleware');

router.get('/courses', protect(['student', 'faculty_admin', 'super_admin']), getCourses);
router.get('/courses/:courseId/groups', protect(['student', 'faculty_admin', 'super_admin']), getGroupsByCourse);

module.exports = router;
