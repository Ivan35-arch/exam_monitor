const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadTimetable, getTimetables, publishTimetable } = require('../controllers/timetableController');

// Multer configured to use memory storage since we pass the buffer to pdf-parse directly.
// (We still mock file.path in DB for record keeping, or adjust DB schema accordingly)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage, 
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Protect routes allowing only 'faculty_admin' and 'super_admin'
router.post('/upload', protect(['faculty_admin', 'super_admin']), upload.single('timetable'), uploadTimetable);
router.get('/', protect(['faculty_admin', 'super_admin']), getTimetables);
router.put('/:id/publish', protect(['faculty_admin', 'super_admin']), publishTimetable);

module.exports = router;
