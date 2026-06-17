const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadTimetable, getTimetables, publishTimetable } = require('../controllers/timetableController');

const path = require('path');

// Multer configured to use disk storage to pass the file to the python script
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage, 
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Protect routes allowing only 'faculty_admin' and 'super_admin'
router.post('/upload', protect(['faculty_admin', 'super_admin']), upload.single('timetable'), uploadTimetable);
router.get('/', protect(['faculty_admin', 'super_admin']), getTimetables);
router.put('/:id/publish', protect(['faculty_admin', 'super_admin']), publishTimetable);

module.exports = router;
