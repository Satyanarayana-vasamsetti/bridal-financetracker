const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All admin routes require valid authentication AND admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/customers - List all customers with their financial statistics
router.get('/customers', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        u.id, 
        u.email, 
        u.role,
        COALESCE(ev.events_count, 0)::int AS "eventsCount",
        COALESCE(ev.total_income, 0)::float AS "totalIncome",
        COALESCE(ex.expenses_count, 0)::int AS "expensesCount",
        COALESCE(ex.total_expenses, 0)::float AS "totalExpenses"
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS events_count, SUM(amount)::float AS total_income
        FROM bridal_event
        GROUP BY user_id
      ) ev ON ev.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS expenses_count, SUM(amount)::float AS total_expenses
        FROM expense
        GROUP BY user_id
      ) ex ON ex.user_id = u.id
      ORDER BY u.id ASC
    `);

    // Calculate net profit for each user
    const customersWithProfit = rows.map(c => ({
      ...c,
      netProfit: (c.totalIncome || 0) - (c.totalExpenses || 0),
    }));

    res.status(200).json(customersWithProfit);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Failed to fetch customers: ' + err.message });
  }
});

// POST /api/admin/customers - Admin creates a new customer account
router.post('/customers', async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [cleanEmail, hashedPassword, role]
    );

    res.status(201).json({ 
      message: `Customer ${cleanEmail} created successfully.`, 
      user: rows[0] 
    });
  } catch (err) {
    console.error('Admin create customer error:', err);
    res.status(500).json({ message: 'Failed to create customer: ' + err.message });
  }
});

// POST /api/admin/customers/:id/reset-password - Admin resets any customer's password
router.post('/customers/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const { rows } = await db.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);

    res.status(200).json({ 
      message: `Password for ${rows[0].email} has been reset successfully.` 
    });
  } catch (err) {
    console.error('Admin password reset error:', err);
    res.status(500).json({ message: 'Failed to reset password: ' + err.message });
  }
});

// PUT /api/admin/customers/:id/role - Admin promotes or demotes a customer role
router.put('/customers/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: "Role must be 'admin' or 'user'" });
    }

    const { rows } = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [role, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ 
      message: `Role for ${rows[0].email} updated to ${role}.`,
      user: rows[0]
    });
  } catch (err) {
    console.error('Admin role update error:', err);
    res.status(500).json({ message: 'Failed to update role: ' + err.message });
  }
});

// DELETE /api/admin/customers/:id - Admin deletes a customer
router.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Admin delete customer error:', err);
    res.status(500).json({ message: 'Failed to delete customer: ' + err.message });
  }
});

module.exports = router;
