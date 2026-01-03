require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiKey = authHeader && authHeader.split(' ')[1];

    if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized: No API Key provided' });
    }

    // In a real scenario, you'd check this against a DB or a more secure config
    if (apiKey !== process.env.BACKEND_API_KEY) {
        return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }

    next();
};

module.exports = authMiddleware;
