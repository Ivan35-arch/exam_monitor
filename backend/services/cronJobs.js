const cron = require('node-cron');
const db = require('../db');

// Run everyday at 08:00 AM
const startCronJobs = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily 08:00 exam reminder job...');
        try {
            const query = `
                SELECT sr.student_id, e.exam_id, e.unit_code, e.unit_name, e.exam_date, e.exam_time, e.venue
                FROM exam_entries e
                JOIN student_registrations sr ON sr.course_id = e.course_id AND sr.group_id = e.group_id
                JOIN official_timetables ot ON ot.timetable_id = e.timetable_id
                WHERE ot.status = 'published'
                  AND e.exam_date = CURRENT_DATE + INTERVAL '1 day'
            `;
            
            const result = await db.query(query);
            let notificationsInserted = 0;

            if (result.rows.length > 0) {
                const client = await db.getClient();
                try {
                    await client.query('BEGIN');
                    for (let exam of result.rows) {
                        const message = `Reminder: Your exam for ${exam.unit_code} (${exam.unit_name}) is tomorrow at ${exam.exam_time} in ${exam.venue}.`;
                        await client.query(
                            'INSERT INTO notifications (student_id, exam_id, message) VALUES ($1, $2, $3)',
                            [exam.student_id, exam.exam_id, message]
                        );
                        notificationsInserted++;
                    }
                    await client.query('COMMIT');
                } catch (e) {
                    await client.query('ROLLBACK');
                    console.error('Error inserting notifications:', e);
                } finally {
                    client.release();
                }
            }

            console.log(`Cron job finished. Inserted ${notificationsInserted} reminders for tomorrow's exams.`);
        } catch (error) {
            console.error('Cron Job failed to execute:', error);
        }
    });
};

module.exports = { startCronJobs };
