const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
    let client;
    try {
        client = await db.getClient();
        const { email, password, role_name, student_no, first_name, last_name } = req.body;

        // Basic validation
        if (!email || !password || !role_name) {
            return res.status(400).json({ error: 'Please provide email, password, and role_name' });
        }

        await client.query('BEGIN');

        // 1. Get role_id
        const roleRes = await client.query('SELECT role_id FROM roles WHERE role_name = $1', [role_name]);
        if (roleRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid role_name' });
        }
        const role_id = roleRes.rows[0].role_id;

        // 2. Check if user exists
        const userExists = await client.query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'User already exists' });
        }

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Create user
        const userRes = await client.query(
            'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING user_id',
            [email, password_hash, role_id]
        );
        const user_id = userRes.rows[0].user_id;

        let specificId = null;

        // 5. If student, create student record
        if (role_name === 'student') {
            if (!student_no || !first_name || !last_name) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Student details missing' });
            }
            const studentRes = await client.query(
                'INSERT INTO students (user_id, student_no, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING student_id',
                [user_id, student_no, first_name, last_name]
            );
            specificId = studentRes.rows[0].student_id;
        }

        await client.query('COMMIT');

        const token = generateToken({ user_id, role_name, specificId });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { user_id, email, role_name }
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Registration error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Account with these details (email or student number) already exists' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    } finally {
        if (client) client.release();
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        // Fetch user + role
        const userRes = await db.query(`
            SELECT u.user_id, u.password_hash, u.is_active, r.role_name 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.email = $1
        `, [email]);

        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userRes.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Fetch specific role ID (student_id or admin_id)
        let specificId = null;
        if (user.role_name === 'student') {
            const stuRes = await db.query('SELECT student_id FROM students WHERE user_id = $1', [user.user_id]);
            if (stuRes.rows.length > 0) specificId = stuRes.rows[0].student_id;
        } else if (user.role_name === 'faculty_admin' || user.role_name === 'super_admin') {
            const admRes = await db.query('SELECT admin_id FROM faculty_admins WHERE user_id = $1', [user.user_id]);
            if (admRes.rows.length > 0) specificId = admRes.rows[0].admin_id;
        }

        const token = generateToken({ user_id: user.user_id, role_name: user.role_name, specificId });

        res.json({
            message: 'Login successful',
            token,
            user: { user_id: user.user_id, email, role_name: user.role_name }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

module.exports = { register, login };
