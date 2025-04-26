const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({ message: 'Authentication is required. '});
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            user_id: decoded.user_id,
            user_email: decoded.user_email,
        };

        next();
    } catch (err) {
        if(err.name === ' TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired. Please login again.'});
        } else {
            return res.status(401).json({ message: 'Invalid token. '});
        }  
    }
};

module.exports = authMiddleware;