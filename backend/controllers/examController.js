const db = require('../db');
const ics = require('ics');

// POST /api/timetables/generate
const generateTimetable = async (req, res) => {
    const student_id = req.user.specificId;
    if (!student_id || req.user.roleName !== 'student') {
        return res.status(403).json({ error: 'Only students can generate timetables' });
    }

    try {
        // Find published timetables
        const otRes = await db.query("SELECT timetable_id FROM official_timetables WHERE status = 'published'");
        if (otRes.rows.length === 0) {
            return res.status(404).json({ error: 'No published official timetables found' });
        }

        // We can optionally store the "generated" timestamp in personalized_timetables
        // For simplicity, we just trigger an upsert for record keeping
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            for (let row of otRes.rows) {
                await client.query(`
                    INSERT INTO personalized_timetables (student_id, timetable_id) 
                    VALUES ($1, $2) ON CONFLICT DO NOTHING
                `, [student_id, row.timetable_id]);
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        res.json({ message: 'Personalized timetable ready to view' });
    } catch (error) {
        console.error('Generate Error:', error);
        res.status(500).json({ error: 'Failed to generate timetable' });
    }
};

// GET /api/exams/my-exams
const getMyExams = async (req, res) => {
    const student_id = req.user.specificId;
    if (!student_id) return res.status(403).json({ error: 'Forbidden' });

    try {
        const query = `
            SELECT e.exam_id, e.unit_code, e.unit_name,
                   e.exam_date, e.exam_time, e.duration_minutes,
                   e.venue, g.group_name, ot.title as timetable_title
            FROM exam_entries e
            JOIN student_registrations sr
              ON sr.course_id = e.course_id
             AND sr.group_id  = e.group_id
             AND sr.student_id = $1
            JOIN official_timetables ot
              ON ot.timetable_id = e.timetable_id
             AND ot.status = 'published'
            JOIN groups g ON g.group_id = e.group_id
            ORDER BY e.exam_date, e.exam_time;
        `;
        const result = await db.query(query, [student_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get Exams Error:', error);
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
};

// GET /api/exams/my-exams/ical
const exportICal = async (req, res) => {
    const student_id = req.user.specificId;
    if (!student_id) return res.status(403).json({ error: 'Forbidden' });

    try {
        const query = `
            SELECT e.unit_code, e.unit_name, e.exam_date, e.exam_time, e.duration_minutes, e.venue
            FROM exam_entries e
            JOIN student_registrations sr ON sr.course_id = e.course_id AND sr.group_id = e.group_id AND sr.student_id = $1
            JOIN official_timetables ot ON ot.timetable_id = e.timetable_id AND ot.status = 'published'
            ORDER BY e.exam_date, e.exam_time;
        `;
        const result = await db.query(query, [student_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No exams found to export' });
        }

        const events = result.rows.map(exam => {
            const dateStr = exam.exam_date.toISOString().split('T')[0]; // YYYY-MM-DD
            const [year, month, day] = dateStr.split('-').map(Number);
            const [hour, minute] = exam.exam_time.split(':').map(Number);

            return {
                start: [year, month, day, hour, minute],
                duration: { minutes: exam.duration_minutes },
                title: `${exam.unit_code}: ${exam.unit_name}`,
                description: `Strathmore Exam\nUnit: ${exam.unit_code}\nVenue: ${exam.venue}`,
                location: exam.venue,
                status: 'CONFIRMED',
                busyStatus: 'BUSY'
            };
        });

        ics.createEvents(events, (error, value) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Failed to generate iCal' });
            }
            res.setHeader('Content-Type', 'text/calendar');
            res.setHeader('Content-Disposition', 'attachment; filename="exams.ics"');
            res.send(value);
        });

    } catch (error) {
        console.error('iCal Export Error:', error);
        res.status(500).json({ error: 'Server error generating iCal' });
    }
};

module.exports = { generateTimetable, getMyExams, exportICal };
