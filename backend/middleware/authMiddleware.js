const jwt = require('jsonwebtoken');

const protect = (roles = []) => {
    return (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Not authorized, no token provided' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Expected payload from login: { userId, roleId, roleName, specificId (student_id or admin_id) }
            req.user = decoded;

            if (roles.length && !roles.includes(req.user.roleName)) {
                return res.status(403).json({ error: 'Forbidden, insufficient permissions' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    };
};

module.exports = { protect };
