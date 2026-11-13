const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// GET /api/auth/health - Keep-alive for Render / Cron-job
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GET /api/auth/db-status - Diagnostic endpoint
router.get('/db-status', async (req, res) => {
  try {
    const timeRes = await db.query('SELECT NOW() as now');
    let userCount = 0;
    try {
      const countRes = await db.query('SELECT COUNT(*) as count FROM users');
      userCount = parseInt(countRes.rows[0].count, 10);
    } catch (e) {
      userCount = `Table users check: ${e.message}`;
    }

    return res.status(200).json({
      database: 'CONNECTED',
      serverTime: timeRes.rows[0].now,
      usersInDatabase: userCount,
    });
  } catch (err) {
    return res.status(500).json({
      database: 'DISCONNECTED / ERROR',
      error: err.message,
      code: err.code || 'UNKNOWN',
      tip: 'Please check DATABASE_URL in Render Dashboard Environment settings.',
    });
  }
});

// GET /api/auth/me - Get current logged-in user profile
router.get('/me', authenticateToken, async (req, res) => {
  return res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
  });
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim();

    // Check if user already exists (case-insensitive)
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash password with BCrypt (100% compatible with Spring Boot's BCryptPasswordEncoder)
    const hashedPassword = await bcrypt.hash(password, 10);

    // First user or specific emails can be auto-admins
    const role = (cleanEmail.toLowerCase() === 'kurupudisatyadevi2005@gmail.com' || cleanEmail.toLowerCase() === 'satyabanni@gmail.com') ? 'admin' : 'user';

    const { rows } = await db.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [cleanEmail, hashedPassword, role]
    );

    return res.status(200).json({ 
      message: 'User registered',
      user: { id: rows[0].id, email: rows[0].email, role: rows[0].role }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ 
      message: err.code === 'ECONNREFUSED' 
        ? 'Cannot connect to database. Please check DATABASE_URL in Render.' 
        : (err.message || 'Signup failed')
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim();

    // Query case-insensitively using LOWER(email)
    const { rows } = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)', 
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];

    // Safely verify password using BCrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const role = user.role || 'user';

    // Generate JWT token with email and role as payload
    const token = jwt.sign(
      { sub: user.email, email: user.email, role: role, id: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: role,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      message: err.code === 'ECONNREFUSED'
        ? 'Database connection failed. Please check DATABASE_URL in Render.'
        : (err.message || 'Internal server error during login')
    });
  }
});

// POST /api/auth/reset-password - Reset password using email
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim();

    // Check if user exists
    const { rows } = await db.query(
      'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, rows[0].id]
    );

    return res.status(200).json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Failed to reset password: ' + err.message });
  }
});

module.exports = router;
