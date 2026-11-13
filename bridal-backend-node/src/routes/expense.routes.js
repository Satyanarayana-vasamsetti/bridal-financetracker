const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// All expense routes require valid JWT authentication
router.use(authenticateToken);

// GET /api/expenses - Get expenses (Admin can filter by customerId or see all)
router.get('/', async (req, res) => {
  try {
    const { customerId } = req.query;
    const isAdmin = req.user.role === 'admin';

    let queryText = '';
    let queryParams = [];

    if (isAdmin && customerId === 'all') {
      // Admin viewing all customers' expenses
      queryText = `
        SELECT 
          x.id, 
          x.date, 
          x.expense_name AS "expenseName", 
          x.description, 
          x.service_type AS "serviceType", 
          x.amount, 
          x.notes,
          x.user_id AS "userId",
          u.email AS "userEmail"
        FROM expense x
        LEFT JOIN users u ON u.id = x.user_id
        ORDER BY x.id DESC`;
    } else if (isAdmin && customerId && customerId !== 'all') {
      // Admin viewing specific customer
      queryText = `
        SELECT 
          x.id, 
          x.date, 
          x.expense_name AS "expenseName", 
          x.description, 
          x.service_type AS "serviceType", 
          x.amount, 
          x.notes,
          x.user_id AS "userId"
        FROM expense x
        WHERE x.user_id = $1 
        ORDER BY x.id DESC`;
      queryParams = [customerId];
    } else {
      // Normal user (or admin without filter) viewing own expenses
      queryText = `
        SELECT 
          id, 
          date, 
          expense_name AS "expenseName", 
          description, 
          service_type AS "serviceType", 
          amount, 
          notes,
          user_id AS "userId"
        FROM expense 
        WHERE user_id = $1 
        ORDER BY id DESC`;
      queryParams = [req.user.id];
    }

    const { rows } = await db.query(queryText, queryParams);
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ message: 'Failed to fetch expenses: ' + err.message });
  }
});

// POST /api/expenses - Add new expense
router.post('/', async (req, res) => {
  try {
    const { date, expenseName, description, serviceType, amount, notes, userId } = req.body;
    const isAdmin = req.user.role === 'admin';

    const targetUserId = (isAdmin && userId) ? userId : req.user.id;

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
        notes,
        user_id AS "userId"`,
      [date || '', expenseName || '', description || '', serviceType || 'Bridal', amount || 0, notes || '', targetUserId]
    );

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ message: 'Failed to create expense: ' + err.message });
  }
});

// PUT /api/expenses/:id - Update existing expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, expenseName, description, serviceType, amount, notes } = req.body;
    const isAdmin = req.user.role === 'admin';

    const condition = isAdmin ? 'WHERE id = $7' : 'WHERE id = $7 AND user_id = $8';
    const params = [
      date || '', 
      expenseName || '', 
      description || '', 
      serviceType || 'Bridal', 
      amount || 0, 
      notes || '', 
      id
    ];
    if (!isAdmin) {
      params.push(req.user.id);
    }

    const { rows } = await db.query(
      `UPDATE expense 
       SET date = $1, 
           expense_name = $2, 
           description = $3, 
           service_type = $4, 
           amount = $5, 
           notes = $6 
       ${condition}
       RETURNING 
        id, 
        date, 
        expense_name AS "expenseName", 
        description, 
        service_type AS "serviceType", 
        amount, 
        notes,
        user_id AS "userId"`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ message: 'Failed to update expense: ' + err.message });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const condition = isAdmin ? 'WHERE id = $1' : 'WHERE id = $1 AND user_id = $2';
    const params = isAdmin ? [id] : [id, req.user.id];

    await db.query(`DELETE FROM expense ${condition}`, params);

    res.status(200).send();
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: 'Failed to delete expense: ' + err.message });
  }
});

module.exports = router;
