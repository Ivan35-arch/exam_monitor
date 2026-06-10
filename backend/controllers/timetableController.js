const db = require('../db');
const { parseTimetable } = require('../services/pdfParser');

const uploadTimetable = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    const admin_id = req.user.specificId; // from auth middleware
    if (!admin_id) {
        return res.status(403).json({ error: 'Only faculty admins can upload timetables' });
    }

    const { title, semester, academic_year } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // 1. Create official_timetables record
        const otRes = await client.query(
            `INSERT INTO official_timetables (admin_id, title, semester, academic_year, file_path, status) 
             VALUES ($1, $2, $3, $4, $5, 'draft') RETURNING timetable_id`,
            [admin_id, title, semester, academic_year, req.file.path]
        );
        const timetable_id = otRes.rows[0].timetable_id;

        // 2. Parse PDF
        const parsedExams = await parseTimetable(req.file.buffer);

        // Fetch all groups for quick mapping (group_name -> {group_id, course_id})
        const groupsRes = await client.query('SELECT group_id, course_id, group_name FROM groups');
        const groupsMap = {};
        for (let g of groupsRes.rows) {
            groupsMap[g.group_name.toLowerCase()] = { group_id: g.group_id, course_id: g.course_id };
        }

        let insertedCount = 0;
        let unmappedGroups = new Set();

        // 3. Insert Exam Entries
        for (let exam of parsedExams) {
            const groupLower = exam.group_name.toLowerCase();
            const groupInfo = groupsMap[groupLower];

            if (groupInfo) {
                // Insert into exam_entries ON CONFLICT DO NOTHING
                const insertRes = await client.query(
                    `INSERT INTO exam_entries 
                     (timetable_id, course_id, group_id, unit_code, unit_name, exam_date, exam_time, duration_minutes, venue)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     ON CONFLICT (timetable_id, unit_code, group_id) DO NOTHING`,
                    [
                        timetable_id,
                        groupInfo.course_id,
                        groupInfo.group_id,
                        exam.unit_code,
                        exam.unit_name,
                        exam.exam_date,
                        exam.exam_time,
                        exam.duration_minutes,
                        exam.venue
                    ]
                );
                if (insertRes.rowCount > 0) insertedCount++;
            } else {
                unmappedGroups.add(exam.group_name);
            }
        }

        // 4. Log Activity
        await client.query(
            `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, $2, $3)`,
            [req.user.user_id, 'PDF_UPLOAD', `Uploaded timetable: ${title}. Parsed ${parsedExams.length} rows, inserted ${insertedCount} exams.`]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Timetable uploaded and parsed successfully',
            timetable_id,
            total_parsed: parsedExams.length,
            total_inserted: insertedCount,
            unmapped_groups: Array.from(unmappedGroups) // Useful for debugging/seeding
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to process timetable' });
    } finally {
        client.release();
    }
};

const getTimetables = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT timetable_id, title, semester, academic_year, status, uploaded_at, published_at
            FROM official_timetables
            ORDER BY uploaded_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Get Timetables Error:', error);
        res.status(500).json({ error: 'Failed to fetch timetables' });
    }
};

const publishTimetable = async (req, res) => {
    const admin_id = req.user.specificId;
    if (!admin_id || req.user.role_name !== 'faculty_admin' && req.user.role_name !== 'super_admin') {
        return res.status(403).json({ error: 'Only admins can publish timetables' });
    }

    const { id } = req.params;

    try {
        const result = await db.query(
            `UPDATE official_timetables 
             SET status = 'published', published_at = NOW(), updated_at = NOW() 
             WHERE timetable_id = $1 AND status = 'draft'
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Timetable not found or already published' });
        }

        // Log Activity
        await db.query(
            `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, $2, $3)`,
            [req.user.user_id, 'TIMETABLE_PUBLISHED', `Published timetable: ${result.rows[0].title}`]
        );

        res.json({ message: 'Timetable published successfully', timetable: result.rows[0] });
    } catch (error) {
        console.error('Publish Timetable Error:', error);
        res.status(500).json({ error: 'Failed to publish timetable' });
    }
};

module.exports = { uploadTimetable, getTimetables, publishTimetable };
