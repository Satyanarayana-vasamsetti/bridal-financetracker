const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// All expense routes require valid JWT authentication
router.use(authenticateToken);

// GET /api/expenses - Get all expenses for the logged-in user
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT 
        id, 
        date, 
        expense_name AS "expenseName", 
        description, 
        service_type AS "serviceType", 
        amount, 
        notes 
       FROM expense 
       WHERE user_id = $1 
       ORDER BY id DESC`,
      [req.user.id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses - Add new expense
router.post('/', async (req, res) => {
  try {
    const { date, expenseName, description, serviceType, amount, notes } = req.body;

    const { rows } = await db.query(
      `INSERT INTO expense (date, expense_name, description, service_type, amount, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING 
        id, 
        date, 
        expense_name AS "expenseName", 
        description, 
        service_type AS "serviceType", 
        amount, 
        notes`,
      [date || '', expenseName || '', description || '', serviceType || 'Bridal', amount || 0, notes || '', req.user.id]
    );

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ message: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id - Update existing expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, expenseName, description, serviceType, amount, notes } = req.body;

    const { rows } = await db.query(
      `UPDATE expense 
       SET date = $1, 
           expense_name = $2, 
           description = $3, 
           service_type = $4, 
           amount = $5, 
           notes = $6 
       WHERE id = $7 AND user_id = $8
       RETURNING 
        id, 
        date, 
        expense_name AS "expenseName", 
        description, 
        service_type AS "serviceType", 
        amount, 
        notes`,
      [date || '', expenseName || '', description || '', serviceType || 'Bridal', amount || 0, notes || '', id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'DELETE FROM expense WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.status(200).send();
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

module.exports = router;
