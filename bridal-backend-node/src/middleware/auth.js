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

    const { rows } = await db.query(
      'SELECT id, email, role FROM users WHERE LOWER(email) = LOWER($1)', 
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: rows[0].id,
      email: rows[0].email,
      role: rows[0].role || 'user',
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Admin authorization middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET,
};
