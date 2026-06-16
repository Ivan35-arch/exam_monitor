const db = require('../db');

// PUT /api/students/registrations
// Expected body: { registrations: [{ course_id, group_id, academic_year }] }
const updateRegistrations = async (req, res) => {
    const student_id = req.user.specificId;
    if (!student_id || req.user.role_name !== 'student') {
        return res.status(403).json({ error: 'Only students can update registrations' });
    }

    const { registrations } = req.body;
    if (!Array.isArray(registrations)) {
        return res.status(400).json({ error: 'Registrations must be an array' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // 1. Delete old registrations for this student
        await client.query('DELETE FROM student_registrations WHERE student_id = $1', [student_id]);

        // 2. Insert new registrations
        for (const reg of registrations) {
            await client.query(
                `INSERT INTO student_registrations (student_id, course_id, group_id, academic_year) 
                 VALUES ($1, $2, $3, $4)`,
                [student_id, reg.course_id, reg.group_id, reg.academic_year || 'Aug-Nov 2025']
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Registrations updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update Registrations Error:', error);
        res.status(500).json({ error: 'Failed to update registrations' });
    } finally {
        client.release();
    }
};

const getMe = async (req, res) => {
    const student_id = req.user.specificId;
    if (!student_id) {
        return res.status(403).json({ error: 'Only students can fetch profile' });
    }
    try {
        const studentRes = await db.query('SELECT * FROM students WHERE student_id = $1', [student_id]);
        const regRes = await db.query(`
            SELECT sr.*, c.course_code, c.course_name, g.group_name 
            FROM student_registrations sr
            JOIN courses c ON sr.course_id = c.course_id
            JOIN groups g ON sr.group_id = g.group_id
            WHERE sr.student_id = $1
        `, [student_id]);

        res.json({
            student: studentRes.rows[0],
            registrations: regRes.rows
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Failed to fetch student profile' });
    }
};

module.exports = { updateRegistrations, getMe };
