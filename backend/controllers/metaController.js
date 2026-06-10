const db = require('../db');

const getCourses = async (req, res) => {
    try {
        const result = await db.query('SELECT course_id, course_code, course_name FROM courses ORDER BY course_code');
        res.json(result.rows);
    } catch (error) {
        console.error('Get Courses Error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

const getGroupsByCourse = async (req, res) => {
    const { courseId } = req.params;
    try {
        const result = await db.query('SELECT group_id, group_name FROM groups WHERE course_id = $1 ORDER BY group_name', [courseId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get Groups Error:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
};

module.exports = { getCourses, getGroupsByCourse };
