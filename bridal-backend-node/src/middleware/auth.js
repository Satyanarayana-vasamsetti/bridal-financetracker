const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mySecretKeyForBridalFinanceTrackerApp1234567890VerySecureKey';

async function authenticateToken(req, res, next) {
  // CORS Preflight OPTIONS requests don't need authentication
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.sub || decoded.email;

    if (!email) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const { rows } = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = rows[0]; // { id: ..., email: ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET,
};
